import bcrypt from 'bcrypt';
import { BaseError, UniqueConstraintError, ValidationError } from 'sequelize';
import BodyError from './BodyError';
import Reminder from '../models/Reminder';

const hashString = async (string: string, mode: 'signup' | 'default'): Promise<string> => {
  if (string === undefined) {
    throw new BodyError('Please enter a password');
  }
  if (typeof string !== 'string') {
    throw new BodyError('Password should be a string');
  }
  if (string.length < 6 && mode === 'signup') {
    throw new BodyError('Password should be at least 6 characters');
  }
  const salt = await bcrypt.genSalt();
  const hashedString = await bcrypt.hash(string, salt);
  return hashedString;
};

const sequelizeErrorHandler = (
  error: BaseError
): { status: number; message: string } => {
  if (error instanceof UniqueConstraintError) {
    if ('name' in error.fields) {
      return {
        status: 400,
        message: `You already have a medication named ${error.fields.name}`,
      };
    }
    return { status: 400, message: error.errors[0].message };
  }
  if (error instanceof ValidationError) {
    // @ts-expect-error: 'spelling check'
    if (error.errors[0].type === 'notNull Violation') {
      return {
        status: 400,
        message: `${error.errors[0].path} is required`,
      };
    }
    return { status: 400, message: error.errors[0].message };
  }
  return { status: 500, message: 'Internal Server Error' };
};

const addSuffix = (number: number) => {
  const j = number % 10;
  const k = number % 100;
  if (j == 1 && k != 11) {
    return number + 'st';
  }
  if (j == 2 && k != 12) {
    return number + 'nd';
  }
  if (j == 3 && k != 13) {
    return number + 'rd';
  }
  return number + 'th';
};

const sortTimes = (times: string[]) => {
  const sortedTimes = times.map((time) => {
    const [hour, minute] = time.split(':');
    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    return formattedTime;
  });
  sortedTimes.sort();
  return sortedTimes;
};

const groupRemindersByName = (reminders: Reminder[]) => {
  const groupedReminders: { [keys: string]: Reminder[] } = {};
  reminders.forEach((reminder) => {
    if (groupedReminders[reminder.drugName] === undefined) {
      groupedReminders[reminder.drugName] = [reminder];
    } else {
      groupedReminders[reminder.drugName].push(reminder);
    }
  });
  return groupedReminders;
};

const changeToUTC = (time: string, startDate: string, endDate: string) => {
  const [hour, minute] = time.split(':');
  let newHour = Number(hour) - 1;
  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  if (newHour < 0) {
    newHour += 24;
    newStartDate.setDate(newStartDate.getDate() - 1);
  } else {
    newEndDate.setDate(newEndDate.getDate() + 1);
  }

  const newDateAndTime = {
    time: `${newHour
      .toString()
      .padStart(2, '0')}:${minute}`,
    startDate: newStartDate,
    endDate: newEndDate,
  };
  return newDateAndTime;
};

const changeToLocalTime = (reminders: Reminder[]) => {

  reminders.forEach((reminder) => {
    const time = reminder.time;
    const [hour, minute] = time.split(':');
    let newHour = Number(hour) + 1;

    if (newHour > 23) {
      newHour -= 24;

      const status = reminder.status;
      const oldDates = Object.keys(status);
      const oldAndNewDates: [string, string][] = [];

      oldDates.forEach((oldDate) => {
        const newDateConstructor = new Date(oldDate);
        newDateConstructor.setDate(
          newDateConstructor.getDate() + 1
        );

        const newDate = `${newDateConstructor
          .getFullYear()}-${(newDateConstructor
          .getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${newDateConstructor
          .getDate()
          .toString()
          .padStart(2, '0')}`;
        
        oldAndNewDates.push([oldDate, newDate]);
      });

      oldAndNewDates.forEach((oldAndNewDate) => {
        const statusValue = status[oldAndNewDate[0]];
        delete reminder.status[oldAndNewDate[0]];
        reminder.status[oldAndNewDate[1]] = statusValue;
      });
    }

    reminder.time = `${newHour
      .toString()
      .padStart(2, '0')}:${minute}`;
  });
};

export {
  hashString,
  sequelizeErrorHandler,
  addSuffix,
  sortTimes,
  groupRemindersByName,
  changeToUTC,
  changeToLocalTime,
};
