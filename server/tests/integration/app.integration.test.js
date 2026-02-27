import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import app from '../../src/app.js';
import {
  requestJson,
  startTestServer,
  stopTestServer,
} from '../shared/httpTestUtils.js';

describe('app integration', () => {
  let server;

  before(async () => {
    server = await startTestServer(app);
  });

  after(async () => {
    await stopTestServer(server);
  });

  it('GET /api/health should return service status', async () => {
    const response = await requestJson(server, {
      method: 'GET',
      path: '/api/health',
    });

    assert.equal(response.status, 200);
    assert.equal(response.body?.success, true);
    assert.equal(response.body?.data?.status, 'ok');
  });

  it('unknown route should return 404 with NOT_FOUND error code', async () => {
    const response = await requestJson(server, {
      method: 'GET',
      path: '/api/v2/unknown-route',
    });

    assert.equal(response.status, 404);
    assert.equal(response.body?.success, false);
    assert.equal(response.body?.errorCode, 'NOT_FOUND');
  });
});

