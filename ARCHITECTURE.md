# Newtonite Operations Platform — Architecture & Technical Defense

This document provides the in-depth architectural breakdown, sequence diagrams, and interview defense rationale for the **Newtonite Operations Management System**.

---

## 1. Domain Model & Entity-Relationship Architecture

```mermaid
erDiagram
    USERS ||--o{ TEAM_MEMBERSHIPS : belongs_to
    TEAMS ||--o{ TEAM_MEMBERSHIPS : contains
    TEAMS ||--o{ WORK_ITEMS : owns
    USERS ||--o{ WORK_ITEMS : reports
    USERS ||--o{ WORK_ITEMS : assigned_to
    WORK_ITEMS ||--o{ COMMENTS : has
    USERS ||--o{ COMMENTS : writes
    WORK_ITEMS ||--o{ ACTIVITIES : audit_trail
    USERS ||--o{ ACTIVITIES : triggers

    USERS {
        uuid id PK
        string email UK
        string name
        string role "ADMIN | TEAM_LEAD | MEMBER"
        timestamp created_at
    }

    TEAMS {
        uuid id PK
        string name UK
        string description
    }

    WORK_ITEMS {
        uuid id PK
        string title
        text description
        string type "CUSTOMER_ISSUE | ENGINEERING | PAYMENT | etc"
        string status "OPEN | IN_PROGRESS | WAITING_FOR_APPROVAL | BLOCKED | RESOLVED | CLOSED"
        string priority "CRITICAL | HIGH | MEDIUM | LOW"
        uuid team_id FK
        uuid assignee_id FK
        uuid created_by FK
        int version "Optimistic Locking Counter"
        text resolution_note
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITIES {
        uuid id PK
        uuid work_item_id FK
        uuid actor_id FK
        string action_type "CREATED | STATUS_CHANGED | ASSIGNED | APPROVED | RESOLVED | REOPENED | UPDATED"
        jsonb old_value
        jsonb new_value
        text metadata
        timestamp created_at
    }

    IDEMPOTENCY_KEYS {
        string key PK
        uuid user_id FK
        string request_hash
        string status "PENDING | COMPLETED"
        int response_status
        jsonb response_body
        timestamp created_at
        timestamp expires_at
    }
```

---

## 2. Finite State Machine (Workflow State Transitions)

The status transitions are enforced by a centralized state machine in `backend/src/work-items/workflow.ts`. No status change can bypass this engine.

```mermaid
stateDiagram-v2
    [*] --> OPEN : Created

    OPEN --> IN_PROGRESS : Start Progress

    IN_PROGRESS --> WAITING_FOR_APPROVAL : Request Sign-off
    IN_PROGRESS --> BLOCKED : Operational Impediment
    IN_PROGRESS --> RESOLVED : Direct Resolution (Resolution Note)

    WAITING_FOR_APPROVAL --> RESOLVED : Approved by Lead/Admin (No self-approval)
    WAITING_FOR_APPROVAL --> IN_PROGRESS : Revisions Requested

    BLOCKED --> IN_PROGRESS : Unblocked / Resumed

    RESOLVED --> CLOSED : Closed by Operator

    CLOSED --> OPEN : Reopened (Reason Required, Lead/Admin only)
```

---

## 3. Concurrency Control: Optimistic Locking Deep Dive

### The Hazard
In high-stress operations (such as payment outage triage), multiple operators frequently open the same incident ticket.
If Operator A changes priority to `CRITICAL` while Operator B simultaneously reassigns the ticket to another team, a naive `UPDATE work_items SET ... WHERE id = :id` will cause whichever write arrives last to silently overwrite the earlier write (the "Lost Update" anomaly).

