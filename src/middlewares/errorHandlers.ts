import {
  Request,
  Response,
  NextFunction,
  type ErrorRequestHandler
} from 'express';
import { BaseError } from 'sequelize';
import BodyError from '../lib/BodyError';
import { sequelizeErrorHandler } from '../lib/handlers';


const pageNotFound = (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(404).json({
      error: 'Page not found'
    });
  } catch (error) {
    next(error);
  }
};

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const serverErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err !== undefined || err !== null) {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        error: `There is a problem with the syntax of your JSON request body: ${err.message}`
      });
    } else if (err instanceof BodyError) {
      return res.status(400).json({ error: err.message });
    } else if (err instanceof BaseError) {
      const error = sequelizeErrorHandler(err);
      console.log(err);
      return res.status(error.status).json({ error: error.message });
    }
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { pageNotFound, serverErrorHandler };