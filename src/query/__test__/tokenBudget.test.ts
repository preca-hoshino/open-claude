import { describe, it, expect, mock } from 'bun:test';

mock.module('../../utils/tokenBudget.js', () => ({
  getBudgetContinuationMessage: (pct: number, _turnTokens: number, _budget: number): string => `budget nudge ${pct}%`,
}));

import { createBudgetTracker, checkTokenBudget } from '../tokenBudget.js';

describe('tokenBudget', () => {
  it('createBudgetTracker should return initial tracker state', () => {
    const tracker = createBudgetTracker();
    expect(tracker.continuationCount).toBe(0);
    expect(tracker.lastDeltaTokens).toBe(0);
    expect(tracker.lastGlobalTurnTokens).toBe(0);
    expect(typeof tracker.startedAt).toBe('number');
  });

  it('checkTokenBudget should return stop if agentId is present', () => {
    const tracker = createBudgetTracker();
    const decision = checkTokenBudget(tracker, 'agent-123', 1000, 100);
    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') {
      expect(decision.completionEvent).toBeNull();
    }
  });

  it('checkTokenBudget should return stop if budget is null or <= 0', () => {
    const tracker = createBudgetTracker();
    expect(checkTokenBudget(tracker, undefined, null, 100).action).toBe('stop');
    expect(checkTokenBudget(tracker, undefined, 0, 100).action).toBe('stop');
  });

  it('checkTokenBudget should continue if turnTokens < COMPLETION_THRESHOLD', () => {
    const tracker = createBudgetTracker();
    const decision = checkTokenBudget(tracker, undefined, 1000, 500);
    expect(decision.action).toBe('continue');
    if (decision.action === 'continue') {
      expect(decision.continuationCount).toBe(1);
      expect(decision.nudgeMessage).toBe('budget nudge 50%');
      expect(decision.pct).toBe(50);
      expect(decision.turnTokens).toBe(500);
      expect(decision.budget).toBe(1000);
    }
  });

  it('checkTokenBudget should stop if turnTokens >= COMPLETION_THRESHOLD', () => {
    const tracker = createBudgetTracker();
    const decision = checkTokenBudget(tracker, undefined, 1000, 950);
    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') {
      expect(decision.completionEvent).toBeNull();
    }
  });

  it('should stop with completion event if there were previous continuations and turnsTokens >= COMPLETION_THRESHOLD', () => {
    const tracker = createBudgetTracker();
    checkTokenBudget(tracker, undefined, 1000, 500); // 1st continuation
    const decision = checkTokenBudget(tracker, undefined, 1000, 950); // >= 90%

    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') {
      expect(decision.completionEvent).not.toBeNull();
      expect(decision.completionEvent?.continuationCount).toBe(1);
      expect(decision.completionEvent?.diminishingReturns).toBe(false);
    }
  });

  it('should consider diminishing returns and stop if continuation is >= 3 and deltas < DIMINISHING_THRESHOLD', () => {
    const tracker = createBudgetTracker();
    tracker.continuationCount = 3;
    tracker.lastDeltaTokens = 100;
    tracker.lastGlobalTurnTokens = 200;

    const decision = checkTokenBudget(tracker, undefined, 1000, 400);

    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') {
      expect(decision.completionEvent?.diminishingReturns).toBe(true);
      expect(decision.completionEvent?.continuationCount).toBe(3);
    }
  });
});
