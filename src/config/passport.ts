import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy } from 'passport-local';
import User from '../models/User';
import redisClient from './redis';

const customFields = {
  usernameField: 'email',
  passwordField: 'password',
};

passport.use(new Strategy(customFields, async (email, password, done) => {
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

passport.serializeUser(async (user, done) => {
  try {
    await redisClient.set(
      `trackmed_user_${user.id}`,
      JSON.stringify(user),
      1 * 24 * 60 * 60
    );
  } catch (error) {
    return done(error);
  }
  done(null, { id: user.id });
});

passport.deserializeUser(async ({ id }, done) => {
  try {
    const key = `trackmed_user_${id}`;
    const cachedUser = await redisClient.get(key);
    if (cachedUser) {
      redisClient.updateUserCacheTime(key, cachedUser);
      return done(null, JSON.parse(cachedUser));
    }
    done(null, null);
  } catch (error) {
    console.log(error);
    done(null, null);
  }
});
