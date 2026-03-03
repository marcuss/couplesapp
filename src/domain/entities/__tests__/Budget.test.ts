/**
 * Budget Entity Tests - TDD
 */
import { describe, it, expect } from 'vitest';
import { Budget, BudgetProps, CreateBudgetProps } from '../Budget';

const validProps = (): CreateBudgetProps => ({
  id: 'budget-1',
  name: 'Vacation fund',
  amount: 1000,
  category: 'travel',
  createdBy: 'user-1',
  partnerId: 'user-2',
});

// ─── create() ────────────────────────────────────────────────────────────────
describe('Budget.create()', () => {
  it('creates a valid budget', () => {
    const result = Budget.create(validProps());
    expect(result.isOk()).toBe(true);
    const budget = result.getValue();
    expect(budget.id).toBe('budget-1');
    expect(budget.name).toBe('Vacation fund');
    expect(budget.amount).toBe(1000);
    expect(budget.spent).toBe(0);
    expect(budget.category).toBe('travel');
  });

  it('initializes spent to 0', () => {
    const budget = Budget.create(validProps()).getValue();
    expect(budget.spent).toBe(0);
    expect(budget.remaining).toBe(1000);
    expect(budget.utilizationPercentage).toBe(0);
  });

  it('accepts all valid categories', () => {
    const categories = [
      'housing', 'food', 'transportation', 'entertainment', 'savings',
      'utilities', 'healthcare', 'shopping', 'travel', 'other',
    ] as const;
    for (const category of categories) {
      const result = Budget.create({ ...validProps(), id: `b-${category}`, category });
      expect(result.isOk()).toBe(true);
    }
  });

  it('fails when id is empty', () => {
    const result = Budget.create({ ...validProps(), id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('id');
  });

  it('fails when name is too short', () => {
    const result = Budget.create({ ...validProps(), name: 'A' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('name');
  });

  it('fails when name is too long (> 50 chars)', () => {
    const result = Budget.create({ ...validProps(), name: 'X'.repeat(51) });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('name');
  });

  it('fails when amount is zero', () => {
    const result = Budget.create({ ...validProps(), amount: 0 });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('amount');
  });

  it('fails when amount is negative', () => {
    const result = Budget.create({ ...validProps(), amount: -100 });
    expect(result.isFail()).toBe(true);
  });

  it('fails when amount has more than 2 decimal places', () => {
    const result = Budget.create({ ...validProps(), amount: 99.999 });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('amount');
  });

  it('accepts amount with 2 decimal places', () => {
    const result = Budget.create({ ...validProps(), amount: 99.99 });
    expect(result.isOk()).toBe(true);
  });

  it('fails when createdBy is empty', () => {
    const result = Budget.create({ ...validProps(), createdBy: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('createdBy');
  });

  it('fails when partnerId is empty', () => {
    const result = Budget.create({ ...validProps(), partnerId: '' });
    expect(result.isFail()).toBe(true);
  });

  it('trims notes whitespace', () => {
    const budget = Budget.create({ ...validProps(), notes: '  note  ' }).getValue();
    expect(budget.notes).toBe('note');
  });
});

// ─── reconstitute() ──────────────────────────────────────────────────────────
describe('Budget.reconstitute()', () => {
  it('reconstitutes with spent amount', () => {
    const now = new Date();
    const props: BudgetProps = {
      id: 'b99', name: 'Test', amount: 500, spent: 250, category: 'food',
      createdBy: 'u1', partnerId: 'u2', createdAt: now, updatedAt: now,
    };
    const budget = Budget.reconstitute(props);
    expect(budget.spent).toBe(250);
    expect(budget.remaining).toBe(250);
    expect(budget.utilizationPercentage).toBe(50);
  });
});

// ─── Spending operations ──────────────────────────────────────────────────────
describe('Budget spending operations', () => {
  it('addSpending increases spent', () => {
    const budget = Budget.create(validProps()).getValue();
    const result = budget.addSpending(300);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().spent).toBe(300);
    expect(result.getValue().remaining).toBe(700);
  });

  it('fails when addSpending amount is zero or negative', () => {
    const budget = Budget.create(validProps()).getValue();
    expect(budget.addSpending(0).isFail()).toBe(true);
    expect(budget.addSpending(-50).isFail()).toBe(true);
  });

  it('allows spending over budget (isOverBudget = true)', () => {
    const budget = Budget.create(validProps()).getValue();
    const overBudget = budget.addSpending(1500).getValue();
    expect(overBudget.isOverBudget).toBe(true);
    expect(overBudget.spent).toBe(1500);
  });

  it('removeSpending decreases spent', () => {
    const budget = Budget.create(validProps()).getValue();
    const withSpending = budget.addSpending(500).getValue();
    const result = withSpending.removeSpending(200);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().spent).toBe(300);
  });

  it('fails removeSpending when more than spent', () => {
    const budget = Budget.create(validProps()).getValue();
    const withSpending = budget.addSpending(100).getValue();
    expect(withSpending.removeSpending(200).isFail()).toBe(true);
  });

  it('resetSpending sets spent to 0', () => {
    const budget = Budget.create(validProps()).getValue();
    const withSpending = budget.addSpending(500).getValue();
    const reset = withSpending.resetSpending().getValue();
    expect(reset.spent).toBe(0);
  });
});

// ─── Status helpers ───────────────────────────────────────────────────────────
describe('Budget status helpers', () => {
  it('isNearLimit when utilization >= 80%', () => {
    const props: BudgetProps = {
      id: 'b1', name: 'Near limit', amount: 100, spent: 85, category: 'food',
      createdBy: 'u1', partnerId: 'u2', createdAt: new Date(), updatedAt: new Date(),
    };
    const budget = Budget.reconstitute(props);
    expect(budget.isNearLimit).toBe(true);
    expect(budget.isOverBudget).toBe(false);
  });

  it('isOverBudget when spent > amount', () => {
    const props: BudgetProps = {
      id: 'b1', name: 'Over', amount: 100, spent: 150, category: 'food',
      createdBy: 'u1', partnerId: 'u2', createdAt: new Date(), updatedAt: new Date(),
    };
    const budget = Budget.reconstitute(props);
    expect(budget.isOverBudget).toBe(true);
    expect(budget.isNearLimit).toBe(false); // over budget, not near limit
  });
});

// ─── update() ─────────────────────────────────────────────────────────────────
describe('Budget.update()', () => {
  it('updates name', () => {
    const budget = Budget.create(validProps()).getValue();
    const updated = budget.update({ name: 'New name' }).getValue();
    expect(updated.name).toBe('New name');
  });

  it('fails if new amount < already spent', () => {
    const budget = Budget.create(validProps()).getValue();
    const withSpending = budget.addSpending(500).getValue();
    const result = withSpending.update({ amount: 200 });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('amount');
  });
});

// ─── canBeModifiedBy ──────────────────────────────────────────────────────────
describe('Budget.canBeModifiedBy()', () => {
  it('allows creator', () => {
    const budget = Budget.create(validProps()).getValue();
    expect(budget.canBeModifiedBy('user-1')).toBe(true);
  });

  it('allows partner', () => {
    const budget = Budget.create(validProps()).getValue();
    expect(budget.canBeModifiedBy('user-2')).toBe(true);
  });

  it('denies third party', () => {
    const budget = Budget.create(validProps()).getValue();
    expect(budget.canBeModifiedBy('stranger')).toBe(false);
  });
});
