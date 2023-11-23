import { DataTypes, Model } from 'sequelize';
import isDate from 'validator/lib/isDate';
import { sq } from '../config/db';
import BodyError from '../lib/BodyError';
import User from './User';

type drugInfo = {
  drugName: string;
  dose: string;
  frequency: string;
  startDate: string;
  hours: number[];
}[];

const checkDate = (string: string) => {
  return isDate(string, {
    format: 'YYYY-MM-DD',
    strictMode: true,
    delimiters: ['-'],
  });
};

const standardizedDosage = {
  '1': [8],
  '2': [8, 20],
  '3': [8, 13, 20],
  '4': [8, 12, 16, 20],
  '5': [4, 8, 12, 16, 20],
  '3h': [0, 3, 6, 9, 12, 15, 18, 21],
  '4h': [1, 5, 9, 13, 17, 21],
  '6h': [5, 11, 17, 23],
  '8h': [7, 15, 23],
  '12h': [8, 20],
  'Bedtime': [20]
};

class Medication extends Model {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare drugInfo: drugInfo | string;
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
    userId: {
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
        isCorrectSchema(value: string) {
          const drugInfo = JSON.parse(value) as drugInfo;
          if (!Array.isArray(drugInfo)) {
            throw new BodyError('Drug information should be a list');
          }

          drugInfo.forEach((drug) => {
            if (Object.keys(drug).length > 4) {
              throw new BodyError('Excess drug information');
            }
            if (!drug.drugName || typeof drug.drugName !== 'string') {
              throw new BodyError('Drug name is required');
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
                `Start date for ${drug
                  .drugName} should be specified in the format YYYY-MM-DD`
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
        fields: ['userId', 'name'],
        name: 'User Medication',
      },
      {
        fields: ['userId'],
        using: 'BTREE'
      }
    ],
    hooks: {
      afterValidate(instance) {
        instance.name = `${instance.name[0].toUpperCase()}${instance.name
          .slice(1)
          .toLowerCase()}`;
        
        const drugInfo = JSON.parse(instance.drugInfo as string) as drugInfo;
        drugInfo.forEach((info) => {
          info.hours = standardizedDosage[info.frequency as keyof typeof standardizedDosage];
        });

        instance.drugInfo = JSON.stringify(drugInfo);
      },
    },
  }
);

Medication.sync({ alter: true });

export { Medication, drugInfo };
