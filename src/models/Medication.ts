import { DataTypes, Model } from 'sequelize';
import { sq } from '../config/db';
import BodyError from '../lib/BodyError';
import User from './User';

type drugInfo = {
  drugName: string;
  dose: string;
  frequency: number;
  totalQty: number;
}[];

class Medication extends Model {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare drugInfo: drugInfo;
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
            if (!drug.frequency || typeof drug.frequency !== 'number') {
              throw new BodyError(
                `Dosage frequency is required for ${drug.drugName}`
              );
            }
            if (!drug.totalQty || typeof drug.totalQty !== 'number') {
              throw new BodyError(
                `Total quantity of ${drug.drugName} prescribed is required`
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
    ],
    hooks: {
      afterValidate(instance) {
        instance.name = `${instance.name[0].toUpperCase()}${instance.name
          .slice(1)
          .toLowerCase()}`;
      },
    },
  }
);

Medication.sync({ alter: true });

export default Medication;
