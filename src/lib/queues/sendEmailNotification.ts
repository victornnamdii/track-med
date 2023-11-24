import Queue from 'bull';
import emailService from '../emailService';
import env from '../../config/env';

const sendEmailNotificationQueue = new Queue('Email Notification', {
  redis: {
    host: env.REDIS_HOST,
    password: env.REDIS_PASSWORD,
    port: Number(env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

sendEmailNotificationQueue.on('error', (error) => {
  console.log('Email Notification Queue Error');
  console.log(error);
});

sendEmailNotificationQueue.process(async (job, done) => {
  const { reminder } = job.data;
  console.log(`Sending Email Notification to ${reminder.User?.email}`);
  try {
    await emailService.sendReminderMail(
      reminder.User.email,
      reminder.Medication.name,
      reminder.message,
      `${env.HOST}/reminders/complete/${reminder.id}?token=${reminder.token}`
    );
    console.log(`Sent Email Notification to ${reminder.User?.email}`);
  } catch (error) {
    console.log(error);
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendEmailNotificationQueue;
