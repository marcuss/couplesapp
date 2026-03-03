/**
 * Budgets Page
 * Page for managing couple budgets.
 *
 * Phase 6: Now uses IBudgetService via ServiceContext (Clean Architecture).
 * NO direct supabase calls.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet, TrendingUp, TrendingDown, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { Budget } from '../../types';

export const BudgetsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, partner } = useAuth();
  const { budgetService } = useServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    spent: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadBudgets();
    }
  }, [user, partner]);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await budgetService.getAll(user!.id, partner?.id);
      setBudgets(data);
    } catch (err) {
      console.error('Error loading budgets:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await budgetService.create({
        category: newBudget.category,
        amount: parseFloat(newBudget.amount),
        spent: parseFloat(newBudget.spent) || 0,
        userId: user.id,
      });

      setNewBudget({ category: '', amount: '', spent: '0' });
      setIsModalOpen(false);
      loadBudgets();
    } catch (err) {
      console.error('Error adding budget:', err);
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSpent = async (budgetId: string, newSpent: number) => {
    try {
      await budgetService.updateSpent(budgetId, newSpent);
      loadBudgets();
    } catch (err) {
      console.error('Error updating budget:', err);
      setError(t('errors.generic'));
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await budgetService.delete(budgetId);
      loadBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError(t('errors.generic'));
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const getUtilizationPercentage = (spent: number, amount: number) => {
    return amount > 0 ? Math.round((spent / amount) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return t('budgets.overBudget');
    if (percentage >= 80) return t('budgets.nearLimit');
    return t('budgets.onTrack');
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('budgets.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('budgets.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          data-testid="add-budget-button"
        >
          <Plus className="h-5 w-5" />
          <span>{t('budgets.addBudget')}</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('budgets.totalBudget')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('budgets.totalSpent')}</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('budgets.totalRemaining')}</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('budgets.overallProgress')}</h2>
          <span className={`text-sm font-medium ${
            overallPercentage >= 100 ? 'text-red-600' : 
            overallPercentage >= 80 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {overallPercentage.toFixed(1)}% {t('budgets.used')}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${getProgressColor(overallPercentage)}`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {getStatusText(overallPercentage)}
        </p>
      </div>

      {/* Budget Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('budgets.budgetCategories')} ({budgets.length})
        </h2>
        
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('budgets.noBudgets')}</p>
            <p className="text-sm mt-1">{t('budgets.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map(budget => {
              const percentage = getUtilizationPercentage(budget.spent, budget.amount);
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {budget.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        percentage >= 100 ? 'bg-red-100 text-red-700' :
                        percentage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {getStatusText(percentage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ${budget.spent.toLocaleString()} / ${budget.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{percentage}% {t('budgets.used')}</span>
                    <span>${(budget.amount - budget.spent).toLocaleString()} {t('budgets.remaining')}</span>
                  </div>
                  
                  {/* Quick Update Spent */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-gray-500">{t('budgets.updateSpent')}:</span>
                    <input
                      type="number"
                      defaultValue={budget.spent}
                      onBlur={(e) => handleUpdateSpent(budget.id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('budgets.addBudget')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('budgets.category')}
                </label>
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('budgets.categoryPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('budgets.amount')}
                </label>
                <input
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('budgets.spentSoFar')}
                </label>
                <input
                  type="number"
                  value={newBudget.spent}
                  onChange={(e) => setNewBudget({ ...newBudget, spent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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
                  {isSubmitting ? t('common.loading') : t('budgets.addBudget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
