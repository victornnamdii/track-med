import { Router } from 'express';
import UserController from '../controllers/userController';
import { requireAuth, requireNoAuth, returnUser } from '../middlewares/authMiddlewares';

const userRouter = Router();

userRouter.post('/signup', requireNoAuth, UserController.addUser);
userRouter.post('/login', requireNoAuth, UserController.logIn);
userRouter.get('/logout', requireAuth, UserController.logOut);
userRouter.get('/user', returnUser);
userRouter.delete('/user', requireAuth, UserController.deleteUser);
userRouter.patch('/user', requireAuth, UserController.updateUser);
userRouter.get('/verify/:userId/:uniqueString', UserController.verifyUser);

export default userRouter;