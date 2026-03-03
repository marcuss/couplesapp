/**
 * Seed Data Script
 * Creates sample data for testing purposes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Starting data seeding...');

  // Get user ID for sanchez.marcus@gmail.com
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'sanchez.marcus@gmail.com')
    .single();

  if (userError || !userData) {
    console.error('User not found:', userError);
    return;
  }

  const userId = userData.id;
  console.log('Found user:', userId);

  // Sample events
  const events = [
    {
      title: 'Date Night',
      description: 'Romantic dinner at our favorite restaurant',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      time: '19:00',
      user_id: userId,
    },
    {
      title: 'Anniversary Celebration',
      description: 'Our special day! Plan something memorable',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      time: '18:00',
      user_id: userId,
    },
    {
      title: 'Weekend Trip',
      description: 'Short getaway to the mountains',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      time: '08:00',
      user_id: userId,
    },
    {
      title: 'Movie Night',
      description: 'Watch the new Marvel movie',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      time: '20:00',
      user_id: userId,
    },
    {
      title: 'Birthday Dinner',
      description: 'Celebrate with family',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
      time: '19:30',
      user_id: userId,
    },
  ];

  // Insert events
  for (const event of events) {
    const { error } = await supabase.from('events').insert(event);
    if (error) {
      console.error('Error inserting event:', error);
    } else {
      console.log('Inserted event:', event.title);
    }
  }

  // Sample goals
  const goals = [
    {
      title: 'Save for Vacation',
      description: 'Save $5000 for our dream vacation to Japan',
      target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months
      status: 'active',
      user_id: userId,
    },
    {
      title: 'Learn Cooking Together',
      description: 'Take a cooking class and learn 10 new recipes',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months
      status: 'active',
      user_id: userId,
    },
    {
      title: 'Run a Marathon',
      description: 'Train together and complete a half marathon',
      target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 months
      status: 'active',
      user_id: userId,
    },
    {
      title: 'Buy a House',
      description: 'Save for down payment and find our dream home',
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year
      status: 'active',
      user_id: userId,
    },
  ];

  // Insert goals
  for (const goal of goals) {
    const { error } = await supabase.from('goals').insert(goal);
    if (error) {
      console.error('Error inserting goal:', error);
    } else {
      console.log('Inserted goal:', goal.title);
    }
  }

  // Sample budgets
  const budgets = [
    {
      category: 'Groceries',
      amount: 800,
      spent: 450,
      user_id: userId,
    },
    {
      category: 'Entertainment',
      amount: 300,
      spent: 180,
      user_id: userId,
    },
    {
      category: 'Dining Out',
      amount: 400,
      spent: 320,
      user_id: userId,
    },
    {
      category: 'Transportation',
      amount: 200,
      spent: 150,
      user_id: userId,
    },
    {
      category: 'Shopping',
      amount: 500,
      spent: 280,
      user_id: userId,
    },
  ];

  // Insert budgets
  for (const budget of budgets) {
    const { error } = await supabase.from('budgets').insert(budget);
    if (error) {
      console.error('Error inserting budget:', error);
    } else {
      console.log('Inserted budget:', budget.category);
    }
  }

  // Sample tasks
  const tasks = [
    {
      title: 'Plan anniversary dinner',
      description: 'Make reservations at the rooftop restaurant',
      due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      user_id: userId,
    },
    {
      title: 'Buy groceries for the week',
      description: 'Get ingredients for meal prep',
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      user_id: userId,
    },
    {
      title: 'Research vacation destinations',
      description: 'Look up flights and hotels for Japan trip',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'in_progress',
      user_id: userId,
    },
    {
      title: 'Schedule cooking class',
      description: 'Find a local cooking school',
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      user_id: userId,
    },
    {
      title: 'Call plumber',
      description: 'Fix the leaky faucet in the kitchen',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      user_id: userId,
    },
  ];

  // Insert tasks
  for (const task of tasks) {
    const { error } = await supabase.from('tasks').insert(task);
    if (error) {
      console.error('Error inserting task:', error);
    } else {
      console.log('Inserted task:', task.title);
    }
  }

  console.log('Data seeding completed!');
}

seedData().catch(console.error);
