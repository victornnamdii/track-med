import { Router } from 'express';
import ReminderController from '../controllers/reminderController';

const reminderRouter = Router();

reminderRouter.get('/:ReminderId/complete', ReminderController.markReminderComplete);
reminderRouter.get('/:ReminderId/snooze', ReminderController.snoozeReminder);

export default reminderRouter;