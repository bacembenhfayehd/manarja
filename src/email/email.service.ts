import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Erreur de connexion SMTP', error);
      } else {
        this.logger.log('SMTP prêt à envoyer des emails ✅');
      }
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <h2>Reset password</h2>
      <p>You asked about reset your password :)</p>
      <p>clic here please:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset password
      </a>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you don't asked about reset your password forgot this mail.</p>
    `;

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset password',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email was send to : ${email}`);
    } catch (error) {
      this.logger.error(`Error sending email ${email}`, error);
      throw new InternalServerErrorException('error sending email ...');
    }
  }
}
