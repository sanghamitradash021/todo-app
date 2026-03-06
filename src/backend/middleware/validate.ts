import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

// target defaults to 'body'; pass 'query' to validate req.query instead (e.g. GET filter params)
export function validate(schema: ZodTypeAny, target: 'body' | 'query' = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(target === 'query' ? req.query : req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
