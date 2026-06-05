import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Mail, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchParams] = useSearchParams();

  const buildRedirectUrl = () => {
    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing');
    const destination = plan
      ? `/pricing?plan=${encodeURIComponent(plan)}&billing=${encodeURIComponent(billing || 'monthly')}`
      : '/dashboard';
    return `${window.location.origin}${destination}`;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildRedirectUrl(),
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link to verify your account!' });
      setEmail('');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildRedirectUrl(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-olive-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-900/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-glow-brand">
          <MapPin size={24} className="text-white" />
        </Link>
        <h2 className="text-center text-3xl font-display font-bold text-white tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-olive-400">
          Or{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            log in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-olive-900/50 py-8 px-4 shadow-xl border border-surface-border sm:rounded-2xl sm:px-10 backdrop-blur-sm">
          
          <button
            onClick={handleGoogleSignup}
            className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-olive-700 rounded-lg shadow-sm bg-olive-800 text-sm font-medium text-white hover:bg-olive-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-olive-950"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-olive-900 text-olive-500">Or sign up with email</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleMagicLink}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-olive-200">
                Email address
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-olive-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-olive-700 rounded-lg bg-olive-950 text-white placeholder-olive-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                  placeholder="investor@example.com"
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${
                message.type === 'success' 
                  ? 'bg-brand-950/50 text-brand-400 border-brand-800' 
                  : 'bg-accent-danger/20 text-accent-danger border-accent-danger/40'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-olive-950 bg-brand-500 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-olive-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  Send Magic Link <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-xs text-olive-500 text-center mt-4">
              By signing up, you agree to our <Link to="/terms" className="underline hover:text-olive-300">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-olive-300">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
