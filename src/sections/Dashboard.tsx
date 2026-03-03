import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CalendarEvent, Goal, Budget, Task } from '../types';
import { 
  Calendar, 
  Target, 
  Wallet, 
  CheckSquare, 
  TrendingUp,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalEvents: number;
  activeGoals: number;
  totalBudget: number;
  spentBudget: number;
  pendingTasks: number;
}

export default function Dashboard() {
  const { user, partner } = useAuth();
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
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userIds = [user?.id];
      if (partner?.id) {
        userIds.push(partner.id);
      }

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .or(userIds.map(id => `user_id.eq.${id}`).join(','))
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setError('Error al cargar eventos');
      } else {
        setEvents(eventsData || []);
      }

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .or(userIds.map(id => `user_id.eq.${id}`).join(','))
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
      } else {
        setGoals(goalsData || []);
      }

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .or(userIds.map(id => `user_id.eq.${id}`).join(','));

      if (budgetsError) {
        console.error('Error fetching budgets:', budgetsError);
      } else {
        setBudgets(budgetsData || []);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(userIds.map(id => `user_id.eq.${id}`).join(','))
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        setTasks(tasksData || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats: DashboardStats = {
    totalEvents: events.length,
    activeGoals: goals.length,
    totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
    spentBudget: budgets.reduce((sum, b) => sum + b.spent, 0),
    pendingTasks: tasks.length,
  };

  // Get today's events - THIS IS WHERE THE BUG MIGHT BE
  const getTodayEvents = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    console.log('Dashboard - Filtering events for today:');
    console.log('  Current date (local):', currentDate.toString());
    console.log('  Current Year:', currentYear);
    console.log('  Current Month:', currentMonth);
    console.log('  Current Day:', currentDay);

    const todayEvents = events.filter(event => {
      // Event date comes from Supabase in format 'YYYY-MM-DD'
      const [eventYear, eventMonth, eventDay] = event.date.split('-').map(Number);

      console.log(`  Event: ${event.title}, Date: ${event.date}`);
      console.log(`    Event Year: ${eventYear}, Month: ${eventMonth}, Day: ${eventDay}`);

      // BUG POSSIBILITY: If eventMonth is compared to itself instead of currentMonth
      // This was a previous bug: eventMonth === eventMonth (always true)
      // Should be: eventMonth === currentMonth
      const isToday = 
        eventYear === currentYear && 
        eventMonth === currentMonth && 
        eventDay === currentDay;

      console.log(`    Is today?: ${isToday}`);

      return isToday;
    });

    console.log(`  Total today events: ${todayEvents.length}`);

    return todayEvents;
  };

  const todayEvents = getTodayEvents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="font-semibold">Error</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.name || user?.email}
          </h1>
          {partner && (
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pareja: {partner.name || partner.email}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            title="Eventos"
            value={stats.totalEvents}
            color="blue"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            title="Metas Activas"
            value={stats.activeGoals}
            color="green"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            title="Presupuesto Total"
            value={`$${stats.totalBudget.toLocaleString()}`}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Gastado"
            value={`$${stats.spentBudget.toLocaleString()}`}
            color="orange"
          />
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            title="Tareas Pendientes"
            value={stats.pendingTasks}
            color="red"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Eventos de Hoy
              </h2>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay eventos para hoy</p>
                <p className="text-sm mt-1">
                  Total events in system: {events.length}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-sm font-medium text-blue-700">
                        {event.time || '--:--'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-gray-600">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Goals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Metas Activas
              </h2>
            </div>
            
            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay metas activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map(goal => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{goal.title}</p>
                      {goal.target_date && (
                        <p className="text-sm text-gray-600">
                          Fecha objetivo: {new Date(goal.target_date).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-red-600" />
                Tareas Pendientes
              </h2>
            </div>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay tareas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.due_date && (
                        <p className="text-sm text-gray-600">
                          Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.status === 'pending' ? 'Pendiente' : 'En progreso'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                Resumen de Presupuesto
              </h2>
            </div>
            
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay presupuestos configurados</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Presupuestado:</span>
                  <span className="font-semibold text-lg">${stats.totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Gastado:</span>
                  <span className="font-semibold text-lg text-red-600">${stats.spentBudget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((stats.spentBudget / stats.totalBudget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {((stats.spentBudget / stats.totalBudget) * 100).toFixed(1)}% utilizado
                  </span>
                  <span className="text-gray-500">
                    ${(stats.totalBudget - stats.spentBudget).toLocaleString()} restante
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
