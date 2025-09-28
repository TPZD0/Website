import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ImageWithFallback } from './ImageWithFallback';
import { HERO_COPY, HERO_FEATURES, HERO_HEADLINE, HERO_IMAGE } from './authContent';

const inputStyles = (
  'h-12 rounded-xl border border-transparent bg-[#F5F6FB] px-4 text-base font-medium text-[#101431] '
  + 'placeholder:text-[#A0A6BD] shadow-sm transition focus-visible:border-[#C2CAF7] '
  + 'focus-visible:ring-2 focus-visible:ring-[#C2CAF7]/60 disabled:bg-[#E8EBFF]'
);

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      setInfo('Email verified. You can now sign in.');
    }
    if (params.get('checkEmail') === '1') {
      setInfo('Check your email for a verification link.');
    }
  }, []);

  const handleGoogleLogin = () => {
    try {
      setLoading(true);
      setError('');
      setInfo('');
      window.location.href = '/api/auth/google/login';
    } catch (e) {
      setError('Unable to start Google login.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
        credentials: 'include',
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'Login failed');
      }
      const data = await resp.json();
      try {
        if (data.user_id) localStorage.setItem('userId', String(data.user_id));
        if (data.username) localStorage.setItem('username', data.username);
        if (data.email) localStorage.setItem('userEmail', data.email);
        if (data.first_name) localStorage.setItem('firstName', data.first_name);
        if (data.last_name) localStorage.setItem('lastName', data.last_name);
      } catch {}
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-[#EEF1FF] to-[#F4F6FF]">
      <div className="relative flex items-center justify-center overflow-hidden">
        <ImageWithFallback
          src={HERO_IMAGE}
          alt="Students studying in library"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(6px)', transform: 'scale(1.06)', transformOrigin: 'center' }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex w-full max-w-xl flex-col gap-6 pl-14 pr-10 md:pl-16 py-16 text-white" style={{ paddingLeft: '4rem' }}>
          <h1 className="text-4xl font-semibold leading-tight" style={{ fontSize: '3.25rem', lineHeight: 1.1, letterSpacing: '-0.01em', textShadow: '0 1px 1px rgba(0,0,0,0.35)', fontWeight: 800 }}>{HERO_HEADLINE}</h1>
          <p className="text-lg leading-relaxed text-white/90" style={{ fontSize: '1.375rem', lineHeight: 1.85, maxWidth: '44rem', textShadow: '0 1px 1px rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.96)' }}>{HERO_COPY}</p>
          <ul className="space-y-4 text-base text-white/90 list-none" style={{ fontSize: '1.375rem', color: 'rgba(255,255,255,0.96)', lineHeight: 1.85, fontWeight: 400 }}>
            {HERO_FEATURES.map((feature) => (
              <li key={`hero-${feature}`}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Card className="flex w-full flex-col gap-6 rounded-[32px] border-0 bg-white/90 p-10 shadow-[0px_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[#101431]" style={{ fontSize: '2.25rem' }}>Sign In</h2>
            </div>

            {info && (
              <div className="rounded-lg border border-[#BFCFFE] bg-[#E6ECFF] px-4 py-3 text-sm text-[#1E2A78]">
                {info}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-base font-medium text-[#101431]" style={{ fontSize: '1.125rem' }}>
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={inputStyles}
                  required
                  disabled={loading}
                  style={{ fontSize: '1.125rem' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-base font-medium text-[#101431]" style={{ fontSize: '1.125rem' }}>
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputStyles}
                  required
                  minLength={8}
                  disabled={loading}
                  style={{ fontSize: '1.125rem' }}
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl !bg-[#0B0A1A] !text-white font-semibold shadow transition hover:!bg-[#0B0A1A]/90 disabled:!bg-[#0B0A1A]/70"
                disabled={loading}
                style={{ fontSize: '1.1875rem' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="pt-1 text-center text-base" style={{ fontSize: '1.0625rem' }}>
              <a href="/forgot-password" className="font-medium text-[#0B0A1A] hover:underline">
                Forgot your password?
              </a>
            </div>

            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-[#E3E7F4]" />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E3E7F4] bg-white text-sm font-medium text-[#5F6683]">or</span>
              <span className="h-px flex-1 bg-[#E3E7F4]" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border border-[#E0E5F5] bg-white font-semibold text-[#101431] hover:bg-[#F6F7FF]"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ fontSize: '1.125rem' }}
            >
              <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </span>
                Continue with Google
              </Button>

            <p className="text-center text-base text-[#5F6683]" style={{ fontSize: '1.0625rem' }}>
              Don't have an account?{' '}
              <a className="font-semibold text-[#0B0A1A] hover:underline" href="/register">
                Sign up
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
