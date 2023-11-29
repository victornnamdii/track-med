/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import User from '../models/User';
import redisClient from './redis';
import env from './env';

const customFields = {
  usernameField: 'email',
  passwordField: 'password',
};

passport.use(new LocalStrategy(customFields, async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (user) {
      const auth = await bcrypt.compare(password, user.password);
      if (auth &&  user.isVerified) {
        return done(null, user);
      }
      if (auth && !user.isVerified) {
        return done(null, false, { message: 'Please verify your account' });
      }
    }
    return done(null, false, { message: 'Incorrect email/password' });
  } catch (error) {
    done(error);
  }
}));

passport.use(new Strategy({
  secretOrKey: env.SECRET_KEY,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: true
}, async (
  req: Request,
  token: { user: { id: string} },
  done: VerifiedCallback
) => {
  try {
    const Authorization = req.headers['authorization'];
    const tokenSring = Authorization?.slice(7);

    const user = await redisClient.get(
      `trackmed_user_${token.user?.id}_${tokenSring}`
    );
    if (user) {
      return done(null, JSON.parse(user));
    }
    return done(null, false);
  } catch (error) {
    done(error);
  }
}));
