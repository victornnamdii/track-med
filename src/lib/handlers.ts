import bcrypt from 'bcrypt';
import { BaseError, UniqueConstraintError, ValidationError } from 'sequelize';
import BodyError from './BodyError';

const hashString = async (string: string): Promise<string> => {
  if (string === undefined) {
    throw new BodyError('Please enter a password');
  }
  if (typeof string !== 'string') {
    throw new BodyError('Password should be a string');
  }
  if (string.length < 6) {
    throw new BodyError('Password should be at least 6 characters');
  }
  const salt = await bcrypt.genSalt();
  const hashedString = await bcrypt.hash(string, salt);
  return hashedString;
};

const sequelizeErrorHandler = (
  error: BaseError
): { status: number; message: string } => {
  if (error instanceof UniqueConstraintError) {
    return { status: 400, message: error.errors[0].message };
  }
  if (error instanceof ValidationError) {
    // @ts-expect-error: 'spelling check'
    if (error.errors[0].type === 'notNull Violation') {
      return {
        status: 400,
        message: `${error.errors[0].path} is required`,
      };
    }
    return { status: 400, message: error.errors[0].message };
  }
  return { status: 500, message: 'Internal Server Error' };
};

export { hashString, sequelizeErrorHandler };
