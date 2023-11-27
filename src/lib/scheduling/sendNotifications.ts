import { CronJob } from 'cron';
import { Op } from 'sequelize';
import Reminder from '../../models/Reminder';
import { Medication } from '../../models/Medication';
import User from '../../models/User';
import sendEmailNotificationQueue from '../queues/sendEmailNotification';
import sendWhatsappNotificationQueue from '../queues/sendWhatsAppNotification';

const sendNotifications = new CronJob('* * * * *', async () => {
  try {
    const jobStartTime = new Date();
    const time = `${jobStartTime
      .getHours()
      .toString()
      .padStart(2, '0')}:${jobStartTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    
    const date = `${jobStartTime
      .getFullYear()}-${(jobStartTime
      .getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${jobStartTime
      .getDate()
      .toString()
      .padStart(2, '0')}`;
    
    console.log(date, time);

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
        sendEmailNotificationQueue.add({ reminder, date });
      } else if (reminder.userNotificationType === 'WHATSAPP') {
        sendWhatsappNotificationQueue.add({ reminder, date });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

export default sendNotifications;
