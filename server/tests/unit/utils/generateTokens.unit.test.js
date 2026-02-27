import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import config from '../../../src/configs/config.js';
import { generateAccessToken } from '../../../src/utils/GenerateTokens.js';
import { ensureJwtSecret } from '../../shared/authTestUtils.js';

describe('utils/GenerateTokens', () => {
  it('generateAccessToken should sign payload with configured access secret', () => {
    const secret = ensureJwtSecret();
    config.jwt.accessSecret = secret;
    const payload = { id: '507f191e810c19729de860ea', role: 'user' };

    const token = generateAccessToken(payload);
    const decoded = jwt.verify(token, secret);

    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.role, payload.role);
  });
});

