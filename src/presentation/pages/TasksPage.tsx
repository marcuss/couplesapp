/**
 * Tasks Page
 * Page for managing couple tasks - REAL DATA from Supabase
 * 
 * DATABASE SCHEMA NOTES:
 * - Uses 'created_by' column (NOT 'user_id')
 * - Uses 'completed' boolean (NOT 'status' text)
 * - Has 'assigned_to' for task assignment
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckSquare, Calendar, CheckCircle2, Circle, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';

export const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, partner } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, partner]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userIds = [user?.id];
      if (partner?.id) {
        userIds.push(partner.id);
      }

      // Uses 'created_by' column (NOT 'user_id')
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .or(userIds.map(id => `created_by.eq.${id}`).join(','))
        .order('due_date', { ascending: true });

      if (fetchError) {
        console.error('Error fetching tasks:', fetchError);
        setError(t('errors.generic'));
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Uses 'created_by' column (NOT 'user_id')
      // Uses 'completed' boolean (NOT 'status' text)
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          due_date: newTask.due_date || null,
          completed: false,
          created_by: user.id,
        });

      if (insertError) {
        console.error('Error adding task:', insertError);
        setError(t('errors.generic'));
      } else {
        setNewTask({ title: '', description: '', due_date: '' });
        setIsModalOpen(false);
        loadTasks();
      }
    } catch (err) {
      console.error('Error adding task:', err);
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentCompleted: boolean) => {
    try {
      // Uses 'completed' boolean (NOT 'status' text)
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ completed: !currentCompleted })
        .eq('id', taskId);

      if (updateError) {
        console.error('Error updating task:', updateError);
        setError(t('errors.generic'));
      } else {
        loadTasks();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError(t('errors.generic'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('Error deleting task:', deleteError);
        setError(t('errors.generic'));
      } else {
        loadTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(t('errors.generic'));
    }
  };

  // Uses 'completed' boolean (NOT 'status' text)
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tasks.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('tasks.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          data-testid="add-task-button"
        >
          <Plus className="h-5 w-5" />
          <span>{t('tasks.addTask')}</span>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('tasks.pending')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('tasks.completed')}</p>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('tasks.pending')} ({pendingTasks.length})
        </h2>
        
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('tasks.noPendingTasks')}</p>
            <p className="text-sm mt-1">{t('tasks.allCaughtUp')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <button
                  onClick={() => handleToggleComplete(task.id, task.completed)}
                  className="flex-shrink-0"
                  title={t('tasks.markComplete')}
                >
                  <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title={t('common.delete')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('tasks.completedTasks')} ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg opacity-75"
              >
                <button
                  onClick={() => handleToggleComplete(task.id, task.completed)}
                  className="flex-shrink-0"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white line-through">{task.title}</p>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tasks.addTask')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tasks.taskTitle')}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('tasks.taskTitle')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.description')}
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('common.description')}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tasks.dueDate')}
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
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
                  {isSubmitting ? t('common.loading') : t('tasks.addTask')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
