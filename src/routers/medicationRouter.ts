import { Router } from 'express';
import MedicationController from '../controllers/medicationController';
import { requireAuth } from '../middlewares/authMiddlewares';

const medicationRouter = Router();

medicationRouter.post('/', requireAuth, MedicationController.addMedication);
medicationRouter.get('/', requireAuth, MedicationController.getAllMedications);
medicationRouter.get('/:medicationId', requireAuth, MedicationController.getAMedication);

export default medicationRouter;