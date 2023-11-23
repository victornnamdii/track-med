import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { connectToDB } from './config/db';
import env from './config/env';
import { pageNotFound, serverErrorHandler } from './middlewares/errorHandlers';
import userRouter from './routers/userRouter';
import sessionConfig from './config/session';

const app = express();
const port = env.PORT;

app.disable('x-powered-by');
app.use(express.json());
app.use(cookieParser());
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());
import './config/passport';
import startScheduledJobs from './lib/scheduling';

connectToDB().then(() => {
  app.listen(port, () => {
    console.log('Server up and running');
  });
  startScheduledJobs();
});

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Track Med\'s API');
});

app.use('/auth', userRouter);

app.use(pageNotFound);
app.use(serverErrorHandler);
