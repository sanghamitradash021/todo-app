import { Router } from 'express';
import authRouter from './auth';

const router = Router();

router.use('/auth', authRouter);
// router.use('/todos', todosRouter);  — added in todos ticket

export default router;
