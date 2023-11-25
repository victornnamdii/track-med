import bcrypt from 'bcrypt';
import { BaseError, UniqueConstraintError, ValidationError } from 'sequelize';
import BodyError from './BodyError';
import Reminder from '../models/Reminder';

const hashString = async (string: string): Promise<string> => {
  if (string === undefined) {
    throw new BodyError('Please enter a password');
  }
  if (typeof string !== 'string') {
    throw new BodyError('Password should be a string');
  }
  if (string.length < 6) {
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

const generateReport = (groupedReminders: { [keys: string]: Reminder[] }) => {
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
      const dateAndStatuses = Object.entries(reminder.status);
      dateAndStatuses.forEach((dateAndStatus) => {
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

  return report;
};

export {
  hashString,
  sequelizeErrorHandler,
  addSuffix,
  sortTimes,
  groupRemindersByName,
  generateReport,
};
