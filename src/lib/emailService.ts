import nodemailer from 'nodemailer';
import env from '../config/env';
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
    const randomNumber1 = Math.floor(Math.random() * 10).toString();
    const randomNumber4 = Math.floor(Math.random() * 100000).toString().padStart(6, randomNumber1);

    const mailOptions = {
      from: 'TRACK MED',
      to: user.email,
      subject: `Your Track Med OTP is ${randomNumber4}`,
      html: `<p>Hey ${user.firstName}! Use the code below to verify your email</p><p>The code <b>expires in 6 hours</b>.</p><p><b>${randomNumber4}</b></p>`,
    };

    const hashedString = await hashString(randomNumber4);
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
