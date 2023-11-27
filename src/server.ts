import express, { Request, Response } from 'express';
import cors from 'cors';
// import cookieParser from 'cookie-parser';
import passport from 'passport';
import { connectToDB } from './config/db';
import env from './config/env';
import { pageNotFound, serverErrorHandler } from './middlewares/errorHandlers';
import userRouter from './routers/userRouter';
// import sessionConfig from './config/session';
import './config/passport';
import startScheduledJobs from './lib/scheduling';
import medicationRouter from './routers/medicationRouter';
import './models/index';
import reminderRouter from './routers/reminderRouter';

const app = express();
const port = env.PORT;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());
// app.use(cookieParser());
// app.use(sessionConfig);
app.use(passport.initialize());
// app.use(passport.session());
app.use(cors({
  origin: [
    'http://localhost:3000',
    env.CLIENT_URL
  ],
  credentials: true,
}));

connectToDB().then(() => {
  app.listen(port, () => {
    console.log('Server up and running');
  });
  startScheduledJobs();
});

app.get('/', (req: Request, res: Response) => {
  res.send(`Welcome to Track Med's API ${req.secure} ${req.protocol}`);
});

app.use('/auth', userRouter);
app.use('/medications', medicationRouter);
app.use('/reminders', reminderRouter);

app.use(pageNotFound);
app.use(serverErrorHandler);
