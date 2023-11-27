/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type RequestHandler } from 'express';
import passport from 'passport';
import User from '../models/User';

const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    passport.authenticate(
      'jwt',
      { session: false },
      (err: Error, user: User) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({
            error: 'You are not authorized to access this resource',
          });
        } else {
          // @ts-ignore
          req.user = user;
          return next();
        }
      }
    )(req, res, next);
  } catch (error) {
    next(error);
  }
};

const returnUser: RequestHandler = (req, res, next) => {
  try {
    passport.authenticate(
      'jwt',
      { session: false },
      (err: Error, user: User) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(200).json({
            user: null,
          });
        } else {
          // @ts-ignore
          user.token = undefined;
          // @ts-ignore
          user.password = undefined;
          return res.status(200).json({ user });
        }
      }
    )(req, res, next);
  } catch (error) {
    next(error);
  }
};

export { requireAuth, returnUser };
