import clearVerifications from './clearUnverifiedUsers';
import sendNotifications from './sendNotifications';

const startScheduledJobs = () => {
  clearVerifications.start();
  sendNotifications.start();
  console.log('Jobs started succesfully');
};

export default startScheduledJobs;