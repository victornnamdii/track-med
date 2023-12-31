import { Router } from 'express';
import UserController from '../controllers/userController';
import { requireAuth, returnUser } from '../middlewares/authMiddlewares';

const userRouter = Router();

userRouter.post('/signup', UserController.addUser);
userRouter.post('/login', UserController.logIn);
userRouter.get('/logout', requireAuth, UserController.logOut);
userRouter.get('/user', returnUser);
userRouter.delete('/user', requireAuth, UserController.deleteUser);
userRouter.patch('/user', requireAuth, UserController.updateUser);
userRouter.post('/verify/:UserId', UserController.verifyUser);

export default userRouter;