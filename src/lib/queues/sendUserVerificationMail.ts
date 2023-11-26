import Queue from 'bull';
import emailService from '../emailService';
import env from '../../config/env';
import User from '../../models/User';

const sendEmailQueue = new Queue('User Verification', {
  redis: env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

sendEmailQueue.on('error', (error) => {
  console.log('User Verification Queue Error');
  console.log(error);
});

sendEmailQueue.process(async (job, done) => {
  const { user } = job.data as { user: User };
  console.log(`Sending User Verification mail to ${user.email}`);
  try {
    await emailService.sendVerificationMail(user);
    console.log(`Sent User Verification mail to ${user.email}`);
  } catch (error) {
    console.log(error);
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendEmailQueue;
