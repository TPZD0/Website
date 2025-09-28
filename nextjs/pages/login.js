import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoginPage } from '@/components/figma/LoginPage';

export default function Login() {
  const router = useRouter();

  // Handle redirect back from FastAPI Google callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === '1') {
      const userId = params.get('user_id');
      const username = params.get('username');
      const email = params.get('email');
      const firstName = params.get('first_name');
      const lastName = params.get('last_name');
      try {
        if (userId) localStorage.setItem('userId', userId);
        if (username) localStorage.setItem('username', username);
        if (email) localStorage.setItem('userEmail', email);
        if (firstName) localStorage.setItem('firstName', firstName);
        if (lastName) localStorage.setItem('lastName', lastName);
      } catch {}
      router.replace('/dashboard');
    }
  }, [router]);

  return <LoginPage />;
}
