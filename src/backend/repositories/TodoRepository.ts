import { pool } from '../config/db';
import { TodoRow, TodoFilters, CreateTodoData, UpdateTodoData } from '../types';

const ALL_COLUMNS =
  'id, user_id, title, description, status, priority, due_date, created_at, updated_at, deleted_at';

export const TodoRepository = {
  async findAllByUser(userId: string, filters: TodoFilters): Promise<TodoRow[]> {
    const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [userId];
    let idx = 2;

    if (filters.status && filters.status !== 'all') {
      conditions.push(`status = $${idx}`);
      params.push(filters.status);
      idx++;
    }

    if (filters.priority) {
      conditions.push(`priority = $${idx}`);
      params.push(filters.priority);
      idx++;
    }

    // idx referenced to satisfy noUnusedLocals — it tracks the next param slot
    void idx;

    const sql = `SELECT ${ALL_COLUMNS} FROM todos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
    const result = await pool.query<TodoRow>(sql, params);
    return result.rows;
  },

  async findByIdAndUser(id: string, userId: string): Promise<TodoRow | null> {
    const result = await pool.query<TodoRow>(
      `SELECT ${ALL_COLUMNS} FROM todos WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async create(userId: string, data: CreateTodoData): Promise<TodoRow> {
    const result = await pool.query<TodoRow>(
      `INSERT INTO todos (user_id, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${ALL_COLUMNS}`,
      [
        userId,
        data.title,
        data.description ?? null,
        data.priority ?? 'medium',
        data.due_date ?? null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, userId: string, data: UpdateTodoData): Promise<TodoRow | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.title !== undefined) {
      setClauses.push(`title = $${idx++}`);
      params.push(data.title);
    }

    if ('description' in data) {
      setClauses.push(`description = $${idx++}`);
      params.push(data.description ?? null);
    }

    if (data.priority !== undefined) {
      setClauses.push(`priority = $${idx++}`);
      params.push(data.priority);
    }

    if ('due_date' in data) {
      setClauses.push(`due_date = $${idx++}`);
      params.push(data.due_date ?? null);
    }

    setClauses.push('updated_at = NOW()');
    params.push(id, userId);

    const sql = `
      UPDATE todos
      SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1} AND deleted_at IS NULL
      RETURNING ${ALL_COLUMNS}
    `;
    const result = await pool.query<TodoRow>(sql, params);
    return result.rows[0] ?? null;
  },

  async toggleStatus(id: string, userId: string): Promise<TodoRow | null> {
    const result = await pool.query<TodoRow>(
      `UPDATE todos
       SET status = CASE WHEN status = 'pending' THEN 'completed' ELSE 'pending' END,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING ${ALL_COLUMNS}`,
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE todos
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
