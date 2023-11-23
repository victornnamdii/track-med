import { NextFunction, Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID';
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

  static async getAllMedications(req: Request, res: Response, next: NextFunction) {
    try {

      const medications = await Medication.findAll({
        where: { 
          userId: req.user?.id
        } 
      });

      res.status(200).json({ medications });
    } catch (error) {
      next(error);
    }
  }

  static async getAMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { medicationId } = req.params;

      if (!isUUID(medicationId, 4)) {
        return res.status(400).json({ error: 'Invalid Medication ID' });
      }

      const medication = await Medication.findOne({
        where: { 
          userId: req.user?.id,
          id: medicationId
        } 
      });

      if (medication === null) {
        return res.status(400).json({ error: 'Medication not found' });
      }

      res.status(200).json({ medication });
    } catch (error) {
      next(error);
    }
  }
}

export default MedicationController;
