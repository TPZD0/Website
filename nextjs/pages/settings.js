import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Settings as SettingsView } from '@/components/figma/Settings';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '', email: '', name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
        let resp;
        try {
          resp = await fetch(`${apiBase}/api/users/me`, { credentials: 'include' });
        } catch (_err) {
          resp = await fetch(`/api/users/me`, { credentials: 'include' });
        }
        if (!resp.ok) throw new Error('Failed to load profile');
        const data = await resp.json();
        if (cancelled) return;
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
        setUser({ id: String(data.user_id), email: data.email, name: fullName || data.username });
      } catch (_e) {
        // If unauthenticated, send to login
        router.replace('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [router]);

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));
  const setCurrentPage = () => router.push('/dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {!loading && <SettingsView user={user} updateUser={updateUser} setCurrentPage={setCurrentPage} />}
      </div>
    </div>
  );
}
