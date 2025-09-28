import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Summarizer as SummarizerView } from '@/components/figma/Summarizer';

export default function SummarizerPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load user's summary history from database
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

    const loadSummaryHistory = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setIsLoadingHistory(false);
          return;
        }

        const response = await fetch(`/api/ai/user-summaries/${userId}`);
        if (response.ok) {
          const summaries = await response.json();
          setHistory(summaries);
        } else {
          console.error('Failed to load summary history');
        }
      } catch (error) {
        console.error('Error loading summary history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    (async () => {
      const ok = await ensureAuth();
      if (ok) await loadSummaryHistory();
      setIsLoadingHistory(false);
    })();
  }, [router]);

  const setCurrentPage = (page) => {
    const map = {
      dashboard: '/dashboard',
    };
    router.push(map[page] || '/dashboard');
  };

  const addSummary = (summary) => {
    // Add to local state immediately for responsive UI
    setHistory((prev) => [summary, ...prev]);
  };

  const deleteSummary = (id) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  };

  const renameSummary = (id, newTitle) => {
    setHistory((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your summaries...</p>
            </div>
          </div>
        ) : (
          <SummarizerView
            summaryHistory={history}
            addSummary={addSummary}
            deleteSummary={deleteSummary}
            renameSummary={renameSummary}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
