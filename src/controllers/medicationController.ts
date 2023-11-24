import { NextFunction, Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID';
import { Medication } from '../models/Medication';
import ReminderClient from '../lib/ReminderClient';

class MedicationController {
  static async addMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, drugInfo } = req.body;

      const medication = await Medication.create({
        UserId: req.user?.id,
        name,
        drugInfo
      });

      await ReminderClient.createReminders(medication);

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
          UserId: req.user?.id
        } 
      });

      res.status(200).json({ medications });
    } catch (error) {
      next(error);
    }
  }

  static async getAMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { MedicationId } = req.params;

      if (!isUUID(MedicationId, 4)) {
        return res.status(400).json({ error: 'Invalid Medication ID' });
      }

      const medication = await Medication.findOne({
        where: { 
          UserId: req.user?.id,
          id: MedicationId
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

  static async updateMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, drugInfo } = req.body;
      const { MedicationId } = req.params;

      if (!isUUID(MedicationId, 4)) {
        return res.status(400).json({ error: 'Invalid Medication ID' });
      }

      if(!name && !drugInfo) {
        return res.status(400).json({ error: 'No field specified to be updated' });
      }

      const medication = await Medication.update(
        {
          name,
          drugInfo
        },
        {
          where: {
            UserId: req.user?.id,
            id: MedicationId
          },
          returning: true
        }
      );

      if (drugInfo) {
        await ReminderClient.updateReminders(medication[1][0]);
      }

      if (medication[0] === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      res.status(201).json({
        message: 'New medication successfully updated',
        medication: medication[1][0],
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedication(req: Request, res: Response, next: NextFunction) {
    try {
      const { MedicationId } = req.params;

      if (!isUUID(MedicationId, 4)) {
        return res.status(400).json({ error: 'Invalid Medication ID' });
      }

      const medication = await Medication.destroy({
        where: {
          id: MedicationId,
          UserId: req.user?.id
        }
      });

      if (medication === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      res.status(200).json({ message: 'Medication successfully deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default MedicationController;
