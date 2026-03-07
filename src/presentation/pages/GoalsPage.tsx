/**
 * Goals Page
 * Page for managing couple goals.
 *
 * Phase 6: Now uses IGoalService via ServiceContext (Clean Architecture).
 * NO direct supabase calls.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Target, Calendar, CheckCircle2, Circle, X, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { Goal } from '../../types';

export const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, partner } = useAuth();
  const { goalService } = useServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user, partner]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await goalService.getAll(user!.id, partner?.id);
      setGoals(data);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await goalService.create({
        title: newGoal.title,
        description: newGoal.description || undefined,
        target_date: newGoal.target_date || undefined,
        userId: user.id,
      });

      setNewGoal({ title: '', description: '', target_date: '' });
      setIsModalOpen(false);
      loadGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      await goalService.complete(goalId);
      loadGoals();
    } catch (err) {
      console.error('Error completing goal:', err);
      setError(t('errors.generic'));
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.delete(goalId);
      loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(t('errors.generic'));
    }
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('goals.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('goals.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          data-testid="add-goal-button"
        >
          <Plus className="h-5 w-5" />
          <span>{t('goals.addGoal')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('goals.active')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('goals.completed')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.total')}</p>
        </div>
      </div>

      {/* Active Goals */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {t('goals.active')} ({activeGoals.length})
        </h2>
        
        {activeGoals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('goals.noActiveGoals')}</p>
            <p className="text-sm mt-1">{t('goals.setGoal')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  <Circle className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                  )}
                  {goal.target_date && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {t('goals.targetDate')}: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCompleteGoal(goal.id)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    data-testid="complete-goal-button"
                  >
                    {t('goals.complete')}
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={t('common.delete')}
                    data-testid="delete-goal-button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            {t('goals.completedGoals')} ({completedGoals.length})
          </h2>
          <div className="space-y-3">
            {completedGoals.map(goal => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg opacity-75"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white line-through">{goal.title}</p>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('goals.addGoal')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('goals.goalTitle')}
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('goals.saveForVacation')}
                  required
                  data-testid="goal-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.description')}
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('common.description')}
                  rows={2}
                  data-testid="goal-description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('goals.targetDate')}
                </label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('common.loading') : t('goals.addGoal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
