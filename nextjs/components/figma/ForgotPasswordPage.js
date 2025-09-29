import { useState } from 'react';
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      let resp;
      try {
        resp = await fetch(`${apiBase}/api/auth/forgot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (_err) {
        resp = await fetch(`/api/auth/forgot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      }
      // Always show success, API does not reveal if email exists
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'Unable to send reset email');
      }
      setSuccess('If an account exists, we sent a reset link to your email.');
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send reset email');
    } finally {
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
              <h2 className="text-3xl font-semibold text-[#101431]" style={{ fontSize: '2.25rem' }}>Forgot Password</h2>
            </div>

            {success && (
              <div className="rounded-lg border border-[#A3E3C4] bg-[#E3F8ED] px-4 py-3 text-sm text-[#146C43]">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-base font-medium text-[#101431]" style={{ fontSize: '1.125rem' }}>
                  Email
                </Label>
                <Input
                  id="forgot-email"
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
              <Button
                type="submit"
                className="h-12 w-full rounded-xl !bg-[#0B0A1A] !text-white font-semibold shadow transition hover:!bg-[#0B0A1A]/90 disabled:!bg-[#0B0A1A]/70"
                disabled={loading}
                style={{ fontSize: '1.1875rem' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="text-center text-base text-[#5F6683]" style={{ fontSize: '1.0625rem' }}>
              Remembered your password?{' '}
              <a className="font-semibold text-[#0B0A1A] hover:underline" href="/login">
                Back to Sign in
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

