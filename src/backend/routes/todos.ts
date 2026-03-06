import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { TodoController } from '../controllers/TodoController';
import { TODO_STATUS, TODO_PRIORITY } from '../config/constants';

const router = Router();

const ListSchema = z.object({
  status: z.enum([TODO_STATUS.PENDING, TODO_STATUS.COMPLETED, 'all']).optional(),
  priority: z.enum([TODO_PRIORITY.LOW, TODO_PRIORITY.MEDIUM, TODO_PRIORITY.HIGH]).optional(),
});

const CreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer'),
  description: z.string().max(1000).optional().nullable(),
  priority: z.enum([TODO_PRIORITY.LOW, TODO_PRIORITY.MEDIUM, TODO_PRIORITY.HIGH]).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});

const UpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be 255 characters or fewer')
      .optional(),
    description: z.string().max(1000).nullable().optional(),
    priority: z.enum([TODO_PRIORITY.LOW, TODO_PRIORITY.MEDIUM, TODO_PRIORITY.HIGH]).optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be in YYYY-MM-DD format')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

router.use(authenticate);

router.get('/', validate(ListSchema, 'query'), TodoController.list);
router.post('/', validate(CreateSchema), TodoController.create);
router.get('/:id', TodoController.get);
// PATCH /:id/toggle must be before PATCH /:id to prevent 'toggle' matching as :id
router.patch('/:id/toggle', TodoController.toggle);
router.patch('/:id', validate(UpdateSchema), TodoController.update);
router.delete('/:id', TodoController.delete);

export { router as todosRouter };
