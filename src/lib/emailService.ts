import nodemailer from 'nodemailer';
import env from '../config/env';
import { v4 } from 'uuid';
import User from '../models/User';
import { hashString } from './handlers';
import redisClient from '../config/redis';

class EmailService {
  protected transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    auth: {
      user: env.EMAIL_ADDRESS,
      pass: env.EMAIL_PASSWORD,
    },
  });
  constructor() {
    this.transporter.verify((err, success) => {
      if (!success) {
        throw err;
      }
    });
  }

  async sendVerificationMail(user: User) {
    const prefixUrl = env.HOST;
    const uniqueString = v4() + user.id;

    const mailOptions = {
      from: 'TRACK MED',
      to: user.email,
      subject: 'Please verify your Email',
      html: `<p>Please click the link below to verify your email.</p><p>The link <b>expires in 6 hours</b>.</p><p>Click <a href=${`${prefixUrl}/auth/verify/${user.id}/${uniqueString}`}>here</a> to verify</p>`,
    };

    const hashedString = await hashString(uniqueString);
    await redisClient.set(
      `trackmed_verify_${user.id}`,
      hashedString,
      6 * 60 * 60
    );
    await this.transporter.sendMail(mailOptions);
  }

  async sendReminderMail(
    email: string,
    medicationName: string,
    message: string,
    link: string
  ) {
    const mailOptions = {
      from: 'TRACK MED',
      to: email,
      subject: `Reminder for ${medicationName}`,
      html: `<p>${message}</p><p>Click <a href=${link}>here</a> if you have taken them.</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

const emailService = new EmailService();

export default emailService;
