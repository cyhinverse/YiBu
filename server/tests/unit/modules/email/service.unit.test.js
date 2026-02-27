import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import nodemailer from 'nodemailer';
import EmailService from '../../../../src/modules/shared/email/email.service.js';
import config from '../../../../src/configs/config.js';
import logger from '../../../../src/configs/logger.js';

describe('EmailService', () => {
  it('sendEmail should pass payload to transporter and return info on success', async () => {
    const originalSendMail = EmailService.transporter.sendMail;
    let receivedPayload;

    EmailService.transporter.sendMail = async payload => {
      receivedPayload = payload;
      return { messageId: 'mail-1' };
    };

    try {
      const info = await EmailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<b>Hello</b>'
      );

      assert.equal(info.messageId, 'mail-1');
      assert.equal(receivedPayload.to, 'test@example.com');
      assert.equal(receivedPayload.subject, 'Test Subject');
      assert.equal(receivedPayload.html, '<b>Hello</b>');
      assert.ok(receivedPayload.from.includes('YiBu Security'));
    } finally {
      EmailService.transporter.sendMail = originalSendMail;
    }
  });

  it('sendEmail should return null when transporter throws', async () => {
    const originalSendMail = EmailService.transporter.sendMail;

    EmailService.transporter.sendMail = async () => {
      throw new Error('smtp error');
    };

    try {
      const info = await EmailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<b>Hello</b>'
      );

      assert.equal(info, null);
    } finally {
      EmailService.transporter.sendMail = originalSendMail;
    }
  });

  it('sendPasswordReset should call sendEmail with reset link template', async () => {
    const originalSendEmail = EmailService.sendEmail;
    let receivedArgs;

    EmailService.sendEmail = async (...args) => {
      receivedArgs = args;
      return { messageId: 'mail-2' };
    };

    try {
      const resetLink = 'https://example.com/reset?token=abc123';
      const info = await EmailService.sendPasswordReset('test@example.com', resetLink);

      assert.equal(info.messageId, 'mail-2');
      assert.equal(receivedArgs[0], 'test@example.com');
      assert.equal(receivedArgs[1], 'Yêu cầu đặt lại mật khẩu - YiBu');
      assert.ok(receivedArgs[2].includes(resetLink));
    } finally {
      EmailService.sendEmail = originalSendEmail;
    }
  });

  it('sendEmail should write debug log metadata when debugMode is enabled', async () => {
    const originalSendMail = EmailService.transporter.sendMail;
    const originalDebugMode = config.debugMode;
    const originalLoggerInfo = logger.info;
    const infoLogs = [];

    EmailService.transporter.sendMail = async () => ({ messageId: 'mail-debug' });
    config.debugMode = true;
    logger.info = (...args) => {
      infoLogs.push(args);
    };

    try {
      const info = await EmailService.sendEmail(
        'debug@example.com',
        'Debug Subject',
        '<b>Debug</b>'
      );

      assert.equal(info.messageId, 'mail-debug');
      assert.equal(infoLogs.length >= 2, true);
      assert.equal(infoLogs[0][0], 'Attempting to send email');
      assert.equal(infoLogs[0][1].module, 'email');
      assert.equal(typeof infoLogs[0][1].toHash, 'string');
      assert.equal(typeof infoLogs[0][1].allowInsecureTls, 'boolean');
    } finally {
      EmailService.transporter.sendMail = originalSendMail;
      config.debugMode = originalDebugMode;
      logger.info = originalLoggerInfo;
    }
  });

  it('sendEmail should omit stack details from error log outside development', async () => {
    const originalSendMail = EmailService.transporter.sendMail;
    const originalEnv = config.env;
    const originalLoggerError = logger.error;
    let loggedPayload;

    EmailService.transporter.sendMail = async () => {
      throw new Error('smtp prod error');
    };
    config.env = 'production';
    logger.error = (_message, payload) => {
      loggedPayload = payload;
    };

    try {
      const info = await EmailService.sendEmail(
        'prod@example.com',
        'Prod Subject',
        '<b>Prod</b>'
      );

      assert.equal(info, null);
      assert.equal(loggedPayload.module, 'email');
      assert.equal(loggedPayload.message, 'smtp prod error');
      assert.equal(Object.hasOwn(loggedPayload, 'stack'), false);
    } finally {
      EmailService.transporter.sendMail = originalSendMail;
      config.env = originalEnv;
      logger.error = originalLoggerError;
    }
  });

  it('constructor should include tls config only when allowInsecureTls is enabled', () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalAllowInsecureTls = config.email.allowInsecureTls;
    let capturedOptions = null;

    nodemailer.createTransport = options => {
      capturedOptions = options;
      return { sendMail: async () => ({ messageId: 'x' }) };
    };

    try {
      config.email.allowInsecureTls = true;
      new EmailService.constructor();
      assert.equal(capturedOptions.tls.rejectUnauthorized, false);

      config.email.allowInsecureTls = false;
      new EmailService.constructor();
      assert.equal(Object.hasOwn(capturedOptions, 'tls'), false);
    } finally {
      nodemailer.createTransport = originalCreateTransport;
      config.email.allowInsecureTls = originalAllowInsecureTls;
    }
  });
});

