import assert from 'node:assert/strict';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { afterEach, describe, it } from 'node:test';
import {
  requestJson,
  startTestServer,
  stopTestServer,
} from '../../shared/httpTestUtils.js';

const LOGGER_MODULE_URL = new URL('../../../src/configs/logger.js', import.meta.url);

const importFreshLogger = async () =>
  import(`${LOGGER_MODULE_URL.href}?t=${Date.now()}-${Math.random()}`);

const waitForLogFlush = () => new Promise(resolve => setImmediate(resolve));

describe('configs/logger', () => {
  afterEach(async () => {
    await waitForLogFlush();
  });

  it('should create the logs directory when it does not exist', async () => {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(originalCwd, 'tmp-logger-test-'));

    try {
      process.chdir(tempDir);
      const loggerModule = await importFreshLogger();
      assert.equal(fs.existsSync(path.join(tempDir, 'logs')), true);
      loggerModule.default.close();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('morganProd should classify log levels by response status', async () => {
    const loggerModule = await importFreshLogger();
    const { default: logger, morganProd } = loggerModule;
    const originalInfo = logger.info;
    const originalWarn = logger.warn;
    const originalError = logger.error;
    const calls = [];

    logger.info = message => {
      calls.push({ level: 'info', message });
    };
    logger.warn = message => {
      calls.push({ level: 'warn', message });
    };
    logger.error = message => {
      calls.push({ level: 'error', message });
    };

    const app = express();
    app.use(morganProd);
    app.get('/ok', (req, res) => res.status(200).send('ok'));
    app.get('/warn', (req, res) => res.status(404).send('missing'));
    app.get('/err', (req, res) => res.status(500).send('boom'));

    const server = await startTestServer(app);

    try {
      await requestJson(server, { path: '/ok' });
      await requestJson(server, { path: '/warn' });
      await requestJson(server, { path: '/err' });
      await waitForLogFlush();

      assert.deepEqual(
        calls.map(call => call.level),
        ['info', 'warn', 'error']
      );
      assert.match(calls[0].message, /^GET \/ok 200 /);
      assert.match(calls[1].message, /^GET \/warn 404 /);
      assert.match(calls[2].message, /^GET \/err 500 /);
    } finally {
      logger.info = originalInfo;
      logger.warn = originalWarn;
      logger.error = originalError;
      await stopTestServer(server);
      logger.close();
    }
  });

  it('morganMiddleware should skip /api/health requests', async () => {
    const loggerModule = await importFreshLogger();
    const { default: logger, morganMiddleware } = loggerModule;
    const originalInfo = logger.info;
    const originalWarn = logger.warn;
    const originalError = logger.error;
    const calls = [];

    logger.info = message => {
      calls.push({ level: 'info', message });
    };
    logger.warn = message => {
      calls.push({ level: 'warn', message });
    };
    logger.error = message => {
      calls.push({ level: 'error', message });
    };

    const app = express();
    app.use(morganMiddleware);
    app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));
    app.get('/posts', (req, res) => res.status(200).json({ ok: true }));

    const server = await startTestServer(app);

    try {
      await requestJson(server, { path: '/api/health' });
      await requestJson(server, { path: '/posts' });
      await waitForLogFlush();

      assert.equal(calls.length, 1);
      assert.equal(calls[0].level, 'info');
      assert.match(calls[0].message, /^GET \/posts 200 /);
    } finally {
      logger.info = originalInfo;
      logger.warn = originalWarn;
      logger.error = originalError;
      await stopTestServer(server);
      logger.close();
    }
  });
});
