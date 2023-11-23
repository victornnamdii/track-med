import { Router } from 'express';
import MedicationController from '../controllers/medicationController';
import { requireAuth } from '../middlewares/authMiddlewares';

const medicationRouter = Router();

medicationRouter.post('/', requireAuth, MedicationController.addMedication);
medicationRouter.get('/', requireAuth, MedicationController.getAllMedications);
medicationRouter.get('/:medicationId', requireAuth, MedicationController.getAMedication);
medicationRouter.patch('/:medicationId', requireAuth, MedicationController.updateMedication);
medicationRouter.delete('/:medicationId', requireAuth, MedicationController.deleteMedication);

export default medicationRouter;