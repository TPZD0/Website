import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Goals as GoalsView } from '@/components/figma/Goals';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  // Load user's goals from database
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setIsLoadingGoals(false);
          return;
        }

        const response = await fetch(`/api/goals/${userId}`);
        if (response.ok) {
          const userGoals = await response.json();
          setGoals(userGoals);
        } else {
          console.error('Failed to load goals');
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setIsLoadingGoals(false);
      }
    };

    loadGoals();
  }, []);

  const addGoal = async (goal) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Please log in to create goals.');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', goal.name);
      formData.append('description', goal.description || '');
      formData.append('due_date', goal.dueDate);

      const response = await fetch('/api/goals', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newGoal = await response.json();
        setGoals((prev) => [newGoal, ...prev]);
      } else {
        const errorData = await response.json();
        alert(`Failed to create goal: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const updateGoal = async (id, updates) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Please log in to update goals.');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      
      if (updates.name !== undefined) formData.append('name', updates.name);
      if (updates.description !== undefined) formData.append('description', updates.description || '');
      if (updates.dueDate !== undefined) formData.append('due_date', updates.dueDate);
      if (updates.completed !== undefined) formData.append('completed', updates.completed);

      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)));
      } else {
        const errorData = await response.json();
        alert(`Failed to update goal: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const deleteGoal = async (id) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Please log in to delete goals.');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        body: formData,
      });

      if (response.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete goal: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const setCurrentPage = (page) => {
    const map = {
      dashboard: '/dashboard',
    };
    router.push(map[page] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {isLoadingGoals ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your goals...</p>
            </div>
          </div>
        ) : (
          <GoalsView
            goals={goals}
            addGoal={addGoal}
            updateGoal={updateGoal}
            deleteGoal={deleteGoal}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
