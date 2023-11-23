import { Sequelize } from 'sequelize';
import env from './env';

const sq = new Sequelize(env.DB_NAME, env.DB_USERNAME, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  dialect: 'postgres',
  logging: false
});

const connectToDB = async () => {
  try {
    await sq.authenticate();
    console.log('Connected to DB');
  } catch (error) {
    console.log(`Couldn't connect to DB: ${error}`);
    throw error;
  }
};

export { sq, connectToDB };
