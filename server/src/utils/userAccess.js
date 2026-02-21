export const USER_ACCESS_SELECT_FIELDS =
  '_id isAdmin isActive moderation.status moderation.suspendedUntil moderation.expiresAt';

const getSuspendedUntil = user =>
  user?.moderation?.suspendedUntil || user?.moderation?.expiresAt || null;

export const buildSuspensionResetUpdate = (now = new Date()) => ({
  $set: {
    'moderation.status': 'active',
    'moderation.reason': null,
    'moderation.suspendedUntil': null,
    'moderation.expiresAt': null,
    'moderation.moderatedAt': now,
  },
});

export const evaluateUserAccessState = (user, now = new Date()) => {
  if (!user || user.isActive === false) {
    return { ok: false, reason: 'USER_INACTIVE' };
  }

  if (user.moderation?.status === 'banned') {
    return { ok: false, reason: 'ACCOUNT_BANNED' };
  }

  if (user.moderation?.status !== 'suspended') {
    return { ok: true };
  }

  const suspendedUntil = getSuspendedUntil(user);
  if (!suspendedUntil) {
    return { ok: true };
  }

  if (suspendedUntil > now) {
    const remainingDays = Math.ceil(
      (suspendedUntil - now) / (1000 * 60 * 60 * 24)
    );
    return {
      ok: false,
      reason: 'ACCOUNT_SUSPENDED',
      suspendedUntil,
      remainingDays,
    };
  }

  return {
    ok: true,
    shouldClearSuspension: true,
  };
};

