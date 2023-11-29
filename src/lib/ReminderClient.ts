import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';
import { addSuffix, changeToUTC, groupRemindersByName } from './handlers';
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

  static generateReport(medication: Medication) {
    const medicationReminders = medication.Reminders;
    const validReminders = medicationReminders.filter((reminder) => {
      return Object.keys(reminder.status).length > 0;
    });

    if (validReminders.length === 0) {
      return [true, 'Start date/time for drugs hasn\'t reached'];
    }

    const groupedReminders =  groupRemindersByName(validReminders);

    const report: {
      [keys: string]: {
        [keys: string]: [string, boolean][];
      };
    } = {};
  
    const drugs = Object.keys(groupedReminders);
    drugs.forEach((drug) => {
      report[drug] = {};
      const reminders = groupedReminders[drug];
      reminders.forEach((reminder) => {
        const datesAndStatuses = Object.entries(reminder.status);
        datesAndStatuses.forEach((dateAndStatus) => {
          if (report[drug][dateAndStatus[0]] === undefined) {
            report[drug][dateAndStatus[0]] = [[reminder.time, dateAndStatus[1]]];
          } else {
            report[drug][dateAndStatus[0]].push([
              reminder.time,
              dateAndStatus[1],
            ]);
          }
        });
      });
    });

    return [false, report];
  }
}

export default ReminderClient;
