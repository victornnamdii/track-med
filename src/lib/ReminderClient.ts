import User from '../models/User';
import { Medication, drugInfo } from '../models/Medication';
import Reminder from '../models/Reminder';
import {
  addSuffix,
  changeToLocalTime,
  changeToUTC,
  convertDateAndTimeStringToLocal,
  createNewToken,
  groupRemindersByName
} from './handlers';
import env from '../config/env';
import BodyError from './BodyError';

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

    if (env.NODE_ENV !== 'dev') {
      changeToLocalTime(validReminders);
    }
    const groupedReminders = groupRemindersByName(validReminders);

    const report: {
      [keys: string]: {
        [keys: string]: [string, boolean | string][];
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

      const drugDates = Object.keys(report[drug]);
      drugDates.forEach((date) => {
        report[drug][date].sort((a, b) => a[0] > b[0] ? 1 : -1);
      });
    });

    return [false, report];
  }

  static async updateStatus(
    reminderId: string,
    date: string,
    value: boolean | string
  ) {
    const reminder = await Reminder.findByPk(reminderId);
    if (reminder === null) {
      throw new BodyError('Reminder not found');
    }

    const { status } = reminder;
    if (status[date] !== value) {
      status[date] = value;

      await Reminder.update(
        {
          status
        },
        {
          where: { id: reminder.id }
        }
      );
    }
  }

  static async snoozeReminder(
    reminder: Reminder,
    date: string,
  ) {
    const [hour, minute] = reminder.time.split(':');

    let newMinute = Number(minute) + 10;
    let newHour = Number(hour);

    const startDate = new Date(date as string);

    if (newMinute > 59) {
      newMinute -= 60;
      newHour += 1;
      const newDay = env.NODE_ENV === 'dev'
        ? newHour > 23 : newHour > 22; // CHECK THIS LATER TIMEZONE STUFF

      if (newDay) {
        throw new BodyError(
          'You can not snooze a medication reminder into a new day'
        );
      }
    }

    const time = `${newHour
      .toString()
      .padStart(2, '0')}:${newMinute
      .toString()
      .padStart(2, '0')}`;

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const localDateAndTime = env.NODE_ENV === 'dev'
      ? [date, time]
      : convertDateAndTimeStringToLocal(date, time);

    if (reminder.snoozed === false) {
      await Reminder.create({
        UserId: reminder.UserId,
        userNotificationType: reminder.userNotificationType,
        MedicationId: reminder.MedicationId,
        startDate,
        time,
        endDate,
        message: reminder.message,
        drugName: reminder.drugName,
        snoozed: true,
        ReminderId: reminder.id
      });
    } else {
      await Reminder.update(
        {
          startDate,
          time,
          endDate,
          token: createNewToken(reminder.token),
          status: {}
        },
        {
          where: { id: reminder.id }
        }
      );
    }

    await ReminderClient.updateStatus(
      reminder.snoozed === true ? reminder.ReminderId : reminder.id,
      date,
      `snoozed to:${localDateAndTime[0]} ${localDateAndTime[1]}`
    );

    return localDateAndTime;
  }
}

export default ReminderClient;
