import dotenv from 'dotenv';

dotenv.config();

const env = {
  PORT: process.env.PORT as string,
  DB_HOST: process.env.DB_HOST as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_NAME: process.env.DB as string,
  DB_USERNAME: process.env.DB_USERNAME as string,
  DB_PORT: process.env.DB_PORT as string,
  SECRET_KEY: process.env.SECRET_KEY as string,
  NODE_ENV: process.env.NODE_ENV as 'dev' | 'prod',
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS as string,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD as string,
  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
  REDIS_PORT: process.env.REDIS_PORT as string,
  HOST: process.env.HOST as string
};

export default env;
