import { NextFunction, Request, Response } from 'express';
import Medication from '../models/Medication';

class MedicationController {
  static async addMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, drugInfo } = req.body;

      const medication = await Medication.create({
        userId: req.user?.id,
        name,
        drugInfo: JSON.stringify(drugInfo)
      });

      res.status(201).json({
        message: 'New medication successfully created',
        medication,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MedicationController;
