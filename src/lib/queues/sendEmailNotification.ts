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
  try {
    const originalReminder = reminder.snoozed === true
      ? await Reminder.findOne({ where: { id: reminder.ReminderId } }) as Reminder
      : reminder;
    const status = reminder.status;

    if (status[date] !== true) {
      console.log(`Sending Email Notification to ${reminder.User?.email}`);
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
        `${env.HOST}/reminders/${originalReminder
          .id}/complete?token=${originalReminder
          .token}&date=${date}`,
        `${env.HOST}/reminders/${reminder.id}/snooze?token=${reminder.token}&date=${date}`
      );
      console.log(`Sent Email Notification to ${reminder.User?.email}`);
    }
  } catch (error) {
    console.log(error);
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendEmailNotificationQueue;
