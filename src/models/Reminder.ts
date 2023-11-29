import { DataTypes, Model } from 'sequelize';
import shortId from 'shortid';
import { sq } from '../config/db';
import User from './User';
import { Medication, checkTime } from './Medication';
import BodyError from '../lib/BodyError';


class Reminder extends Model {
  declare id: string;
  declare UserId: string;
  declare userNotificationType: 'WHATSAPP' | 'EMAIL' | 'SMS';
  declare MedicationId: string;
  declare drugName: string;
  declare startDate: Date;
  declare time: string;
  declare endDate: Date;
  declare status: { [keys: string]: boolean | string };
  declare message: string;
  declare token: string;
  declare User: User;
  declare Medication: Medication;
  declare snoozed: boolean;
  declare ReminderId: string;
  declare Reminder?: Reminder;
}

Reminder.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    UserId: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false
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
    MedicationId: {
      type: DataTypes.UUID,
      references: {
        model: Medication,
        key: 'id',
      },
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isCorrectHour(value: string) {
          if (!checkTime(value)) {
            throw new BodyError('Value for time should be in the format HH:MM');
          }
        },
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: function generateToken() {
        return shortId.generate();
      }
    },
    drugName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    snoozed: {
      type:DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    ReminderId: {
      type: DataTypes.UUID,
      references: {
        model: Reminder,
        key: 'id',
      },
    },
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
    ],
    hooks: {
      beforeSave(instance) {
        if(instance.snoozed === false && instance.ReminderId) {
          throw new BodyError('Only snoozed reminders should be linked to another reminder');
        }
        if (instance.snoozed === true && !instance.ReminderId) {
          throw new BodyError('Snoozed reminders should be linked to another reminder');
        }
      },
    }
  }
);

Reminder.sync({ alter: true });

export default Reminder;