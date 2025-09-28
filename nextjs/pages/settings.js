import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Settings as SettingsView } from '@/components/figma/Settings';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState({ id: 'u1', email: 'user@example.com', name: 'User' });

  const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }));
  const setCurrentPage = (page) => router.push('/dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <SettingsView user={user} updateUser={updateUser} setCurrentPage={setCurrentPage} />
      </div>
    </div>
  );
}
