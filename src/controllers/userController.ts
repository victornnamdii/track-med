/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextFunction, Request, Response } from 'express';
import { SessionData } from 'express-session';
import passport from 'passport';
import bcrypt from 'bcrypt';
import isUUID from 'validator/lib/isUUID';
import User from '../models/User';
import { hashString } from '../lib/handlers';
import redisClient from '../config/redis';
import BodyError from '../lib/BodyError';
import sendEmailQueue from '../lib/queues/sendUserVerificationMail';
import ReminderClient from '../lib/ReminderClient';

class UserController {
  static async addUser(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        notificationType,
      } = req.body;

      const user = await User.create({
        email,
        firstName,
        lastName,
        phoneNumber,
        notificationType,
        password: await hashString(password),
      });

      sendEmailQueue.add({ user });

      res.status(201).json({
        message: 'New user successfully created',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        newPassword,
        currentPassword,
        firstName,
        lastName,
        phoneNumber,
        notificationType,
      } = req.body;

      // @ts-ignore
      const user = await User.findByPk(req.user?.id) as User;

      if (newPassword) {
        if (!currentPassword || typeof currentPassword !== 'string') {
          throw new BodyError('Please enter your current password');
        }

        const auth = await bcrypt.compare(currentPassword, user.password);
        if (!auth) {
          throw new BodyError('Current Password is incorrect');
        }
      }

      await user?.update({
        firstName,
        lastName,
        phoneNumber,
        notificationType,
        password: newPassword ? await hashString(newPassword) : undefined,
      });

      if (notificationType) {
        await ReminderClient.changeNotificationType(user.id, user.notificationType);
      }

      await redisClient.update(`trackmed_user_${user.id}`, JSON.stringify(user));

      res.status(201).json({
        message: 'User successfully updated',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {

      const { UserId } = req.params;
      const { code } = req.body;

      const hashedString = await redisClient.get(`trackmed_verify_${UserId}`);

      if (hashedString !== null && isUUID(UserId, 4)) {
        const correctCode = await bcrypt.compare(code, hashedString);
        if (correctCode) {
          await User.update({ isVerified: true }, { where: { id: UserId } });
          redisClient.del(`trackmed_verify_${UserId}`)
            .catch((err) => console.log(err));
          return res.status(200).json({
            message: 'User successfully verified',
          });
        }
      }

      res.status(400).json({
        message: 'Verification link invalid',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logIn(req: Request, res: Response, next: NextFunction) {
    try {
      passport.authenticate(
        'local',
        (err: Error, user: User, info: { message: string }) => {
          if (err) {
            return next(err);
          }

          if (!user) {
            return res.status(400).json({ error: info.message });
          }

          req.logIn(user, async (err) => {
            if (err) {
              return next(err);
            }

            res
              .status(200)
              .json({ message: 'You have been sucessfully logged in' });
          });
        }
      )(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  static async logOut(req: Request, res: Response, next: NextFunction) {
    try {
      req.logOut((err) => {

        if (err) {
          return next(err);
        }

        res.status(200).json({ message: 'You have been successfully logged out' });
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const id = req.user?.id as string;

      await User.destroy({ where: { id }});
      await redisClient.del(`trackmed_user_${id}`);

      // @ts-expect-error: "Unknown"
      req.sessionStore.all((err, sessions) => {
        if (!err) {
          // @ts-expect-error: "Unknown"
          const userSessions = sessions?.filter((session: SessionData) => {
            // @ts-ignore
            return session.passport?.user?.id === id;
          });

          userSessions?.forEach((session: SessionData) => {
            // @ts-ignore
            session.passport.user = undefined;
            // @ts-ignore
            req.sessionStore.set(session.id, session, (err) => {
              if (err) {
                console.log(err);
              }
            });
          });
        }
      });

      res.status(200).json({ message: 'Your account has been succesfully deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
