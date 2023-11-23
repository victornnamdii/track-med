import { Router } from 'express';
import MedicationController from '../controllers/medicationController';
import { requireAuth } from '../middlewares/authMiddlewares';

const medicationRouter = Router();

medicationRouter.post('/', requireAuth, MedicationController.addMedication);

export default medicationRouter;