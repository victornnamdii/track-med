import { DataTypes, Model } from 'sequelize';
import { sq } from '../config/db';
import User from './User';
import { Medication } from './Medication';


class Reminder extends Model {
  declare id: string;
  declare userId: string;
  declare userNotificationType: 'WHATSAPP' | 'EMAIL' | 'SMS';
  declare medicationId: string;
  declare startDate: Date;
  declare times: string[];
  declare endDate: Date;
  declare status: boolean;
}

Reminder.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
    },
    userNotificationType: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          msg: 'Mode of notification should be one of Whatsapp, Email or SMS',
          args: [['WHATSAPP', 'EMAIL', 'SMS']],
        },
      },
    },
    medicationId: {
      type: DataTypes.UUID,
      references: {
        model: Medication,
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    times: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Reminder Times is required',
        },
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize: sq,
    indexes: [
      {
        fields: ['startDate']
      },
      {
        fields: ['endDate']
      }
    ]
  }
);

Reminder.sync({ alter: true });

export default Reminder;