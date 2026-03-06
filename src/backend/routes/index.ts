import { Router } from 'express';
import authRouter from './auth';
import { todosRouter } from './todos';

const router = Router();

router.use('/auth', authRouter);
router.use('/todos', todosRouter);

export default router;
