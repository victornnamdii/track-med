import Queue from 'bull';
import emailService from '../emailService';
import env from '../../config/env';

const sendEmailQueue = new Queue('User Verification', {
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

sendEmailQueue.on('error', (error) => {
  console.log('User Verification Queue Error');
  console.log(error);
});

sendEmailQueue.process(async (job, done) => {
  const { user } = job.data;
  console.log(`Sending User Verification mail to ${user.email}`);
  try {
    await emailService.sendVerificationMail(user);
  } catch (error) {
    console.log(error);
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendEmailQueue;
