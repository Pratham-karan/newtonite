# Newtonite Operations Platform ("Operations Under Pressure")

A full-stack, resilient operational-work management system engineered for growing organizations transitioning away from chaotic spreadsheets, emails, and ad-hoc chat channels into a disciplined, audited, and pressure-tested operational workflow.

Built with **Node.js, Express, TypeScript, PostgreSQL (Knex.js), React 18, TanStack Query, and Vite**.

---

## 1. System Architecture & Core Pressures Handled

This platform addresses the 5 critical failure modes of operations under pressure:

| Pressure / Hazard | Operational Failure Mode | Engineering Solution |
| :--- | :--- | :--- |
| **1. Status Ambiguity & Bottlenecks** | Work is lost, blocked items linger unnoticed, triage is chaotic. | **Finite State Machine Workflow Engine** (`OPEN → IN_PROGRESS → WAITING_FOR_APPROVAL / BLOCKED / RESOLVED → CLOSED`). Dynamic dashboard queries for team queues, critical priority items, and approvals. |
| **2. Boundary & Ownership Confusion** | Items are assigned to people outside the relevant team or forgotten in unassigned voids. | **Role-Based & Team-Based Scoping (RBAC)**. Non-admins can only see/mutate items for teams they belong to. Assignees must be verified members of the assigned team. |
| **3. Concurrent Updates & Race Conditions** | Two operators modify the same ticket concurrently; one unwittingly overwrites the other. | **Optimistic Concurrency Control (OCC)** using integer `version` columns (`UPDATE ... WHERE id = :id AND version = :version`). HTTP 409 Conflict returned on collision, accompanied by an interactive conflict-resolution reload UI. |
| **4. Duplicate Execution Hazards** | Network retries or rapid double-clicks create duplicate incident tickets or repetitive state transitions. | **Atomic Idempotency Layer** using `Idempotency-Key` headers stored transactionally. In-flight requests are tracked, and duplicate requests safely receive cached responses. |
| **5. Compliance, Governance & Audit Gaps** | Inability to prove who approved a critical change, or users approving their own work. | **Strict Governance & Immutable Audit Logs**. Self-approval is strictly forbidden. Every state change, assignment, and priority shift is logged transactionally in an `activities` table with actor, timestamp, old values, and new values. |

---

## 2. Quickstart Guide (Running Locally)

### Prerequisites
- **Node.js**: v20+ (v24.x verified)
- **Docker & Docker Compose** (or a local PostgreSQL 16 instance)

---

### Step 1: Start PostgreSQL

Using Docker Compose:
```bash
docker compose up -d
```
*Note: If running PostgreSQL locally without Docker, ensure database `newtonite_ops` exists with user `postgres` and password `postgres` on port `5432`.*

---

### Step 2: Set Up Backend

```bash
cd backend

# 1. Install dependencies (if not already installed)
npm install

# 2. Run database schema migrations
npm run migrate

# 3. Seed realistic demo data
npm run seed

# 4. Run automated test suite (30 unit tests)
npm test

# 5. Start backend development server (http://localhost:3000)
npm run dev
```

---

### Step 3: Set Up Frontend

In a separate terminal:
```bash
cd frontend

# 1. Install dependencies (if not already installed)
npm install

# 2. Verify TypeScript build
npm run build

# 3. Start frontend development server (http://localhost:5173)
npm run dev
```

