/**
 * Dashboard Page
 * Main dashboard showing overview of couple's activities.
 *
 * Phase 6: Now uses IDashboardService via ServiceContext (Clean Architecture).
 * NO direct supabase calls.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  Wallet, 
  Calendar, 
  CheckSquare, 
  ArrowRight, 
  Heart,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../contexts/ServiceContext';
import { CalendarEvent, Goal, Budget, Task } from '../../types';

interface DashboardStats {
  totalEvents: number;
  activeGoals: number;
  totalBudget: number;
  spentBudget: number;
  pendingTasks: number;
}

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, partner } = useAuth();
  const { dashboardService } = useServices();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, partner]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await dashboardService.loadData(
        user!.id,
        partner?.id
      );

      setEvents(data.events);
      setGoals(data.goals);
      setBudgets(data.budgets);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from data
  const stats: DashboardStats = {
    totalEvents: events.length,
    activeGoals: goals.length,
    totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
    spentBudget: budgets.reduce((sum, b) => sum + b.spent, 0),
    pendingTasks: tasks.length,
  };

  // Get today's events
  const getTodayEvents = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    return events.filter(event => {
      const [eventYear, eventMonth, eventDay] = event.date.split('-').map(Number);
      return eventYear === currentYear && 
             eventMonth === currentMonth && 
             eventDay === currentDay;
    });
  };

  const todayEvents = getTodayEvents();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate > today;
  }).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="font-semibold">{t('common.error')}</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      title: t('dashboard.activeGoals'),
      value: stats.activeGoals.toString(),
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      link: '/goals',
    },
    {
      title: t('dashboard.budgetStatus'),
      value: stats.totalBudget > 0 
        ? `${Math.round((stats.spentBudget / stats.totalBudget) * 100)}%` 
        : '0%',
      icon: Wallet,
      color: 'from-green-500 to-green-600',
      link: '/budgets',
    },
    {
      title: t('dashboard.upcomingEvents'),
      value: upcomingEvents.length.toString(),
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      link: '/events',
    },
    {
      title: t('dashboard.pendingTasks'),
      value: stats.pendingTasks.toString(),
      icon: CheckSquare,
      color: 'from-orange-500 to-orange-600',
      link: '/tasks',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard.welcomePartner', { name: user?.name || user?.email?.split('@')[0] })}
        </h1>
        {partner && (
          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
            <Users className="w-4 h-4" />
            {t('profile.connectedWith')}: {partner.name || partner.email}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-rose-500 group-hover:text-rose-600">
              <span>{t('common.viewDetails')}</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Partner Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-full">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.partnerConnection')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {partner 
                ? t('dashboard.partnerConnected')
                : t('dashboard.partnerNotConnected')}
            </p>
          </div>
          {!partner && (
            <Link
              to="/invite"
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              {t('navigation.invitePartner')}
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {t('dashboard.todaysEvents')}
            </h2>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString(i18n.language, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noEventsToday')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {event.time || '--:--'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              {t('dashboard.activeGoalsTitle')}
            </h2>
            <Link to="/goals" className="text-rose-500 hover:text-rose-600 text-sm">
              {t('common.viewAll')}
            </Link>
          </div>
          
          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noActiveGoals')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                    {goal.target_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('goals.targetDate')}: {new Date(goal.target_date).toLocaleDateString(i18n.language)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-red-600" />
              {t('dashboard.pendingTasksTitle')}
            </h2>
            <Link to="/tasks" className="text-rose-500 hover:text-rose-600 text-sm">
              {t('common.viewAll')}
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noPendingTasks')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                    {task.due_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString(i18n.language)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              {t('dashboard.budgetOverview')}
            </h2>
            <Link to="/budgets" className="text-rose-500 hover:text-rose-600 text-sm">
              {t('common.viewAll')}
            </Link>
          </div>
          
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noBudgets')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('dashboard.totalBudget')}:</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  ${stats.totalBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('dashboard.spent')}:</span>
                <span className="font-semibold text-lg text-red-600">
                  ${stats.spentBudget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((stats.spentBudget / stats.totalBudget) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.totalBudget > 0 
                    ? ((stats.spentBudget / stats.totalBudget) * 100).toFixed(1) 
                    : '0'}% {t('dashboard.used')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ${(stats.totalBudget - stats.spentBudget).toLocaleString()} {t('dashboard.remaining')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
