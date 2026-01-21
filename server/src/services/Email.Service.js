import nodemailer from 'nodemailer';
import config from '../configs/config.js';
import logger from '../configs/logger.js';

class EmailService {
  /**
   * Initialize Email Service with nodemailer configuration
   */
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Send email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML content of the email
   * @returns {Promise<Object|null>} Sent email info or null if error
   */
  async sendEmail(to, subject, html) {
    try {
      // Log email config for debugging
      logger.info(
        `Attempting to send email to ${to} via ${config.email.host}:${config.email.port}`
      );
      logger.info(`Email user configured: ${config.email.user ? 'Yes' : 'No'}`);
      logger.info(`Email pass configured: ${config.email.pass ? 'Yes' : 'No'}`);

      const info = await this.transporter.sendMail({
        from: `"YiBu Security" <${config.email.user}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error.message);
      logger.error(`Full error:`, error);
      return null;
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email address
   * @param {string} resetLink - Password reset link
   * @returns {Promise<Object|null>} Sent email info or null if error
   */
  async sendPasswordReset(to, resetLink) {
    const subject = 'Yêu cầu đặt lại mật khẩu - YiBu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xin chào,</h2>
        <p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản YiBu.</p>
        <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu (Token hết hạn sau 1 giờ):</p>
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
        <p>Hoặc truy cập link sau:</p>
        <p>${resetLink}</p>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">YiBu Security Team</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send account verification email
   * @param {string} to - Recipient email address
   * @param {string} verificationLink - Email verification link
   * @returns {Promise<Object|null>} Sent email info or null if error
   */
  async sendVerificationEmail(to, verificationLink) {
    const subject = 'Xác thực tài khoản - YiBu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Chào mừng đến với YiBu!</h2>
        <p>Vui lòng xác thực địa chỉ email để kích hoạt đầy đủ tính năng:</p>
        <a href="${verificationLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực Email</a>
        <p>Hoặc truy cập link sau:</p>
        <p>${verificationLink}</p>
        <hr>
        <p style="font-size: 12px; color: #888;">YiBu Team</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
}

export default new EmailService();
