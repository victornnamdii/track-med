import { NextFunction, Request, Response } from 'express';
import Reminder from '../models/Reminder';

class ReminderController {
  static async markReminderComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { ReminderId } = req.params;
      const { token } = req.query;

      if (token === undefined) {
        return res.status(401).json({ error: 'Invalid reminder link' });
      }

      const reminder = await Reminder.update(
        {
          status: true
        },
        {
          where: {
            token,
            id: ReminderId
          },
        }
      );

      if (reminder[0] === 0) {
        return res.status(401).json({ error: 'Invalid reminder link' });
      }

      res.status(200).json({ message: 'Thank you for taking your drugs!' });
    } catch (error) {
      next(error);
    }
  }
}

export default ReminderController;
