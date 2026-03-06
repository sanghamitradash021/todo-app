import { Request, Response } from 'express';
import { TodoService } from '../services/TodoService';
import { asyncHandler } from '../utils/asyncHandler';
import type { TodoFilters, CreateTodoData, UpdateTodoData } from '../types';

export const TodoController = {
  list: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = req.query as TodoFilters;
    const todos = await TodoService.listTodos(req.user!.id, filters);
    res.status(200).json({ data: todos, message: 'Todos retrieved successfully' });
  }),

  get: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const todo = await TodoService.getTodo(req.params.id, req.user!.id);
    res.status(200).json({ data: todo, message: 'Todo retrieved successfully' });
  }),

  create: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body as CreateTodoData;
    const todo = await TodoService.createTodo(req.user!.id, data);
    res.status(201).json({ data: todo, message: 'Todo created successfully' });
  }),

  update: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body as UpdateTodoData;
    const todo = await TodoService.updateTodo(req.params.id, req.user!.id, data);
    res.status(200).json({ data: todo, message: 'Todo updated successfully' });
  }),

  toggle: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const todo = await TodoService.toggleTodo(req.params.id, req.user!.id);
    res.status(200).json({ data: todo, message: 'Todo status toggled successfully' });
  }),

  delete: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await TodoService.deleteTodo(req.params.id, req.user!.id);
    res.status(204).end();
  }),
};
