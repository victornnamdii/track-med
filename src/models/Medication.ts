import { DataTypes, Model } from 'sequelize';
import isDate from 'validator/lib/isDate';
import isTime from 'validator/lib/isTime';
import { sq } from '../config/db';
import BodyError from '../lib/BodyError';
import User from './User';
import { sortTimes } from '../lib/handlers';
import Reminder from './Reminder';

type drugInfo = {
  drugName: string;
  dose: string;
  frequency: string;
  startDate: string;
  times: string[] | 'default' | 'custom';
  endDate: string;
  customTimes?: string[];
}[];

const checkDate = (string: string) => {
  return isDate(string, {
    format: 'YYYY-MM-DD',
    strictMode: true,
    delimiters: ['-'],
  });
};

const checkTime = (string: string) => {
  return isTime(string, {
    hourFormat: 'hour24',
    mode: 'default'
  });
};

const standardizedDosage = {
  '1': ['08:00'],
  '2': ['08:00', '20:00'],
  '3': ['08:00', '13:00', '20:00'],
  '4': ['08:00', '12:00', '16:00', '20:00'],
  '5': ['04:00', '08:00', '12:00', '16:00', '20:00'],
  '3h': ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
  '4h': ['01:00', '05:00', '09:00', '13:00', '17:00', '21:00'],
  '6h': ['05:00', '11:00', '17:00', '23:00'],
  '8h': ['07:00', '15:00', '23:00'],
  '12h': ['08:00', '20:00'],
  Bedtime: ['20:00'],
  Other: ['20:00']
};

class Medication extends Model {
  declare id: string;
  declare UserId: string;
  declare name: string;
  declare drugInfo: drugInfo | string;
  declare Reminders: Reminder[];
  declare User: User;
}

Medication.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    UserId: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
    },
    drugInfo: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isCorrectSchema(drugInfo: drugInfo) {
          if (!Array.isArray(drugInfo)) {
            throw new BodyError('Drug information should be a list');
          }

          drugInfo.forEach((drug) => {
            if (!drug.drugName || typeof drug.drugName !== 'string') {
              throw new BodyError('Drug name is required');
            }
            if (
              (drug.times === 'custom' && Object.keys(drug).length > 7) ||
              (drug.times === 'default' && Object.keys(drug).length > 6)
            ) {
              throw new BodyError(`Excess drug information for ${drug.drugName}`);
            }
            if (!drug.dose || typeof drug.dose !== 'string') {
              throw new BodyError(`Dosage is required for ${drug.drugName}`);
            }
            if (!drug.frequency || typeof drug.frequency !== 'string') {
              throw new BodyError(
                `Dosage frequency is required for ${drug.drugName}`
              );
            }
            if (!Object.keys(standardizedDosage).includes(drug.frequency)) {
              throw new BodyError(
                `Please select a valid frequency for ${drug.drugName}`
              );
            }
            if (!drug.startDate) {
              throw new BodyError(
                `Start date for ${drug.drugName} is required`
              );
            }
            if (!checkDate(drug.startDate)) {
              throw new BodyError(
                `Start date for ${drug.drugName} should be specified in the format YYYY-MM-DD`
              );
            }
            if (!drug.endDate) {
              throw new BodyError(`End date for ${drug.drugName} is required`);
            }
            if (!checkDate(drug.endDate)) {
              throw new BodyError(
                `End date for ${drug.drugName} should be specified in the format YYYY-MM-DD`
              );
            }
            if (new Date(drug.endDate) < new Date(drug.startDate)) {
              throw new BodyError(
                `End date for ${drug.drugName} should be after Start Date`
              );
            }
            if (!drug.times || typeof drug.times !== 'string') {
              throw new BodyError(`Dose times for ${drug.drugName} is required`);
            }
            if (drug.times !== 'custom' && drug.times !== 'default') {
              throw new BodyError(
                `Dose times for ${drug.drugName} should be either default or custom`
              );
            }
            if (drug.times === 'custom') {
              if (!drug.customTimes) {
                throw new BodyError(
                  `Custom times for ${drug.drugName} was not selected`
                );
              }
              if (!Array.isArray(drug.customTimes)) {
                throw new BodyError(
                  `Invalid format for ${drug.drugName} custom hours`
                );
              }
              let wrongValue = false;

              drug.customTimes.forEach((value) => {
                if (!checkTime(value)) {
                  wrongValue = true;
                }
              });
              if (wrongValue) {
                throw new BodyError(
                  `Values for ${drug.drugName}'s custom times should be in the format HH:MM`
                );
              }
            }

            const drugNames = drugInfo.filter((drugInside) => {
              return drugInside
                .drugName
                .toLowerCase()
                .trim() === drug.drugName.toLowerCase().trim();
            });

            if (drugNames.length > 1) {
              throw new BodyError(
                `${drug.drugName[0]
                  .toUpperCase()}${drug.drugName
                  .slice(1)} is repeated in your drug information.`
              );
            }
          });
        },
      },
    },
  },
  {
    sequelize: sq,
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'name'],
        name: 'User Medication',
      },
      {
        fields: ['UserId'],
        using: 'BTREE',
      },
    ],
    hooks: {
      afterValidate(instance) {
        if (instance.name) {
          instance.name = `${instance.name[0].toUpperCase()}${instance.name
            .slice(1)
            .toLowerCase()}`;
        }

        if (instance.drugInfo) {
          const drugInfo = instance.drugInfo as drugInfo;
          drugInfo.forEach((drug) => {
            if (drug.times === 'default') {
              drug.times =
                standardizedDosage[
                  drug.frequency as keyof typeof standardizedDosage
                ];
            } else if (drug.times === 'custom') {
              const sortedTimes = sortTimes(drug.customTimes as string[]);
              const uniqueTimes = new Set(sortedTimes);
              drug.times = Array.from(uniqueTimes);
            }

            if (drug.drugName) {
              const words = drug.drugName.trim().split(' ');
              let name = '';
              
              words.forEach((word) => {
                if (name.length > 0) {
                  name += ' ';
                }
                name += `${word[0]
                  .toUpperCase()}${word
                  .slice(1)}`;
              });

              drug.drugName = name;
            }

            delete drug.customTimes;
          });

          instance.drugInfo = drugInfo;
        }
      },
    },
  }
);

Medication.sync({ alter: true });

export { Medication, drugInfo, checkTime };
