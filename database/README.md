# CouplePlan Database

This folder contains the database schema definitions and migrations for the CouplePlan application.

## Schema Reference

### Important Column Name Conventions

The database uses different column names for user references across tables:

| Table | User Reference Column | Notes |
|-------|----------------------|-------|
| `profiles` | `id` | Primary key, references `auth.users(id)` |
| `events` | `user_id` | Owner of the event |
| `budgets` | `created_by` | **NOT `user_id`** - Creator of the budget |
| `goals` | `created_by` | **NOT `user_id`** - Creator of the goal |
| `tasks` | `created_by` | **NOT `user_id`** - Creator of the task |
| `expenses` | `created_by` | Creator of the expense |
| `travels` | `created_by` | Creator of the travel plan |
| `invitations` | `from_user_id` | User who sent the invitation |

### Status/State Columns

| Table | Status Column | Type | Values |
|-------|--------------|------|--------|
| `events` | `type` | text | 'personal', 'shared' |
| `goals` | `completed` | **boolean** | true, false |
| `tasks` | `completed` | **boolean** | true, false |
| `budgets` | `spent` | numeric | Amount spent |
| `invitations` | `status` | text | 'pending', 'accepted', 'rejected' |
| `travels` | `status` | text | 'planning', 'booked', 'completed' |

### Common Patterns

```sql
-- Query events for a user (uses user_id)
SELECT * FROM events WHERE user_id = 'user-uuid';

-- Query goals for a user (uses created_by)
SELECT * FROM goals WHERE created_by = 'user-uuid';

-- Query tasks for a user (uses created_by)
SELECT * FROM tasks WHERE created_by = 'user-uuid';

-- Query budgets for a user (uses created_by)
SELECT * FROM budgets WHERE created_by = 'user-uuid';
```

## Folder Structure

```
database/
├── schema/
│   └── 00-full-schema.sql    # Complete schema for reference
├── migrations/
│   └── (migration files)     # Incremental schema changes
└── README.md                 # This file
```

## When Making Schema Changes

1. Always update `schema/00-full-schema.sql` to reflect the current state
2. Create a new migration file in `migrations/` with the changes
3. Update this README if conventions change
