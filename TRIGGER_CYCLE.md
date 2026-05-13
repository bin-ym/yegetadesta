# Create Weekly Cycle

Your app is working! You just need to create a weekly cycle and add users.

## Option 1: Trigger Cycle Creation via API (Recommended)

Run this command to create a new cycle:

```bash
curl -X POST https://yegetadesta.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "build"}'
```

Replace `YOUR_CRON_SECRET` with the actual value from your Vercel environment variables.

## Option 2: Create a Quick Setup Endpoint

I'll create a simple setup endpoint for you to initialize everything at once.

## Option 3: Use Database Directly

Connect to your database and run:

```sql
-- Check if you have users
SELECT * FROM users;

-- If no users, you need to add some first
-- Then create a cycle manually or use the API
```

## What You Need

1. **Users in database** - At least 1 user
2. **Weekly cycle** - Created with "build" action
3. **Tree nodes** - Generated when cycle is built

Let me know which option you prefer, or I can create a one-time setup endpoint for you!