### The Solution: Versioned Optimistic Updates
Each `work_items` record carries an integer `version` field starting at `1`.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Operator A (Alice)
    actor Bob as Operator B (Bob)
    participant Server as API Server
    participant DB as PostgreSQL

    Alice->>Server: GET /api/work-items/123 (fetches version: 1)
    Bob->>Server: GET /api/work-items/123 (fetches version: 1)

    Note over Alice: Alice changes priority to CRITICAL
    Alice->>Server: PATCH /api/work-items/123 { priority: 'CRITICAL', version: 1 }
    Server->>DB: UPDATE work_items SET priority='CRITICAL', version=2 WHERE id=123 AND version=1
    DB-->>Server: 1 row updated (Success)
    Server-->>Alice: 200 OK (New version: 2)

    Note over Bob: Bob tries to reassign to Sarah
    Bob->>Server: POST /api/work-items/123/assign { assignee_id: 'sarah-id', version: 1 }
    Server->>DB: UPDATE work_items SET assignee_id='sarah-id', version=2 WHERE id=123 AND version=1
    DB-->>Server: 0 rows updated (Version mismatch!)
    Server-->>Bob: 409 Conflict ("Record modified by another user. Reload to view latest state.")
    Note over Bob: UI displays conflict banner with 1-click "Reload Latest" button
```

---

## 4. Idempotency Key Lifecycle

To prevent duplicate incident ticket creation and duplicate status transitions caused by client retries or network hiccups:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant MW as Idempotency Middleware
    participant Service as Business Service
    participant DB as PostgreSQL

    Client->>MW: POST /api/work-items [Header: Idempotency-Key: abc-123]
    MW->>DB: SELECT * FROM idempotency_keys WHERE key='abc-123'
    
    alt Key exists & status is COMPLETED
        DB-->>MW: Cached Response Body & Status (e.g. 201)
        MW-->>Client: Return Cached Response immediately (Zero duplicate DB writes)
    else Key exists & status is PENDING
        MW-->>Client: 409 Conflict ("Request currently in progress")
    else Key does not exist
        MW->>DB: INSERT INTO idempotency_keys (key, status='PENDING', request_hash)
        MW->>Service: Execute business logic & DB transactions
        Service->>DB: Create work item + Activity audit log
        Service-->>MW: Result object
        MW->>DB: UPDATE idempotency_keys SET status='COMPLETED', response_body=...
        MW-->>Client: 201 Created
    end
```

---

## 5. Role-Based Access Control (RBAC) Matrix

| Action | Admin | Team Lead | Team Member |
| :--- | :---: | :---: | :---: |
| **View Work Items** | All Teams | Assigned Teams | Assigned Teams |
| **Create Work Item** | Any Team | Assigned Teams | Assigned Teams |
| **Update Work Item Details** | Yes | Yes | Assigned Items / Team Items |
| **Reassign Assignee** | Yes | Yes (Within Team) | No |
| **Submit for Approval** | Yes | Yes | Yes |
| **Approve Item** | Yes (Not self) | Yes (Not self) | No |
| **Resolve Item** | Yes | Yes | Assigned Items Only |
| **Close Item** | Yes | Yes | Yes |
| **Reopen Closed Item** | Yes | Yes | No |
| **Post Comments** | Yes | Yes | Yes |

---

## 6. Interview Preparation & Technical Defense Q&A

### Q1: Why did you choose Knex with explicit migrations over an ORM like Prisma or TypeORM?
> **Answer**: In operational management systems, deterministic query control and transparent database transactions are critical. Knex provides full visibility over the SQL generated, avoids hidden N+1 query patterns, and makes atomic multi-table transactions (`db.transaction`) crystal clear. Furthermore, explicit TypeScript migrations give full control over PostgreSQL indexes and constraints without ORM schema drift.

### Q2: How does your system guarantee that audit logs are never missing or drifted from the state?
> **Answer**: Audit logs are written in the exact same ACID transaction as the state mutation. In `work-items.service.ts`:
> ```typescript
> return db.transaction(async (trx) => {
>   const updated = await optimisticUpdate(trx, id, version, updates);
>   await recordActivity(trx, id, userId, actionType, oldValue, newValue);
>   return updated;
> });
> ```
> If the activity insert fails, the state change rolls back. If the state change fails, no activity record is created.

### Q3: How do you prevent self-approval from a security and compliance perspective?
> **Answer**: In `approve()` within `work-items.service.ts`:
> 1. Role verification: Rejects `MEMBER` role users.
> 2. Segregation of duties: Compares `item.created_by === user.id`. If true, throws `ForbiddenError("You cannot approve a work item you created")`.
> This complies with standard SOX / SOC2 operational compliance requirements.
