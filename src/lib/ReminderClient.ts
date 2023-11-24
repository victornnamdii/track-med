import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';

class ReminderClient {
  static async createReminders(medication: Medication) {
    const user = await User.findByPk(medication.UserId);
    const drugInfo = JSON.parse(medication.drugInfo as string) as drugInfo;

    drugInfo.forEach(async (info) => {
      const message = `Hey! Remember to take ${info.dose} of your ${info.drugName}.`;
      try {
        await Reminder.create({
          UserId: medication.UserId,
          userNotificationType: user?.notificationType,
          MedicationId: medication.id,
          startDate: new Date(info.startDate),
          hours: info.hours,
          endDate: new Date(info.endDate),
          message
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async updateReminders(medication: Medication) {
    await Reminder.destroy({ where: { MedicationId: medication.id } });

    ReminderClient.createReminders(medication);
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
