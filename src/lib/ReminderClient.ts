import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';

class ReminderClient {
  static async createReminders(medication: Medication) {
    const user = await User.findByPk(medication.userId);
    const drugInfo = JSON.parse(medication.drugInfo as string) as drugInfo;

    drugInfo.forEach(async (info) => {
      try {
        await Reminder.create({
          userId: medication.userId,
          userNotificationType: user?.notificationType,
          medicationId: medication.id,
          startDate: new Date(info.startDate),
          hours: info.hours,
          endDate: new Date(info.endDate),
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async updateReminders(medication: Medication) {
    await Reminder.destroy({ where: { medicationId: medication.id } });

    ReminderClient.createReminders(medication);
  }

  static async changeNotificationType(
    userId: string,
    notificationType: 'WHATSAPP' | 'EMAIL' | 'SMS'
  ) {
    await Reminder.update(
      {
        userNotificationType: notificationType
      },
      {
        where: { userId }
      }
    );
  }
}

export default ReminderClient;
