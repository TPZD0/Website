import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Flashcards as FlashcardsView } from '@/components/figma/Flashcards';
import { sampleQuizHistory } from '@/lib/sampleData';

export default function FlashcardsPage() {
  const router = useRouter();
  const [history, setHistory] = useState(sampleQuizHistory);

  // optional: persist across navigation
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flashcardHistory');
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('flashcardHistory', JSON.stringify(history)); } catch {}
  }, [history]);

  const setCurrentPage = (page) => {
    const map = {
      dashboard: '/dashboard',
    };
    router.push(map[page] || '/dashboard');
  };

  const addFlashcardSet = (set) => {
    const id = `gen-${Date.now()}`;
    setHistory((prev) => [{ ...set, id }, ...prev]);
  };
  const deleteFlashcardSet = (id) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  };
  const renameFlashcardSet = (id, newTitle) => {
    setHistory((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };
  const navigateToQuiz = (quizId) => {
    router.push(`/quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <FlashcardsView
          flashcardHistory={history}
          addFlashcardSet={addFlashcardSet}
          deleteFlashcardSet={deleteFlashcardSet}
          renameFlashcardSet={renameFlashcardSet}
          setCurrentPage={setCurrentPage}
          navigateToQuiz={navigateToQuiz}
        />
      </div>
    </div>
  );
}
