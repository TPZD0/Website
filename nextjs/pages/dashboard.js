import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Dashboard as DashboardView } from '@/components/figma/Dashboard';
import Link from 'next/link';
import { Settings as SettingsIcon, LogOut, User as UserIcon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [goalStats, setGoalStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    overdueGoals: 0,
    completionRate: 0,
    chartData: []
  });
  const [username, setUsername] = useState('User');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const me = await fetch('/api/auth/me');
        if (me.status === 401) {
          router.replace('/login');
          return false;
        }
      } catch {
        router.replace('/login');
        return false;
      }
      return true;
    };

    const loadUserData = async () => {
      try {
        const name = localStorage.getItem('username');
        const userId = localStorage.getItem('userId');
        
        if (name) setUsername(name);
        
        if (userId) {
          // Load goal statistics from database
          const response = await fetch(`/api/goals/${userId}/stats`);
          if (response.ok) {
            const stats = await response.json();
            setGoalStats(stats);
          } else {
            console.error('Failed to load goal statistics');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    (async () => {
      const ok = await ensureAuth();
      if (ok) await loadUserData();
      setIsLoadingStats(false);
    })();
  }, [router]);

  const updateGoalStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`/api/goals/${userId}/stats`);
        if (response.ok) {
          const stats = await response.json();
          setGoalStats(stats);
        }
      }
    } catch (error) {
      console.error('Error updating goal stats:', error);
    }
  };

  const setCurrentPage = (page) => {
    const map = {
      dashboard: '/dashboard',
      goals: '/goals',
      quiz: '/quiz',
      summarizer: '/summarizer',
      settings: '/settings',
    };
    router.push(map[page] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-end gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <span className="font-medium">{username}</span>
          </div>
          <Link href="/settings" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent text-sm">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <button
            onClick={() => {
              try { localStorage.removeItem('username'); localStorage.removeItem('userEmail'); localStorage.removeItem('userId'); } catch {}
              fetch('/api/auth/logout', { method: 'POST' }).finally(() => router.push('/login'));
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
        {isLoadingStats ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <DashboardView goalStats={goalStats} setCurrentPage={setCurrentPage} updateGoalStats={updateGoalStats} />
        )}
      </div>
    </div>
  );
}
