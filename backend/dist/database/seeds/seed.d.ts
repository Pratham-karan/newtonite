import { Knex } from 'knex';
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
export declare function seed(knex: Knex): Promise<void>;
