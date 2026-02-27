import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeRegExp } from '../../../src/utils/escapeRegExp.js';
import { getPaginationParams } from '../../../src/utils/pagination.js';
import { normalizeReportStatus } from '../../../src/utils/reportStatus.js';
import { hashPII } from '../../../src/utils/hashPII.js';
import { hashRefreshToken } from '../../../src/utils/refreshTokenHash.js';

describe('utils/basic', () => {
  it('escapeRegExp should escape regex special characters', () => {
    const escaped = escapeRegExp('hello.*(world)?');

    assert.equal(escaped, 'hello\\.\\*\\(world\\)\\?');
  });

  it('getPaginationParams should parse and clamp values', () => {
    const result = getPaginationParams({ page: '0', limit: '200' });

    assert.deepEqual(result, {
      page: 1,
      limit: 100,
      skip: 0,
    });
  });

  it('normalizeReportStatus should normalize legacy statuses', () => {
    assert.equal(normalizeReportStatus('dismissed'), 'rejected');
    assert.equal(normalizeReportStatus('in_review'), 'reviewing');
    assert.equal(normalizeReportStatus('pending'), 'pending');
  });

  it('hashPII should be deterministic and case-insensitive', () => {
    const a = hashPII('Example@Email.com');
    const b = hashPII('example@email.com');

    assert.equal(a, b);
    assert.equal(a.length, 12);
    assert.equal(hashPII(''), null);
  });

  it('hashRefreshToken should return deterministic sha256 hash', () => {
    const hash1 = hashRefreshToken('refresh-token-value');
    const hash2 = hashRefreshToken('refresh-token-value');

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
    assert.equal(hashRefreshToken(null), null);
  });
});