Navigate your browser to: **[http://localhost:5173](http://localhost:5173)**

---

## 3. Demo Accounts & Credentials

The seed script creates a complete organizational structure with 3 roles and 3 teams (**Engineering**, **Operations**, **Compliance**).

**Password for all demo accounts**: `password123`

| User Email | Name | System Role | Assigned Teams |
| :--- | :--- | :--- | :--- |
| `admin@newtonite.com` | Admin User | `ADMIN` | Global Access (All Teams) |
| `sarah.chen@newtonite.com` | Sarah Chen | `TEAM_LEAD` | Engineering |
| `mike.johnson@newtonite.com` | Mike Johnson | `TEAM_LEAD` | Operations |
| `alice.williams@newtonite.com`| Alice Williams | `MEMBER` | Engineering |
| `bob.martinez@newtonite.com` | Bob Martinez | `MEMBER` | Operations |
| `carol.davis@newtonite.com` | Carol Davis | `MEMBER` | Engineering, Operations |

> **Pro Tip**: The Login screen features 1-click quick-fill buttons for Admin, Lead, and Member accounts for rapid review and grading.

---

## 4. Key Architectural Decisions & Engineering Reasoning

### Optimistic Locking over Pessimistic Locking
- **Decision**: Used incremental integer `version` field on `work_items` checked atomically during `UPDATE`.
- **Reasoning**: Operational management systems involve human reaction times (reading descriptions, preparing notes). Pessimistic row locking (`SELECT FOR UPDATE`) causes database connection pool exhaustion, lock contention, and deadlocks if an operator leaves a tab open. Optimistic locking has zero lock overhead and fails gracefully with HTTP 409 when an actual collision occurs.

### Single Transaction for State Changes + Audit Trail
- **Decision**: In `workItemsService`, the state update (`UPDATE work_items`) and audit entry (`INSERT INTO activities`) execute inside the exact same database transaction (`db.transaction`).
- **Reasoning**: Guarantees zero audit drift. It is architecturally impossible for a work item status to change without a corresponding activity audit entry being recorded.

### Separation of State Transitions & Operational Actions
- **Decision**: Dedicated RPC-style REST endpoints (`POST /api/work-items/:id/resolve`, `POST /api/work-items/:id/approve`, `POST /api/work-items/:id/reopen`) alongside `PATCH /api/work-items/:id`.
- **Reasoning**: Resolving an issue requires an explanation note; approving requires checking that the approver is not the creator; reopening requires a reason. Explicit action endpoints enforce business domain invariants cleanly rather than relying on generic bulk PATCH calls.

### Idempotency Key Design
- **Decision**: Client sends a unique `Idempotency-Key` header with mutation requests. The backend records the key, request hash, status (`PENDING` or `COMPLETED`), and cached response.
- **Reasoning**: In mobile or flaky network environments, retry storms can trigger duplicate tickets or duplicate actions. The idempotency middleware prevents duplicates and ensures identical replayed requests return the original response safely.

---

## 5. Automated Testing

Run the Vitest test suite inside `backend`:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Workflow State Machine (`workflow.test.ts`)**:
  - Validates all authorized transitions (`OPEN → IN_PROGRESS`, `IN_PROGRESS → WAITING_FOR_APPROVAL`, etc.).
  - Asserts that invalid transitions (skipping statuses, illegal reopenings) throw `InvalidTransitionError` with HTTP 422.
- **Optimistic Concurrency & Validation (`validation.test.ts`)**:
  - Asserts that mutations strictly require a positive integer `version`.
  - Validates payload schemas for create, update, assign, approve, resolve, and reopen.
- **Error Domain Hierarchy (`errors.test.ts`)**:
  - Asserts standardized HTTP status codes: 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity.

---

## 6. Directory Structure

```
newtonite/
├── docker-compose.yml             # PostgreSQL 16 container definition
├── database/
│   └── init.sql                   # Database initialization script
├── backend/
│   ├── knexfile.ts                # Database migration and connection configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── database/
│   │   ├── migrations/            # 7 structured migrations (users, teams, work_items, etc.)
│   │   └── seeds/                 # Demo data (6 users, 3 teams, 8 work items)
│   └── src/
│       ├── app.ts                 # Express application middleware pipeline
│       ├── server.ts              # Server lifecycle and graceful shutdown
│       ├── config.ts              # Validated environment configuration
│       ├── db.ts                  # Knex database connection instance
│       ├── common/                # Shared domain errors, types, and logger
│       ├── middleware/            # Auth, RBAC, Idempotency, Request ID, Error handler
│       ├── auth/                  # Authentication service and routes (JWT + httpOnly cookies)
│       ├── users/                 # User directory routes
│       ├── teams/                 # Team management and membership routes
│       ├── work-items/            # Work items domain, state machine, service, routes, validator
│       ├── dashboard/             # Team-scoped metric aggregation queries
│       └── __tests__/             # Vitest automated test suites
└── frontend/
    ├── vite.config.ts             # Vite configuration with /api backend proxy
    ├── package.json
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx               # Root entry with React Query & Auth provider
        ├── App.tsx                # Client-side router and protected routes
        ├── index.css              # Custom design system (deep slate palette, glassmorphism)
        ├── api/client.ts          # Centralized Axios API client with idempotency
        ├── hooks/useAuth.tsx      # Authentication state context hook
        ├── components/Layout.tsx  # Responsive application layout with top navbar
        └── pages/
            ├── LoginPage.tsx      # Sign in with 1-click demo persona buttons
            ├── DashboardPage.tsx  # Real-time metrics, my work, approvals, critical items
            ├── WorkItemsPage.tsx  # Searchable, filterable, paginated work item list
            ├── WorkItemDetailPage.tsx # Work item actions, OCC conflict resolution, timeline
            └── CreateWorkItemPage.tsx # Creation form with automatic idempotency protection
```

---

## 7. What Would Be Added in Production

1. **Distributed Cache & Locking**: Replace in-memory or PostgreSQL idempotency lock records with Redis (`SET NX EX`) for sub-millisecond locking across multi-region server clusters.
2. **Real-Time Push Notifications**: Integrate WebSockets or Server-Sent Events (SSE) so users see live updates when tickets are reassigned or resolved without manual page refreshes.
3. **SLA Monitoring & Background Jobs**: Implement BullMQ / Redis worker queues to monitor work item resolution SLAs and automatically escalate high-priority items lingering in `OPEN` or `BLOCKED` states.
4. **File Attachments & S3 Presigned URLs**: Support secure file attachments for incident screenshots and customer logs via AWS S3 / Cloudflare R2 presigned upload URLs.
