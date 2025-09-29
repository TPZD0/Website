import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Dashboard as DashboardView } from '@/components/figma/Dashboard';
import Link from 'next/link';
import { Settings as SettingsIcon, LogOut, User as UserIcon, Clock3 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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
  const [sessionStats, setSessionStats] = useState({ today_seconds: 0, week_seconds: 0, last_session_seconds: 0 });

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
          // Load session stats (today + last)
          try {
            const sess = await fetch('/api/session/stats', { credentials: 'include' });
            if (sess.ok) {
              const s = await sess.json();
              setSessionStats(s);
            }
          } catch {}
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
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent text-sm"
                aria-label="View time stats"
                title={`Time today: ${Math.floor((sessionStats.today_seconds||0)/3600)}h ${Math.floor(((sessionStats.today_seconds||0)%3600)/60)}m`}
              >
                <Clock3 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {Math.floor((sessionStats.today_seconds||0)/3600)}h {Math.floor(((sessionStats.today_seconds||0)%3600)/60)}m
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-2">
                <div className="font-medium">Study Time</div>
                <div className="text-sm text-muted-foreground">Quick breakdown from your recent sessions.</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground">Today</div>
                    <div className="font-semibold">
                      {Math.floor((sessionStats.today_seconds||0)/3600)}h {Math.floor(((sessionStats.today_seconds||0)%3600)/60)}m
                    </div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground">Last session</div>
                    <div className="font-semibold">
                      {Math.floor((sessionStats.last_session_seconds||0)/3600)}h {Math.floor(((sessionStats.last_session_seconds||0)%3600)/60)}m
                    </div>
                  </div>
                  <div className="rounded-md border p-2 col-span-2">
                    <div className="text-muted-foreground">Last 7 days</div>
                    <div className="font-semibold">
                      {Math.floor((sessionStats.week_seconds||0)/3600)}h {Math.floor(((sessionStats.week_seconds||0)%3600)/60)}m
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Sessions update as you navigate. Close to continue.
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
