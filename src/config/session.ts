import RedisStore from 'connect-redis';
import session from 'express-session';
import redisClient from './redis';
import env from './env';

const sessionStore = new RedisStore({
  client: redisClient.client,
  prefix: 'trackmed_sessions:'
});

const sessionConfig = session({
  name: 'trackmed-sid',
  secret: env.SECRET_KEY,
  saveUninitialized: true,
  store: sessionStore,
  resave: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: 1 * 24 * 60 * 60 * 1000,
    secure: false,
  },
  proxy: true,
});

export default sessionConfig;
