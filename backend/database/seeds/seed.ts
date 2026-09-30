import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed data — creates realistic demo scenarios:
 *
 * Users:
 *   - admin@newtonite.com (Admin)
 *   - sarah.chen@newtonite.com (Team Lead — Engineering)
 *   - mike.johnson@newtonite.com (Team Lead — Operations)
 *   - alice.williams@newtonite.com (Member — Engineering)
 *   - bob.martinez@newtonite.com (Member — Operations)
 *   - carol.davis@newtonite.com (Member — Engineering + Operations)
 *
 * Teams:
 *   - Engineering
 *   - Operations
 *   - Compliance
 *
 * Work Items: 8 items across types/statuses/priorities with comments & history.
 *
 * All passwords are: "password123"
 */
export async function seed(knex: Knex): Promise<void> {
  // Clean existing data (in dependency order)
  await knex('activities').del();
  await knex('comments').del();
  await knex('idempotency_keys').del();
  await knex('work_items').del();
  await knex('team_memberships').del();
  await knex('teams').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Users ---
  const adminId = uuidv4();
  const sarahId = uuidv4();
  const mikeId = uuidv4();
  const aliceId = uuidv4();
  const bobId = uuidv4();
  const carolId = uuidv4();

  await knex('users').insert([
    { id: adminId, email: 'admin@newtonite.com', password_hash: passwordHash, name: 'Admin User', role: 'ADMIN' },
    { id: sarahId, email: 'sarah.chen@newtonite.com', password_hash: passwordHash, name: 'Sarah Chen', role: 'TEAM_LEAD' },
    { id: mikeId, email: 'mike.johnson@newtonite.com', password_hash: passwordHash, name: 'Mike Johnson', role: 'TEAM_LEAD' },
    { id: aliceId, email: 'alice.williams@newtonite.com', password_hash: passwordHash, name: 'Alice Williams', role: 'MEMBER' },
    { id: bobId, email: 'bob.martinez@newtonite.com', password_hash: passwordHash, name: 'Bob Martinez', role: 'MEMBER' },
    { id: carolId, email: 'carol.davis@newtonite.com', password_hash: passwordHash, name: 'Carol Davis', role: 'MEMBER' },
  ]);

  // --- Teams ---
  const engineeringId = uuidv4();
  const operationsId = uuidv4();
  const complianceId = uuidv4();

  await knex('teams').insert([
    { id: engineeringId, name: 'Engineering', description: 'Software engineering and platform team' },
    { id: operationsId, name: 'Operations', description: 'Operations, payments, and customer support' },
    { id: complianceId, name: 'Compliance', description: 'Regulatory compliance and audit' },
  ]);

  // --- Team Memberships ---
  await knex('team_memberships').insert([
    // Sarah (Team Lead) + Alice + Carol → Engineering
    { id: uuidv4(), user_id: sarahId, team_id: engineeringId },
    { id: uuidv4(), user_id: aliceId, team_id: engineeringId },
    { id: uuidv4(), user_id: carolId, team_id: engineeringId },
    // Mike (Team Lead) + Bob + Carol → Operations
    { id: uuidv4(), user_id: mikeId, team_id: operationsId },
    { id: uuidv4(), user_id: bobId, team_id: operationsId },
    { id: uuidv4(), user_id: carolId, team_id: operationsId },
    // Mike → Compliance (he leads both)
    { id: uuidv4(), user_id: mikeId, team_id: complianceId },
  ]);

  // --- Work Items ---
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const wi1 = uuidv4(); // Production outage - CRITICAL
  const wi2 = uuidv4(); // Payment investigation - HIGH
  const wi3 = uuidv4(); // Customer issue - MEDIUM
  const wi4 = uuidv4(); // Compliance approval - HIGH
  const wi5 = uuidv4(); // Routine task - LOW
  const wi6 = uuidv4(); // Engineering bug - MEDIUM
  const wi7 = uuidv4(); // Blocked item
  const wi8 = uuidv4(); // Resolved item

  await knex('work_items').insert([
    {
      id: wi1, title: 'Production database connection pool exhaustion',
      description: 'Production PostgreSQL connection pool is being exhausted during peak hours. Users are experiencing 500 errors. Immediate investigation and fix required.',
      type: 'PRODUCTION_INCIDENT', status: 'IN_PROGRESS', priority: 'CRITICAL',
      team_id: engineeringId, assignee_id: aliceId, created_by: sarahId,
      version: 3, created_at: hourAgo, updated_at: now,
    },
    {
      id: wi2, title: 'Duplicate payment charge for customer #4521',
      description: 'Customer reported being charged twice for order #ORD-9812. Payment gateway shows two successful transactions. Need to investigate and initiate refund if confirmed.',
      type: 'PAYMENT', status: 'IN_PROGRESS', priority: 'HIGH',
      team_id: operationsId, assignee_id: bobId, created_by: mikeId,
      version: 2, created_at: dayAgo, updated_at: hourAgo,
    },
    {
      id: wi3, title: 'Customer unable to reset password',
      description: 'Multiple customers reported that the password reset email is not being received. Could be an email provider issue or a bug in the reset flow.',
      type: 'CUSTOMER_ISSUE', status: 'OPEN', priority: 'MEDIUM',
      team_id: engineeringId, assignee_id: null, created_by: carolId,
      version: 1, created_at: dayAgo, updated_at: dayAgo,
    },
    {
      id: wi4, title: 'Q3 data retention policy update',
      description: 'Regulatory requirement to update data retention policies before end of quarter. Needs legal review and management approval.',
      type: 'COMPLIANCE', status: 'WAITING_FOR_APPROVAL', priority: 'HIGH',
      team_id: complianceId, assignee_id: mikeId, created_by: bobId,
      version: 4, created_at: twoDaysAgo, updated_at: dayAgo,
    },
    {
      id: wi5, title: 'Update staging environment SSL certificates',
      description: 'SSL certificates for staging.newtonite.com expire in 30 days. Routine renewal task.',
      type: 'OPERATIONAL_TASK', status: 'OPEN', priority: 'LOW',
      team_id: engineeringId, assignee_id: null, created_by: sarahId,
      version: 1, created_at: weekAgo, updated_at: weekAgo,
    },
    {
      id: wi6, title: 'Search results pagination off-by-one error',
      description: 'Users report that page 2 of search results shows the last item from page 1. Likely an offset calculation bug.',
      type: 'ENGINEERING', status: 'IN_PROGRESS', priority: 'MEDIUM',
      team_id: engineeringId, assignee_id: carolId, created_by: aliceId,
      version: 2, created_at: twoDaysAgo, updated_at: dayAgo,
    },
    {
      id: wi7, title: 'Vendor API migration to v3',
      description: 'Payment vendor is deprecating API v2. Migration blocked waiting for new API credentials from vendor. ETA from vendor: 2 weeks.',
      type: 'ENGINEERING', status: 'BLOCKED', priority: 'HIGH',
      team_id: engineeringId, assignee_id: aliceId, created_by: sarahId,
      version: 3, created_at: weekAgo, updated_at: twoDaysAgo,
    },
    {
      id: wi8, title: 'Monthly server cost report - September',
      description: 'Compile and distribute monthly infrastructure cost breakdown.',
      type: 'OPERATIONAL_TASK', status: 'RESOLVED', priority: 'LOW',
      team_id: operationsId, assignee_id: bobId, created_by: mikeId,
      version: 3, resolution_note: 'Report compiled and sent to finance team.',
      created_at: weekAgo, updated_at: twoDaysAgo, resolved_at: twoDaysAgo,
    },
  ]);

  // --- Comments ---
  await knex('comments').insert([
    {
      id: uuidv4(), work_item_id: wi1, author_id: aliceId,
      body: 'Identified the root cause — the connection pool max size is set to 10 but we have 15 worker threads. Increasing pool size to 25 and adding connection timeout.',
      created_at: now,
    },
    {
      id: uuidv4(), work_item_id: wi1, author_id: sarahId,
      body: 'Good catch. Also check if there are any leaked connections from the batch job that runs at peak hours.',
      created_at: new Date(now.getTime() - 10 * 60 * 1000),
    },
    {
      id: uuidv4(), work_item_id: wi2, author_id: bobId,
      body: 'Confirmed duplicate charge. Payment gateway transaction IDs: TXN-44821 and TXN-44823. Initiating refund for TXN-44823.',
      created_at: hourAgo,
    },
    {
      id: uuidv4(), work_item_id: wi4, author_id: mikeId,
      body: 'Legal review completed. Policy changes documented in COMP-DOC-2024-Q3. Awaiting final management sign-off.',
      created_at: dayAgo,
    },
    {
      id: uuidv4(), work_item_id: wi7, author_id: aliceId,
      body: 'Vendor confirmed new API credentials will be available by Oct 15. Blocking until then.',
      created_at: twoDaysAgo,
    },
  ]);

  // --- Activities ---
  await knex('activities').insert([
    // WI1: Created → assigned → status changes
    {
      id: uuidv4(), work_item_id: wi1, actor_id: sarahId, action_type: 'CREATED',
      old_value: null, new_value: JSON.stringify({ title: 'Production database connection pool exhaustion', priority: 'CRITICAL' }),
      created_at: hourAgo,
    },
    {
      id: uuidv4(), work_item_id: wi1, actor_id: sarahId, action_type: 'ASSIGNED',
      old_value: null, new_value: JSON.stringify({ assignee_id: aliceId }),
      created_at: new Date(hourAgo.getTime() + 5 * 60 * 1000),
    },
    {
      id: uuidv4(), work_item_id: wi1, actor_id: aliceId, action_type: 'STATUS_CHANGED',
      old_value: JSON.stringify({ status: 'OPEN' }), new_value: JSON.stringify({ status: 'IN_PROGRESS' }),
      created_at: new Date(hourAgo.getTime() + 10 * 60 * 1000),
    },
    {
      id: uuidv4(), work_item_id: wi1, actor_id: aliceId, action_type: 'COMMENT_ADDED',
      old_value: null, new_value: JSON.stringify({ body: 'Identified the root cause...' }),
      created_at: now,
    },
    // WI2: Created → assigned → status change
    {
      id: uuidv4(), work_item_id: wi2, actor_id: mikeId, action_type: 'CREATED',
      old_value: null, new_value: JSON.stringify({ title: 'Duplicate payment charge', priority: 'HIGH' }),
      created_at: dayAgo,
    },
    {
      id: uuidv4(), work_item_id: wi2, actor_id: mikeId, action_type: 'ASSIGNED',
      old_value: null, new_value: JSON.stringify({ assignee_id: bobId }),
      created_at: dayAgo,
    },
    // WI4: Created → assigned → status changes → waiting
    {
      id: uuidv4(), work_item_id: wi4, actor_id: bobId, action_type: 'CREATED',
      old_value: null, new_value: JSON.stringify({ title: 'Q3 data retention policy update', priority: 'HIGH' }),
      created_at: twoDaysAgo,
    },
    {
      id: uuidv4(), work_item_id: wi4, actor_id: mikeId, action_type: 'STATUS_CHANGED',
      old_value: JSON.stringify({ status: 'OPEN' }), new_value: JSON.stringify({ status: 'IN_PROGRESS' }),
      created_at: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
    },
    {
      id: uuidv4(), work_item_id: wi4, actor_id: mikeId, action_type: 'STATUS_CHANGED',
      old_value: JSON.stringify({ status: 'IN_PROGRESS' }), new_value: JSON.stringify({ status: 'WAITING_FOR_APPROVAL' }),
      created_at: dayAgo,
    },
    // WI8: Resolved
    {
      id: uuidv4(), work_item_id: wi8, actor_id: bobId, action_type: 'RESOLVED',
      old_value: JSON.stringify({ status: 'IN_PROGRESS' }), new_value: JSON.stringify({ status: 'RESOLVED' }),
      metadata: 'Report compiled and sent to finance team.',
      created_at: twoDaysAgo,
    },
  ]);
}
