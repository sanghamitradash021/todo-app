import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthController } from '../controllers/AuthController';

const router = Router();

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', validate(AuthSchema), asyncHandler(AuthController.register));
router.post('/login', validate(AuthSchema), asyncHandler(AuthController.login));

export default router;
