import { CronJob } from 'cron';
import { Op } from 'sequelize';
import Reminder from '../../models/Reminder';
import { Medication } from '../../models/Medication';
import User from '../../models/User';
import sendEmailNotificationQueue from '../queues/sendEmailNotification';

const sendNotifications = new CronJob('* * * * *', async () => {
  try {
    const jobStartTime = new Date();
    const time = `${jobStartTime
      .getHours()
      .toString()
      .padStart(2, '0')}:${jobStartTime.getMinutes()}`;
    
    console.log(time);

    const ValidReminders = await Reminder.findAll({
      where: {
        startDate: { [Op.lte]: jobStartTime },
        endDate: { [Op.gt]: jobStartTime },
        time,
      },
      include: [Medication, User],
    });

    ValidReminders.forEach((reminder) => {
      if (reminder.userNotificationType === 'EMAIL') {
        // Send Mail
        sendEmailNotificationQueue.add({ reminder });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

export default sendNotifications;
