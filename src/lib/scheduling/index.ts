import clearVerifications from './clearUnverifiedUsers';

const startScheduledJobs = () => {
  clearVerifications.start();
  console.log('Jobs started succesfully');
};

export default startScheduledJobs;