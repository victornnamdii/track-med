import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';
import { addSuffix, changeToUTC } from './handlers';
import env from '../config/env';

class ReminderClient {
  static async createReminders(medication: Medication) {
    const user = await User.findByPk(medication.UserId);
    const drugInfo = medication.drugInfo as drugInfo;

    drugInfo.forEach((info) => {
      const times = info.times as string[];
      times.forEach(async (time) => {
        try {
          const message = `Hey ${user?.firstName
          }! Remember to take ${info.dose} of your ${info.drugName
          }. This is the reminder for your ${addSuffix(
            times.indexOf(time) + 1
          )} dose today.`;

          const endDate = new Date(info.endDate);
          endDate.setDate(endDate.getDate() + 1);

          const UTCTimeAndDate = changeToUTC(
            time,
            info.startDate,
            info.endDate
          );

          await Reminder.create({
            UserId: medication.UserId,
            userNotificationType: user?.notificationType,
            MedicationId: medication.id,
            startDate: env.NODE_ENV === 'dev'
              ? new Date(info.startDate) :
              UTCTimeAndDate.startDate,
            time: env.NODE_ENV === 'dev'
              ? time : UTCTimeAndDate.time,
            endDate: env.NODE_ENV === 'dev'
              ? endDate :
              UTCTimeAndDate.endDate,
            message,
            drugName: info.drugName
          });
        } catch (error) {
          console.log(error);
        }
      });
    });
  }

  static async updateReminders(medication: Medication) {
    await Reminder.destroy({ where: { MedicationId: medication.id } });

    await ReminderClient.createReminders(medication);
  }

  static async changeNotificationType(
    UserId: string,
    notificationType: 'WHATSAPP' | 'EMAIL' | 'SMS'
  ) {
    await Reminder.update(
      {
        userNotificationType: notificationType
      },
      {
        where: { UserId }
      }
    );
  }
}

export default ReminderClient;
