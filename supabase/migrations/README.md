# Supabase migrations

Additive migrations for the internal Staff Portal & Finance/CRM build. These do
**not** modify existing tables (`packages`, `enrollments`, `messages`,
`destinations`). Apply them by pasting into the **Supabase SQL editor** and running,
in order:

| Order | File | Purpose |
| --- | --- | --- |
| 1 | `0001_staff_attendance.sql` | `staff` + `attendance_sessions` tables, indexes, RLS, realtime |
| 2 | `0002_seed_demo.sql` | Optional demo staff + attendance history (safe to skip) |

All statements are idempotent (`IF NOT EXISTS` / existence-guarded), so re-running
is safe.

### Demo staff codes (after running `0002`)

| Name | Code | Notes |
| --- | --- | --- |
| Rakib Ahmed Rizbe | `NX-4821` | Has attendance history + recent sessions |
| Sadia Islam | `NX-3390` | No attendance yet |
| Tanvir Hasan | `NX-5027` | No attendance yet |

Use any of these codes at `/staff_portal/login`. Codes are case-insensitive.

> **Note:** Realtime requires the tables to be in the `supabase_realtime`
> publication — `0001` handles this. If your project uses a differently named
> publication, adjust the `ALTER PUBLICATION` statements at the bottom of `0001`.
