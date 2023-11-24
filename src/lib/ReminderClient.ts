import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';
import { addSuffix } from './handlers';

class ReminderClient {
  static async createReminders(medication: Medication) {
    const user = await User.findByPk(medication.UserId);
    const drugInfo = JSON.parse(medication.drugInfo as string) as drugInfo;

    drugInfo.forEach((info) => {
      info.hours.forEach(async (hour) => {
        try {
          const message = `Hey ${user?.firstName
          }! Remember to take ${info.dose} of your ${info.drugName
          } now. This is the reminder for your ${addSuffix(
            info.hours.indexOf(hour) + 1
          )} dose today.`;

          await Reminder.create({
            UserId: medication.UserId,
            userNotificationType: user?.notificationType,
            MedicationId: medication.id,
            startDate: new Date(info.startDate),
            hour,
            endDate: new Date(info.endDate),
            message
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
