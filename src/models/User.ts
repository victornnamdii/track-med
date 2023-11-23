import { DataTypes, Model } from 'sequelize';
import isMobilePhone from 'validator/lib/isMobilePhone';
import { sq } from '../config/db';
import BodyError from '../lib/BodyError';

class User extends Model {
  declare id: string;
  declare email: string;
  declare password: string;
  declare firstName: string;
  declare lastName: string;
  declare phoneNumber: string;
  declare notificationType: 'WHATSAPP' | 'EMAIL' | 'SMS';
  declare isVerified: boolean;
}

User.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'User Email',
      msg: 'Email already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Your Email is Required'
      },
      isEmail: {
        msg: 'Please enter a valid Email'
      },
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Your First Name is Required'
      },
      isAlpha: {
        msg: 'First Name should contain only letters'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Your Last Name is Required'
      },
      isAlpha: {
        msg: 'Last Name should contain only letters'
      }
    }
  },
  notificationType: {
    type: DataTypes.STRING,
    defaultValue: 'EMAIL',
    validate: {
      isIn: {
        msg: 'Mode of notification should be one of Whatsapp, Email or SMS',
        args: [['WHATSAPP', 'EMAIL', 'SMS']]
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'Phone Number',
      msg: 'Phone number already exists'
    },
    validate: {
      isPhoneNumber(value: string) {
        if (!isMobilePhone(value, 'any', { strictMode: true })) {
          throw new BodyError(
            'Please enter a valid phone number starting with \'+\' and a country code'
          );
        }
      }
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { sequelize: sq });

User.sync({ alter: true });

export default User;
