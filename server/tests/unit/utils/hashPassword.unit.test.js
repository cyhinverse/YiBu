import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import {
  hashPassword,
  comparePassword,
} from '../../../src/utils/HashPassword.js';

describe('utils/HashPassword', () => {
  it('hashPassword should generate non-plain hash and comparePassword should verify it', async () => {
    const plain = 'StrongPass1';
    const hash = await hashPassword(plain);

    assert.notEqual(hash, plain);
    assert.equal(await comparePassword(plain, hash), true);
    assert.equal(await comparePassword('WrongPass1', hash), false);
  });

  it('hashPassword should rethrow when bcrypt.hash fails', async () => {
    const originalHash = bcrypt.hash;
    bcrypt.hash = async () => {
      throw new Error('hash failed');
    };

    try {
      await assert.rejects(() => hashPassword('StrongPass1'), /hash failed/);
    } finally {
      bcrypt.hash = originalHash;
    }
  });

  it('comparePassword should rethrow when bcrypt.compare fails', async () => {
    const originalCompare = bcrypt.compare;
    bcrypt.compare = async () => {
      throw new Error('compare failed');
    };

    try {
      await assert.rejects(
        () => comparePassword('StrongPass1', 'invalid-hash'),
        /compare failed/
      );
    } finally {
      bcrypt.compare = originalCompare;
    }
  });
});
