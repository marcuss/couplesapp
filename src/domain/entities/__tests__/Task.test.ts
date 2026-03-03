/**
 * Task Entity Tests - TDD
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Task, TaskProps, CreateTaskProps } from '../Task';

const validProps = (): CreateTaskProps => ({
  id: 'task-1',
  title: 'Buy groceries',
  createdBy: 'user-1',
  partnerId: 'user-2',
});

const futureDate = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};

const pastDate = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

// ─── create() ────────────────────────────────────────────────────────────────
describe('Task.create()', () => {
  it('creates a valid task with minimum props', () => {
    const result = Task.create(validProps());
    expect(result.isOk()).toBe(true);
    const task = result.getValue();
    expect(task.id).toBe('task-1');
    expect(task.title).toBe('Buy groceries');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
  });

  it('sets default status to pending', () => {
    const task = Task.create(validProps()).getValue();
    expect(task.isPending).toBe(true);
  });

  it('sets default priority to medium', () => {
    const task = Task.create(validProps()).getValue();
    expect(task.priority).toBe('medium');
  });

  it('accepts a future dueDate', () => {
    const due = futureDate();
    const task = Task.create({ ...validProps(), dueDate: due }).getValue();
    expect(task.dueDate).toEqual(due);
  });

  it('rejects a past dueDate', () => {
    const result = Task.create({ ...validProps(), dueDate: pastDate() });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('dueDate');
  });

  it('fails when id is empty', () => {
    const result = Task.create({ ...validProps(), id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('id');
  });

  it('fails when title is too short (< 2 chars)', () => {
    const result = Task.create({ ...validProps(), title: 'A' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('fails when title is too long (> 100 chars)', () => {
    const result = Task.create({ ...validProps(), title: 'X'.repeat(101) });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('allows assignedTo = createdBy', () => {
    const result = Task.create({ ...validProps(), assignedTo: 'user-1' });
    expect(result.isOk()).toBe(true);
  });

  it('allows assignedTo = partnerId', () => {
    const result = Task.create({ ...validProps(), assignedTo: 'user-2' });
    expect(result.isOk()).toBe(true);
  });

  it('rejects assignedTo = third party', () => {
    const result = Task.create({ ...validProps(), assignedTo: 'stranger' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('assignedTo');
  });

  it('accepts an optional goalId', () => {
    const task = Task.create({ ...validProps(), goalId: 'goal-1' }).getValue();
    expect(task.goalId).toBe('goal-1');
  });
});

// ─── reconstitute() ──────────────────────────────────────────────────────────
describe('Task.reconstitute()', () => {
  it('reconstitutes with completed status', () => {
    const now = new Date();
    const props: TaskProps = {
      id: 'task-99',
      title: 'Done task',
      status: 'completed',
      priority: 'high',
      createdBy: 'u1',
      partnerId: 'u2',
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    };
    const task = Task.reconstitute(props);
    expect(task.isCompleted).toBe(true);
    expect(task.completedAt).toEqual(now);
  });

  it('does NOT validate on reconstitute', () => {
    const props: TaskProps = {
      id: 't',
      title: 'X',  // too short for create()
      status: 'pending',
      priority: 'low',
      createdBy: 'u1',
      partnerId: 'u2',
      dueDate: pastDate(),  // past date
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => Task.reconstitute(props)).not.toThrow();
  });
});

// ─── State transitions ────────────────────────────────────────────────────────
describe('Task state transitions', () => {
  let pendingTask: Task;

  beforeEach(() => {
    pendingTask = Task.create(validProps()).getValue();
  });

  describe('start()', () => {
    it('transitions pending → in_progress', () => {
      const result = pendingTask.start();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isInProgress).toBe(true);
    });

    it('fails if not pending', () => {
      const inProgress = pendingTask.start().getValue();
      expect(inProgress.start().isFail()).toBe(true);
    });
  });

  describe('complete()', () => {
    it('transitions pending → completed', () => {
      const result = pendingTask.complete();
      expect(result.isOk()).toBe(true);
      const completed = result.getValue();
      expect(completed.isCompleted).toBe(true);
      expect(completed.completedAt).toBeDefined();
    });

    it('fails if already completed', () => {
      const completed = pendingTask.complete().getValue();
      expect(completed.complete().isFail()).toBe(true);
    });
  });

  describe('reopen()', () => {
    it('transitions completed → pending', () => {
      const completed = pendingTask.complete().getValue();
      const result = completed.reopen();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isPending).toBe(true);
    });

    it('fails if not completed', () => {
      expect(pendingTask.reopen().isFail()).toBe(true);
    });

    it('clears completedAt after reopen', () => {
      const completed = pendingTask.complete().getValue();
      const reopened = completed.reopen().getValue();
      expect(reopened.completedAt).toBeUndefined();
    });
  });
});

// ─── assignTo / unassign ──────────────────────────────────────────────────────
describe('Task assignment', () => {
  let task: Task;

  beforeEach(() => {
    task = Task.create(validProps()).getValue();
  });

  it('assigns to creator', () => {
    const result = task.assignTo('user-1');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().assignedTo).toBe('user-1');
    expect(result.getValue().isAssigned).toBe(true);
  });

  it('assigns to partner', () => {
    const result = task.assignTo('user-2');
    expect(result.isOk()).toBe(true);
  });

  it('rejects assignment to third party', () => {
    const result = task.assignTo('stranger');
    expect(result.isFail()).toBe(true);
  });

  it('unassigns task', () => {
    const assigned = task.assignTo('user-1').getValue();
    const unassigned = assigned.unassign().getValue();
    expect(unassigned.assignedTo).toBeUndefined();
    expect(unassigned.isAssigned).toBe(false);
  });

  it('isAssignedTo returns true for assigned user', () => {
    const assigned = task.assignTo('user-1').getValue();
    expect(assigned.isAssignedTo('user-1')).toBe(true);
    expect(assigned.isAssignedTo('user-2')).toBe(false);
  });
});

// ─── linkToGoal ───────────────────────────────────────────────────────────────
describe('Task goal linking', () => {
  it('links to a goal', () => {
    const task = Task.create(validProps()).getValue();
    const result = task.linkToGoal('goal-42');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().goalId).toBe('goal-42');
  });

  it('fails when goalId is empty', () => {
    const task = Task.create(validProps()).getValue();
    const result = task.linkToGoal('');
    expect(result.isFail()).toBe(true);
  });

  it('unlinks from goal', () => {
    const task = Task.create({ ...validProps(), goalId: 'goal-1' }).getValue();
    const unlinked = task.unlinkFromGoal().getValue();
    expect(unlinked.goalId).toBeUndefined();
  });
});

// ─── isOverdue / isDueSoon ────────────────────────────────────────────────────
describe('Task deadline helpers', () => {
  it('isOverdue is false when no dueDate', () => {
    const task = Task.create(validProps()).getValue();
    expect(task.isOverdue).toBe(false);
  });

  it('isOverdue for past date (reconstituted)', () => {
    const props: TaskProps = {
      id: 't1', title: 'Old', status: 'pending', priority: 'medium',
      createdBy: 'u1', partnerId: 'u2',
      dueDate: new Date('2020-01-01'), createdAt: new Date(), updatedAt: new Date(),
    };
    expect(Task.reconstitute(props).isOverdue).toBe(true);
  });

  it('isDueSoon for task due within 3 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const props: TaskProps = {
      id: 't1', title: 'Due soon', status: 'pending', priority: 'medium',
      createdBy: 'u1', partnerId: 'u2',
      dueDate: soon, createdAt: new Date(), updatedAt: new Date(),
    };
    expect(Task.reconstitute(props).isDueSoon).toBe(true);
  });
});
