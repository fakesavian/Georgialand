import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith('/')) return '/dashboard';
  if (next.startsWith('//')) return '/dashboard';
  return next;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const next = useMemo(() => getSafeNext(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const code = searchParams.get('code');
      const errorDescription = searchParams.get('error_description') || searchParams.get('error');

      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!data.session) {
          throw new Error('Auth finished, but no session was created. Please try signing in again.');
        }

        if (!cancelled) {
          navigate(next, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to finish sign-in. Please try again.');
        }
      }
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, next, searchParams]);

  return (
    <div className="min-h-screen bg-olive-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-900/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center px-4">
        <Link to="/" className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-glow-brand">
          <MapPin size={24} className="text-white" />
        </Link>
        <h2 className="text-center text-3xl font-display font-bold text-white tracking-tight">
          Finishing sign-in
        </h2>
        <p className="mt-2 text-center text-sm text-olive-400">
          Securely connecting your Georgia Land account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-olive-900/50 py-8 px-4 shadow-xl border border-surface-border rounded-2xl sm:px-10 backdrop-blur-sm text-center">
          {error ? (
            <>
              <div className="mx-auto mb-5 w-12 h-12 rounded-full bg-accent-danger/20 flex items-center justify-center">
                <AlertTriangle className="text-accent-danger" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sign-in could not be completed</h3>
              <p className="text-sm text-olive-300 mb-6">{error}</p>
              <Link
                to="/login"
                className="inline-flex justify-center items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-olive-950 hover:bg-brand-400 transition-colors"
              >
                Back to login
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 w-12 h-12 rounded-full bg-brand-950/60 flex items-center justify-center">
                <Loader2 className="text-brand-400 animate-spin" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Almost done...</h3>
              <p className="text-sm text-olive-300 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-brand-400" />
                Verifying your session and redirecting you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
