import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Quiz as QuizView } from '@/components/figma/Quiz';
import { sampleQuizHistory } from '@/lib/sampleData';

export default function QuizPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load quiz history from database
  useEffect(() => {
    const loadQuizHistory = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setIsLoadingHistory(false);
          return;
        }

        const response = await fetch(`/api/ai/quiz-history/${userId}`);
        if (response.ok) {
          const quizHistory = await response.json();
          
          // Group sessions by file_name to show proper attempt counts
          const groupedSessions = {};
          quizHistory.forEach(session => {
            const key = session.file_name;
            if (!groupedSessions[key]) {
              groupedSessions[key] = {
                sessions: [],
                latestSession: session
              };
            }
            groupedSessions[key].sessions.push(session);
            // Keep the most recent session as the latest
            if (new Date(session.created_at) > new Date(groupedSessions[key].latestSession.created_at)) {
              groupedSessions[key].latestSession = session;
            }
          });

          // Transform database format to match frontend expectations
          const transformedHistory = Object.values(groupedSessions).map(group => {
            const latest = group.latestSession;
            const allAttempts = group.sessions.map(s => ({
              score: s.score || 0,
              totalQuestions: s.total_questions || 0,
              completedAt: s.completed_at,
              answers: {}
            }));

            return {
              id: `quiz-${latest.id}`,
              title: `${latest.file_name} Quiz`,
              fileName: latest.file_name,
              createdAt: latest.created_at,
              flashcards: Array(latest.total_questions || 0).fill(null).map((_, i) => ({
                id: `${i + 1}`,
                question: `Question ${i + 1}`,
                answer: `Answer ${i + 1}`
              })),
              quizQuestions: [], // Will be loaded when needed
              attempts: allAttempts,
              lastResult: latest.completed ? {
                score: latest.score || 0,
                totalQuestions: latest.total_questions || 0,
                completedAt: latest.completed_at,
                answers: {}
              } : undefined,
              sessionId: latest.id,
              difficulty: latest.difficulty || 'medium'
            };
          });
          
          setHistory(transformedHistory);
        } else {
          console.error('Failed to load quiz history');
        }
      } catch (error) {
        console.error('Error loading quiz history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadQuizHistory();
  }, []);

  const setCurrentPage = (page) => {
    const map = {
      dashboard: '/dashboard',
    };
    router.push(map[page] || '/dashboard');
  };

  const addQuizSet = (set) => {
    // Add to local state immediately for responsive UI
    const id = `gen-${Date.now()}`;
    setHistory((prev) => [{ ...set, id }, ...prev]);
  };
  
  const deleteQuizSet = async (id) => {
    // For now, just remove from local state
    // TODO: Add API call to delete from database if needed
    setHistory((prev) => prev.filter((s) => s.id !== id));
  };
  
  const renameQuizSet = async (id, newTitle) => {
    // For now, just update local state
    // TODO: Add API call to update database if needed
    setHistory((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };
  const navigateToQuiz = (quizId) => {
    router.push(`/quiz/${quizId}`);
  };

  const reloadHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`/api/ai/quiz-history/${userId}`);
      if (response.ok) {
        const quizHistory = await response.json();
        
        // Transform database format to match frontend expectations
        // Backend now returns grouped sessions with attempt counts
        const transformedHistory = quizHistory.map(session => {
          return {
            id: `quiz-${session.id}`,
            title: `${session.file_name} Quiz`,
            fileName: session.file_name,
            createdAt: session.created_at,
            flashcards: Array(session.total_questions || 0).fill(null).map((_, i) => ({
              id: `${i + 1}`,
              question: `Question ${i + 1}`,
              answer: `Answer ${i + 1}`
            })),
            quizQuestions: [], // Will be loaded when needed
            attempts: Array(session.total_attempts || 1).fill(null).map((_, i) => ({
              score: i === 0 ? (session.score || 0) : 0, // Only show latest score for first attempt
              totalQuestions: session.total_questions || 0,
              completedAt: i === 0 ? session.completed_at : null,
              answers: {}
            })),
            lastResult: session.completed ? {
              score: session.score || 0,
              totalQuestions: session.total_questions || 0,
              completedAt: session.completed_at,
              answers: {}
            } : undefined,
            sessionId: session.id,
            fileId: session.file_id,
            difficulty: session.difficulty || 'medium',
            totalAttempts: session.total_attempts || 1,
            latestScore: session.score || 0,
            percentage: session.percentage || 0
          };
        });
        
        setHistory(transformedHistory);
      }
    } catch (error) {
      console.error('Error reloading quiz history:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your quiz history...</p>
            </div>
          </div>
        ) : (
          <QuizView
            quizHistory={history}
            addQuizSet={addQuizSet}
            deleteQuizSet={deleteQuizSet}
            renameQuizSet={renameQuizSet}
            setCurrentPage={setCurrentPage}
            navigateToQuiz={navigateToQuiz}
            reloadHistory={reloadHistory}
          />
        )}
      </div>
    </div>
  );
}
