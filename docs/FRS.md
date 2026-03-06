# FRS.md — Functional Requirements Specification
# Todo Application

---

## 1. Project Overview

A full-stack Todo application that allows authenticated users to create, manage, and organize their tasks. The system supports user registration, login, and full CRUD operations on todos with filtering and status management.

---

## 2. User Stories & Acceptance Criteria

### 2.1 Authentication

#### US-01: User Registration
**As a** new user  
**I want to** register with email and password  
**So that** I can access my personal todo list

**Acceptance Criteria:**
- AC-01.1: User can register with a unique email and password (min 8 chars)
- AC-01.2: Duplicate email returns a clear error message
- AC-01.3: Password is stored hashed (never plaintext)
- AC-01.4: On success, user receives a JWT access token
- AC-01.5: Invalid email format is rejected with a validation error

**Error Scenarios:**
- Email already exists → 409 Conflict `{ error: "EMAIL_ALREADY_EXISTS" }`
- Invalid email format → 422 Unprocessable `{ error: "VALIDATION_ERROR", fields: [...] }`
- Password too short → 422 Unprocessable `{ error: "VALIDATION_ERROR", fields: [...] }`

---

#### US-02: User Login
**As a** registered user  
**I want to** log in with email and password  
**So that** I can access my todos

**Acceptance Criteria:**
- AC-02.1: Valid credentials return a JWT access token
- AC-02.2: Invalid credentials return a generic error (no user enumeration)
- AC-02.3: Token is valid for 24 hours
- AC-02.4: Token must be sent as `Authorization: Bearer <token>` on protected routes

**Error Scenarios:**
- Wrong password or unknown email → 401 Unauthorized `{ error: "INVALID_CREDENTIALS" }`
- Missing credentials → 422 Unprocessable `{ error: "VALIDATION_ERROR", fields: [...] }`

---

#### US-03: User Logout
**As a** logged-in user  
**I want to** log out  
**So that** my session is ended

**Acceptance Criteria:**
- AC-03.1: Logout clears the token from client state
- AC-03.2: After logout, protected routes redirect to login

---

### 2.2 Todo Management

#### US-04: Create Todo
**As a** logged-in user  
**I want to** create a new todo  
**So that** I can track a task

**Acceptance Criteria:**
- AC-04.1: Todo requires a `title` (1–255 chars)
- AC-04.2: Optional `description` (max 1000 chars)
- AC-04.3: Optional `priority` — one of: `low`, `medium`, `high` (default: `medium`)
- AC-04.4: Optional `due_date` — ISO 8601 date string
- AC-04.5: New todo defaults to `status: pending`
- AC-04.6: Todo is owned by the authenticated user
- AC-04.7: Returns created todo with generated `id` and `created_at`

**Error Scenarios:**
- Missing title → 422 `{ error: "VALIDATION_ERROR", fields: ["title"] }`
- Title too long → 422 `{ error: "VALIDATION_ERROR", fields: ["title"] }`
- Invalid priority value → 422 `{ error: "VALIDATION_ERROR", fields: ["priority"] }`
- Invalid due_date format → 422 `{ error: "VALIDATION_ERROR", fields: ["due_date"] }`
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`

---

#### US-05: List Todos
**As a** logged-in user  
**I want to** see all my todos  
**So that** I can manage my tasks

**Acceptance Criteria:**
- AC-05.1: Returns only todos belonging to the authenticated user
- AC-05.2: Supports filter by `status` (pending | completed | all — default: all)
- AC-05.3: Supports filter by `priority` (low | medium | high)
- AC-05.4: Sorted by `created_at` descending by default
- AC-05.5: Returns array (no pagination required for MVP)

**Error Scenarios:**
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`
- Invalid filter value → 422 `{ error: "VALIDATION_ERROR", fields: [...] }`

---

#### US-06: Get Single Todo
**As a** logged-in user  
**I want to** view a specific todo  
**So that** I can see its full details

**Acceptance Criteria:**
- AC-06.1: Returns the todo if it belongs to the authenticated user
- AC-06.2: Returns 404 if todo does not exist or belongs to another user

**Error Scenarios:**
- Not found or wrong owner → 404 `{ error: "TODO_NOT_FOUND" }`
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`

---

#### US-07: Update Todo
**As a** logged-in user  
**I want to** edit a todo  
**So that** I can update task details

**Acceptance Criteria:**
- AC-07.1: Can update `title`, `description`, `priority`, `due_date`
- AC-07.2: Partial updates allowed (PATCH semantics)
- AC-07.3: `updated_at` timestamp is refreshed on every update
- AC-07.4: Cannot update another user's todo

**Error Scenarios:**
- Todo not found or wrong owner → 404 `{ error: "TODO_NOT_FOUND" }`
- Validation failure → 422 `{ error: "VALIDATION_ERROR", fields: [...] }`
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`

---

#### US-08: Toggle Todo Status
**As a** logged-in user  
**I want to** mark a todo as complete or incomplete  
**So that** I can track progress

**Acceptance Criteria:**
- AC-08.1: PATCH `/todos/:id/toggle` toggles `status` between `pending` ↔ `completed`
- AC-08.2: Returns updated todo
- AC-08.3: Cannot toggle another user's todo

**Error Scenarios:**
- Todo not found or wrong owner → 404 `{ error: "TODO_NOT_FOUND" }`
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`

---

#### US-09: Delete Todo
**As a** logged-in user  
**I want to** delete a todo  
**So that** I can remove tasks I no longer need

**Acceptance Criteria:**
- AC-09.1: Soft delete (sets `deleted_at`, not hard delete)
- AC-09.2: Deleted todos do not appear in list results
- AC-09.3: Returns 204 No Content on success
- AC-09.4: Cannot delete another user's todo

**Error Scenarios:**
- Todo not found or wrong owner → 404 `{ error: "TODO_NOT_FOUND" }`
- Unauthenticated → 401 `{ error: "UNAUTHORIZED" }`

---

### 2.3 Frontend UI

#### US-10: Auth Pages
- Registration form with email + password + confirm password
- Login form with email + password
- Client-side validation before API call
- Redirect to `/todos` after successful login/register
- Redirect to `/login` if unauthenticated on protected routes

#### US-11: Todo Dashboard
- List all todos with title, status badge, priority badge, due date
- Filter bar: filter by status + priority
- "Add Todo" button opens a form/modal
- Click todo to expand and see description
- Toggle status with a checkbox
- Delete button with confirmation
- Edit button to update title, description, priority, due_date

#### US-12: Feedback & Loading States
- Loading spinner while API calls are in-flight
- Toast notifications for success/error actions
- Optimistic UI for toggle (instant visual feedback)

---

## 3. Out of Scope (MVP)

- Multi-user collaboration / shared todos
- Todo categories / tags
- File attachments
- Notifications / reminders
- Pagination (array return is sufficient)
- OAuth / social login
- Email verification
- Password reset flow
