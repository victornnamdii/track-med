import Queue from 'bull';
import env from '../../config/env';
import Reminder from '../../models/Reminder';
import whatsappClient from '../whatsappService';

const sendWhatsappNotificationQueue = new Queue('Whatsapp Notification', {
  redis: env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

sendWhatsappNotificationQueue.on('error', (error) => {
  console.log('Whatsapp Notification Queue Error');
  console.log(error);
});

sendWhatsappNotificationQueue.process(async (job, done) => {
  const { reminder, date } = job.data as { reminder: Reminder, date: string };
  console.log(`Sending Whatsapp Notification to ${reminder.User?.phoneNumber}`);
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
    await whatsappClient.sendReminder(
      reminder.User.phoneNumber.slice(1),
      reminder.Medication.name,
      reminder.message,
      `${env.HOST}/reminders/complete/${reminder.id}?token=${reminder.token}&date=${date}`
    );
    console.log(`Sent Whatsapp Notification to ${reminder.User?.phoneNumber}`);
  } catch (error) {
    console.log(error);
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendWhatsappNotificationQueue;
