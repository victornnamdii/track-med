import { type RequestHandler } from 'express';

const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'You are not authorized to access this resource'
    });
  }
  next();
};

const requireNoAuth: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(400).json({
      error: 'You are already logged in'
    });
  }
  next();
};

const returnUser: RequestHandler = (req, res) => {
  const user = req.user ?? null;
  // @ts-expect-error: "Express User"
  delete user?.password;
  return res.status(200).json({ user });
};


export { requireAuth, requireNoAuth, returnUser };