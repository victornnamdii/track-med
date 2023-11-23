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

      const { userId, uniqueString } = req.params;

      const hashedString = await redisClient.get(`trackmed_verify_${userId}`);

      if (hashedString !== null && isUUID(userId, 4)) {
        const correctUrl = await bcrypt.compare(uniqueString, hashedString);
        if (correctUrl) {
          await User.update({ isVerified: true }, { where: { id: userId } });
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
      const id = req.user?.id as string;

      await User.destroy({ where: { id }});
      await redisClient.del(`trackmed_user_${id}`);

      // @ts-expect-error: "Unknown"
      req.sessionStore.all((err, sessions) => {
        if (!err) {
          // @ts-expect-error: "Unknown"
          const userSessions = sessions?.filter((session: SessionData) => {
            return session.passport?.user?.id === id;
          });

          userSessions?.forEach((session: SessionData) => {
            session.passport.user = undefined;
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
