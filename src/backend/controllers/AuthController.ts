import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

interface AuthBody {
  email: string;
  password: string;
}

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as AuthBody;
    const result = await AuthService.register(email, password);
    res.status(201).json({ data: result, message: 'Account created successfully' });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as AuthBody;
    const result = await AuthService.login(email, password);
    res.status(200).json({ data: result, message: 'Login successful' });
  },
};
