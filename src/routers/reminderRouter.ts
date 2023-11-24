import { Router } from 'express';
import ReminderController from '../controllers/reminderController';

const reminderRouter = Router();

reminderRouter.get('/complete/:ReminderId', ReminderController.markReminderComplete);

export default reminderRouter;