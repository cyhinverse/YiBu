import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { retryOperation } from '../../../src/utils/retryOperation.js';

describe('utils/retryOperation', () => {
  it('should retry write-conflict errors and eventually resolve', async () => {
    let attempts = 0;
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = await retryOperation(
        async () => {
          attempts += 1;
          if (attempts < 3) {
            const error = new Error('Write conflict');
            error.code = 112;
            throw error;
          }
          return 'ok';
        },
        { maxRetries: 3, baseDelay: 0, exponentialBackoff: false }
      );

      assert.equal(result, 'ok');
      assert.equal(attempts, 3);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('should throw immediately for non-retryable errors', async () => {
    let attempts = 0;

    await assert.rejects(
      retryOperation(
        async () => {
          attempts += 1;
          throw new Error('Validation failed');
        },
        { maxRetries: 5, baseDelay: 0, exponentialBackoff: false }
      ),
      /Validation failed/
    );

    assert.equal(attempts, 1);
  });
});
