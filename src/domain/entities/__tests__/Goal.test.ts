/**
 * Goal Entity Tests - TDD
 * Tests documenting the correct behavior of the Goal domain entity
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Goal, GoalProps, CreateGoalProps } from '../Goal';

// ─── Fixtures ────────────────────────────────────────────────────────────────
const validProps = (): CreateGoalProps => ({
  id: 'goal-1',
  title: 'Save for vacation',
  createdBy: 'user-1',
  partnerId: 'user-2',
});

const futureDate = (): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

const pastDate = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

// ─── create() ────────────────────────────────────────────────────────────────
describe('Goal.create()', () => {
  it('creates a valid goal with minimum props', () => {
    const result = Goal.create(validProps());
    expect(result.isOk()).toBe(true);
    const goal = result.getValue();
    expect(goal.id).toBe('goal-1');
    expect(goal.title).toBe('Save for vacation');
    expect(goal.status).toBe('pending');
    expect(goal.priority).toBe('medium');
    expect(goal.createdBy).toBe('user-1');
    expect(goal.partnerId).toBe('user-2');
  });

  it('sets default status to pending', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.status).toBe('pending');
    expect(goal.isPending).toBe(true);
  });

  it('sets default priority to medium when not provided', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.priority).toBe('medium');
  });

  it('accepts high priority', () => {
    const goal = Goal.create({ ...validProps(), priority: 'high' }).getValue();
    expect(goal.priority).toBe('high');
  });

  it('accepts a future targetDate', () => {
    const target = futureDate();
    const goal = Goal.create({ ...validProps(), targetDate: target }).getValue();
    expect(goal.targetDate).toEqual(target);
  });

  it('rejects a past targetDate', () => {
    const result = Goal.create({ ...validProps(), targetDate: pastDate() });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('targetDate');
  });

  it('fails when id is empty', () => {
    const result = Goal.create({ ...validProps(), id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('id');
  });

  it('fails when title is empty', () => {
    const result = Goal.create({ ...validProps(), title: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('fails when title is too short (< 3 chars)', () => {
    const result = Goal.create({ ...validProps(), title: 'AB' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('fails when title is too long (> 100 chars)', () => {
    const result = Goal.create({ ...validProps(), title: 'A'.repeat(101) });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('fails when createdBy is empty', () => {
    const result = Goal.create({ ...validProps(), createdBy: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('createdBy');
  });

  it('fails when partnerId is empty', () => {
    const result = Goal.create({ ...validProps(), partnerId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('partnerId');
  });

  it('sets createdAt and updatedAt on creation', () => {
    const before = new Date();
    const goal = Goal.create(validProps()).getValue();
    const after = new Date();
    expect(goal.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(goal.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(goal.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('trims description whitespace', () => {
    const goal = Goal.create({ ...validProps(), description: '  my desc  ' }).getValue();
    expect(goal.description).toBe('my desc');
  });
});

// ─── reconstitute() ──────────────────────────────────────────────────────────
describe('Goal.reconstitute()', () => {
  const now = new Date('2024-01-01T00:00:00Z');

  const fullProps = (): GoalProps => ({
    id: 'goal-99',
    title: 'Old goal',
    status: 'completed',
    priority: 'low',
    createdBy: 'user-1',
    partnerId: 'user-2',
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  });

  it('reconstitutes with all fields intact', () => {
    const goal = Goal.reconstitute(fullProps());
    expect(goal.id).toBe('goal-99');
    expect(goal.status).toBe('completed');
    expect(goal.isCompleted).toBe(true);
    expect(goal.completedAt).toEqual(now);
  });

  it('does NOT validate on reconstitute (allows past dates etc.)', () => {
    const props: GoalProps = {
      ...fullProps(),
      id: 'g',          // would fail create() - id too short? no, empty check only
      targetDate: pastDate(),   // would fail create()
    };
    // Should not throw
    expect(() => Goal.reconstitute(props)).not.toThrow();
  });
});

// ─── State transitions ────────────────────────────────────────────────────────
describe('Goal state transitions', () => {
  let pendingGoal: Goal;

  beforeEach(() => {
    pendingGoal = Goal.create(validProps()).getValue();
  });

  describe('start()', () => {
    it('transitions pending → in_progress', () => {
      const result = pendingGoal.start();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isInProgress).toBe(true);
    });

    it('fails if goal is not pending', () => {
      const inProgress = pendingGoal.start().getValue();
      const result = inProgress.start();
      expect(result.isFail()).toBe(true);
    });
  });

  describe('complete()', () => {
    it('transitions pending → completed', () => {
      const result = pendingGoal.complete();
      expect(result.isOk()).toBe(true);
      const completed = result.getValue();
      expect(completed.isCompleted).toBe(true);
      expect(completed.completedAt).toBeDefined();
    });

    it('transitions in_progress → completed', () => {
      const inProgress = pendingGoal.start().getValue();
      const result = inProgress.complete();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isCompleted).toBe(true);
    });

    it('fails if already completed', () => {
      const completed = pendingGoal.complete().getValue();
      expect(completed.complete().isFail()).toBe(true);
    });

    it('fails if cancelled', () => {
      const cancelled = pendingGoal.cancel().getValue();
      expect(cancelled.complete().isFail()).toBe(true);
    });
  });

  describe('cancel()', () => {
    it('transitions pending → cancelled', () => {
      const result = pendingGoal.cancel();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isCancelled).toBe(true);
    });

    it('fails if already cancelled', () => {
      const cancelled = pendingGoal.cancel().getValue();
      expect(cancelled.cancel().isFail()).toBe(true);
    });

    it('fails if completed', () => {
      const completed = pendingGoal.complete().getValue();
      expect(completed.cancel().isFail()).toBe(true);
    });
  });

  describe('reopen()', () => {
    it('transitions cancelled → pending', () => {
      const cancelled = pendingGoal.cancel().getValue();
      const result = cancelled.reopen();
      expect(result.isOk()).toBe(true);
      expect(result.getValue().isPending).toBe(true);
    });

    it('fails if not cancelled', () => {
      expect(pendingGoal.reopen().isFail()).toBe(true);
    });
  });
});

// ─── isOverdue ────────────────────────────────────────────────────────────────
describe('Goal.isOverdue', () => {
  it('is overdue when targetDate is in the past and not completed', () => {
    const props: GoalProps = {
      id: 'g1',
      title: 'Old goal',
      status: 'pending',
      priority: 'medium',
      createdBy: 'u1',
      partnerId: 'u2',
      targetDate: new Date('2020-01-01'),
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2020-01-01'),
    };
    const goal = Goal.reconstitute(props);
    expect(goal.isOverdue).toBe(true);
  });

  it('is NOT overdue when completed', () => {
    const props: GoalProps = {
      id: 'g1',
      title: 'Old goal',
      status: 'completed',
      priority: 'medium',
      createdBy: 'u1',
      partnerId: 'u2',
      targetDate: new Date('2020-01-01'),
      completedAt: new Date(),
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date(),
    };
    const goal = Goal.reconstitute(props);
    expect(goal.isOverdue).toBe(false);
  });

  it('is NOT overdue when no targetDate', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.isOverdue).toBe(false);
  });
});

// ─── canBeModifiedBy ──────────────────────────────────────────────────────────
describe('Goal.canBeModifiedBy()', () => {
  it('allows creator to modify', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.canBeModifiedBy('user-1')).toBe(true);
  });

  it('allows partner to modify', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.canBeModifiedBy('user-2')).toBe(true);
  });

  it('denies third party', () => {
    const goal = Goal.create(validProps()).getValue();
    expect(goal.canBeModifiedBy('stranger-99')).toBe(false);
  });
});

// ─── equals & toJSON ──────────────────────────────────────────────────────────
describe('Goal.equals() and toJSON()', () => {
  it('two goals with same id are equal', () => {
    const a = Goal.create(validProps()).getValue();
    const bProps: GoalProps = { ...a.toJSON() };
    const b = Goal.reconstitute(bProps);
    expect(a.equals(b)).toBe(true);
  });

  it('toJSON returns plain object with all props', () => {
    const goal = Goal.create(validProps()).getValue();
    const json = goal.toJSON();
    expect(json.id).toBe('goal-1');
    expect(json.status).toBe('pending');
  });
});
