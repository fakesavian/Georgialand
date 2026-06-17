import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { AccessLevel, UserProfile } from './authTypes';

const ADMIN_TEST_TIER_KEY = 'glf_admin_test_tier';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  /** Effective access level used for all feature gating. Equals realAccessLevel unless
   *  an admin has an active test-tier override. Use this for canExport(), getMaxRowsAllowed(), etc. */
  accessLevel: AccessLevel;
  /** Raw profile access_level from the database. Always the true Stripe-backed tier.
   *  Use this for admin-route protection and billing display — never overridden by test mode. */
  realAccessLevel: AccessLevel;
  /** True when an admin has a test-tier override active. Drives the "Test mode" indicator in the UI. */
  isAdminTestMode: boolean;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  /** Set a test-tier override (admin-only). Pass null to reset to real tier. */
  setTestTierOverride: (level: AccessLevel | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  accessLevel: 'free_preview',
  realAccessLevel: 'free_preview',
  isAdminTestMode: false,
  session: null,
  isLoading: true,
  signOut: async () => {},
  setTestTierOverride: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [testTierOverride, setTestTierOverrideState] = useState<AccessLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const localDashboardBypass = import.meta.env.VITE_LOCAL_DASHBOARD_BYPASS === 'true';
  const localAccessLevel = import.meta.env.VITE_LOCAL_ACCESS_LEVEL as AccessLevel | undefined;

  // True profile-based tier — never overridden by test mode
  const realAccessLevel: AccessLevel =
    localDashboardBypass && localAccessLevel
      ? localAccessLevel
      : profile?.access_level || 'free_preview';

  const isAdmin = realAccessLevel === 'admin';
  // Test mode only activates when the actual profile is admin — a stored key from a non-admin is ignored
  const isAdminTestMode = isAdmin && testTierOverride !== null;
  const accessLevel: AccessLevel = isAdminTestMode ? testTierOverride! : realAccessLevel;

  const setTestTierOverride = useCallback((level: AccessLevel | null) => {
    if (!isAdmin) return; // silently reject non-admin attempts
    if (level === null) {
      sessionStorage.removeItem(ADMIN_TEST_TIER_KEY);
    } else {
      sessionStorage.setItem(ADMIN_TEST_TIER_KEY, level);
    }
    setTestTierOverrideState(level);
  }, [isAdmin]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error initializing auth session:', error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Unexpected error initializing auth session:', err);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setTestTierOverrideState(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else if (data) {
        const fetchedProfile = data as UserProfile;
        setProfile(fetchedProfile);
        // Restore session test-tier override — only apply if this user is truly admin
        if (fetchedProfile.access_level === 'admin') {
          const stored = sessionStorage.getItem(ADMIN_TEST_TIER_KEY) as AccessLevel | null;
          if (stored) setTestTierOverrideState(stored);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem(ADMIN_TEST_TIER_KEY);
    setTestTierOverrideState(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, profile, accessLevel, realAccessLevel, isAdminTestMode,
      session, isLoading, signOut, setTestTierOverride,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
