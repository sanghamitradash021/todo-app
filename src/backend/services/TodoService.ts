import { TodoRepository } from '../repositories/TodoRepository';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../config/constants';
import type { TodoResult, TodoFilters, CreateTodoData, UpdateTodoData, TodoRow } from '../types';

function formatTodo(row: TodoRow): TodoResult {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export const TodoService = {
  async listTodos(userId: string, filters: TodoFilters): Promise<TodoResult[]> {
    const rows = await TodoRepository.findAllByUser(userId, filters);
    return rows.map(formatTodo);
  },

  async getTodo(id: string, userId: string): Promise<TodoResult> {
    const row = await TodoRepository.findByIdAndUser(id, userId);
    if (!row) {
      throw new AppError(404, ERROR_CODES.TODO_NOT_FOUND, 'Todo not found');
    }
    return formatTodo(row);
  },

  async createTodo(userId: string, data: CreateTodoData): Promise<TodoResult> {
    const row = await TodoRepository.create(userId, data);
    return formatTodo(row);
  },

  async updateTodo(id: string, userId: string, data: UpdateTodoData): Promise<TodoResult> {
    const row = await TodoRepository.update(id, userId, data);
    if (!row) {
      throw new AppError(404, ERROR_CODES.TODO_NOT_FOUND, 'Todo not found');
    }
    return formatTodo(row);
  },

  async toggleTodo(id: string, userId: string): Promise<TodoResult> {
    const row = await TodoRepository.toggleStatus(id, userId);
    if (!row) {
      throw new AppError(404, ERROR_CODES.TODO_NOT_FOUND, 'Todo not found');
    }
    return formatTodo(row);
  },

  async deleteTodo(id: string, userId: string): Promise<void> {
    const deleted = await TodoRepository.softDelete(id, userId);
    if (!deleted) {
      throw new AppError(404, ERROR_CODES.TODO_NOT_FOUND, 'Todo not found');
    }
  },
};
