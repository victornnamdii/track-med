import Queue from 'bull';
import emailService from '../emailService';
import env from '../../config/env';
import Reminder from '../../models/Reminder';

const sendEmailNotificationQueue = new Queue('Email Notification', {
  redis: env.REDIS_URL,
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
  const { reminder, date } = job.data as { reminder: Reminder, date: string };
  console.log(`Sending Email Notification to ${reminder.User?.email}`);
  try {
    const status = reminder.status;
    status[date] = false;
    await Reminder.update(
      {
        status
      },
      {
        where: { id: reminder.id }
      }
    );
    await emailService.sendReminderMail(
      reminder.User.email,
      reminder.Medication.name,
      reminder.message,
      `${env.HOST}/reminders/complete/${reminder.id}?token=${reminder.token}&date=${date}`
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
