import { NextFunction, Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID';
import Reminder from '../models/Reminder';
import ReminderClient from '../lib/ReminderClient';

class ReminderController {
  static async markReminderComplete(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { ReminderId } = req.params;
      const { token, date } = req.query;

      if (token === undefined || !isUUID(ReminderId, 4) || date === undefined) {
        return res.status(400).json({ error: 'Invalid reminder link' });
      }

      const reminder = await Reminder.findByPk(ReminderId);
      const status = reminder?.status;
      const statusValue = status ? status[date as string] : undefined;

      if (
        reminder === null ||
        reminder.token !== token ||
        statusValue === undefined
      ) {
        return res.status(400).json({ error: 'Invalid reminder link' });
      }

      const validReminder = typeof statusValue === 'string'
        ? await Reminder.findOne({ where: { ReminderId } }) as Reminder
        : reminder;

      const validStatus = validReminder.status;
      const validStatusValue = validStatus[date as string];

      if (validStatusValue === true) {
        return res.status(400).json({ 
          error: 'Already marked this reminder as complete'
        });
      }

      validStatus[date as string] = true;

      await Reminder.update(
        { status: validStatus },
        {
          where: { id: validReminder.id }
        }
      );

      res.status(200).json({ message: 'Thank you for taking your drugs!' });
    } catch (error) {
      next(error);
    }
  }

  static async snoozeReminder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const RequestDate = new Date();
      const { ReminderId } = req.params;
      const { token, date } = req.query;

      if (token === undefined || !isUUID(ReminderId, 4) || date === undefined) {
        return res.status(400).json({ error: 'Invalid reminder link' });
      }

      const reminder = await Reminder.findByPk(ReminderId);
      const status = reminder?.status as { [keys: string]: boolean | string };
      const statusValue = status ? status[date as string] : undefined;

      if (
        reminder === null ||
        reminder.token !== token ||
        statusValue === undefined
      ) {
        return res.status(400).json({ error: 'Invalid reminder link' });
      }

      const validReminder = typeof statusValue === 'string'
        ? await Reminder.findOne({ where: { ReminderId } }) as Reminder
        : reminder;
      
      const validStatus = validReminder.status;
      const validStatusValue = validStatus[date as string];

      if (validStatusValue === true) {
        return res.status(400).json({ error: 'Already marked this reminder as complete' });
      }

      const [newDate, time] = await ReminderClient.snoozeReminder(
        validReminder,
        date as string,
        RequestDate
      );

      res.status(200).json({
        message: `Your reminder has been snoozed to ${newDate} ${time}`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReminderController;
