import { NextFunction, Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID';
import Reminder from '../models/Reminder';

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
      const status = reminder?.status as { [keys: string]: boolean };
      const statusValue = status ? status[date as string] : undefined;

      if (
        reminder === null ||
        reminder.token !== token ||
        statusValue === undefined
      ) {
        return res.status(400).json({ error: 'Invalid reminder link' });
      }

      if (statusValue === false) {
        status[date as string] = true;

        await Reminder.update(
          { status },
          {
            where: { id: ReminderId }
          }
        );
      }

      res.status(200).json({ message: 'Thank you for taking your drugs!' });
    } catch (error) {
      next(error);
    }
  }
}

export default ReminderController;
