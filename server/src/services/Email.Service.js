import nodemailer from 'nodemailer';
import config from '../configs/config.js';
import logger from '../configs/logger.js';

class EmailService {
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

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"YiBu Security" <${config.email.user}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      return null;
    }
  }

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
