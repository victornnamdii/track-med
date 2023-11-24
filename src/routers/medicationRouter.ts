import { Router } from 'express';
import MedicationController from '../controllers/medicationController';
import { requireAuth } from '../middlewares/authMiddlewares';

const medicationRouter = Router();

medicationRouter.post('/', requireAuth, MedicationController.addMedication);
medicationRouter.get('/', requireAuth, MedicationController.getAllMedications);
medicationRouter.get('/:MedicationId', requireAuth, MedicationController.getAMedication);
medicationRouter.patch('/:MedicationId', requireAuth, MedicationController.updateMedication);
medicationRouter.delete('/:MedicationId', requireAuth, MedicationController.deleteMedication);

export default medicationRouter;