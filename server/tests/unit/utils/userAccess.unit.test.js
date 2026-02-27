import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSuspensionResetUpdate,
  evaluateUserAccessState,
} from '../../../src/utils/userAccess.js';

describe('utils/userAccess', () => {
  it('evaluateUserAccessState should reject inactive users', () => {
    const result = evaluateUserAccessState({ isActive: false });

    assert.deepEqual(result, { ok: false, reason: 'USER_INACTIVE' });
  });

  it('evaluateUserAccessState should reject banned users', () => {
    const result = evaluateUserAccessState({
      isActive: true,
      moderation: { status: 'banned' },
    });

    assert.deepEqual(result, { ok: false, reason: 'ACCOUNT_BANNED' });
  });

  it('evaluateUserAccessState should return suspended state for future suspension date', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const suspendedUntil = new Date('2026-01-03T00:00:00.000Z');

    const result = evaluateUserAccessState(
      {
        isActive: true,
        moderation: { status: 'suspended', suspendedUntil },
      },
      now
    );

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'ACCOUNT_SUSPENDED');
    assert.equal(result.remainingDays, 2);
  });

  it('evaluateUserAccessState should clear expired suspension', () => {
    const now = new Date('2026-01-04T00:00:00.000Z');
    const suspendedUntil = new Date('2026-01-03T00:00:00.000Z');

    const result = evaluateUserAccessState(
      {
        isActive: true,
        moderation: { status: 'suspended', suspendedUntil },
      },
      now
    );

    assert.deepEqual(result, {
      ok: true,
      shouldClearSuspension: true,
    });
  });

  it('evaluateUserAccessState should allow suspended status without expiry date', () => {
    const result = evaluateUserAccessState({
      isActive: true,
      moderation: { status: 'suspended' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.shouldClearSuspension, undefined);
  });

  it('buildSuspensionResetUpdate should return expected update payload', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const payload = buildSuspensionResetUpdate(now);

    assert.equal(payload.$set['moderation.status'], 'active');
    assert.equal(payload.$set['moderation.reason'], null);
    assert.equal(payload.$set['moderation.suspendedUntil'], null);
    assert.equal(payload.$set['moderation.expiresAt'], null);
    assert.equal(payload.$set['moderation.moderatedAt'], now);
  });
});
