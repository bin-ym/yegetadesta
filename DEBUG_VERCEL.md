# Debugging Vercel Deployment

## Current Issue
Error: "Failed to fetch dashboard" when opening bot in Telegram

## Step-by-Step Debugging

### 1. Check Health Endpoint
First, verify your API and database are working:

```bash
curl https://yegetadesta.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "database": "connected",
  "users": 5,
  "cycles": 1,
  "timestamp": "2026-05-13T..."
}
```

**If you get an error:**
- Database connection issue
- Check `DATABASE_URL` in Vercel environment variables
- Ensure database allows Vercel connections

### 2. Check Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required variables:**
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `TELEGRAM_BOT_TOKEN` - Your bot token
- ✅ `NEXT_PUBLIC_APP_URL` - https://yegetadesta.vercel.app
- ✅ `CRON_SECRET` - Random secret string
- ✅ `NODE_ENV` - production

**Important:** After adding/updating variables, you MUST redeploy!

### 3. Check Vercel Logs
1. Go to Vercel Dashboard → Your Project
2. Click on "Deployments"
3. Click on your latest deployment
4. Click "Functions" tab
5. Look for `/api/tree/dashboard` logs

**Look for:**
- "Dashboard request received"
- "User validated: [number]"
- Any error messages

### 4. Seed the Database
If health check shows 0 users, you need to seed:

**Option A: From local machine**
```bash
# Use your production DATABASE_URL
DATABASE_URL="postgresql://..." npx prisma db seed
```

**Option B: Create a seed endpoint (temporary)**
Create `app/api/seed/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWeeklyCycle, persistTree } from "@/lib/tree-engine";

export async function POST(req: Request) {
  const { secret } = await req.json();
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear existing data
  await prisma.callEdge.deleteMany();
  await prisma.treeNode.deleteMany();
  await prisma.weeklySnapshot.deleteMany();
  await prisma.waitingPool.deleteMany();
  await prisma.weeklyCycle.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        telegramId: "1000000001",
        fullName: "አለሙ ተፈሪ",
        baptismName: "ሚካኤል",
        phoneNumber: "+251911000001",
        address: "ቦሌ",
        role: "ADMIN",
      },
    }),
    // Add more users...
  ]);

  // Create cycle
  const cycle = await createWeeklyCycle();
  await persistTree({
    cycleId: cycle.id,
    userIds: users.map((u) => u.id),
  });

  return NextResponse.json({ success: true, users: users.length });
}
```

Then call it:
```bash
curl -X POST https://yegetadesta.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_CRON_SECRET"}'
```

### 5. Test Telegram Authentication
The most common issue is Telegram auth validation failing.

**Check:**
1. Is `TELEGRAM_BOT_TOKEN` correct in Vercel?
2. Is the token the same one used to create the bot?
3. Did you redeploy after adding the token?

**Test locally:**
```bash
# In your .env.local
TELEGRAM_BOT_TOKEN="your_actual_token"

# Run dev server
npm run dev
```

### 6. Check Bot Configuration
Verify your bot is configured correctly:

```bash
# Check webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Set webhook (if not set)
curl "https://yegetadesta.vercel.app/api/bot?setup_secret=YOUR_CRON_SECRET"
```

### 7. Check Bot Menu Button
In Telegram:
1. Open @BotFather
2. Send `/mybots`
3. Select your bot
4. Click "Bot Settings" → "Menu Button"
5. Verify URL is: `https://yegetadesta.vercel.app`

### 8. Test in Telegram
1. Open your bot in Telegram
2. Send `/start`
3. Click "Open App"
4. Open browser DevTools (if on desktop Telegram)
5. Check Console for errors

### 9. Common Issues & Solutions

#### Issue: "Unauthorized" error
**Cause:** Telegram HMAC validation failing
**Solution:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check that token matches the bot you're testing with
- Redeploy after updating token

#### Issue: "User not found" error
**Cause:** Database is empty
**Solution:**
- Seed the database (see step 4)
- Or let users auto-register (dashboard now does this)

#### Issue: "Failed to fetch dashboard"
**Cause:** Database connection or query error
**Solution:**
- Check health endpoint
- Verify `DATABASE_URL` format
- Check Vercel function logs

#### Issue: Database connection timeout
**Cause:** Wrong connection string or SSL issue
**Solution:**
- Use pooled connection string from Neon
- Ensure `?sslmode=require` is in connection string
- Check database allows Vercel IPs

#### Issue: "Module not found" during build
**Cause:** Missing dependencies or wrong imports
**Solution:**
- Run `npm run build` locally first
- Check all imports are correct
- Verify `package.json` has all dependencies

### 10. Enable Debug Mode
Add more logging to see what's happening:

In `app/page.tsx`, update the error display:
```typescript
if (error) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <pre className="text-xs text-left bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify({ initData: initData?.substring(0, 50) }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

### 11. Quick Fix Checklist
- [ ] Health endpoint returns "ok"
- [ ] Database has users (check health endpoint)
- [ ] `TELEGRAM_BOT_TOKEN` is set in Vercel
- [ ] `DATABASE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` is https://yegetadesta.vercel.app
- [ ] Redeployed after setting environment variables
- [ ] Bot webhook is set to your Vercel URL
- [ ] Bot menu button URL is correct
- [ ] Vercel function logs show no errors

### 12. Get Help
If still stuck, check:
1. Vercel function logs (most important!)
2. Browser console in Telegram WebApp
3. Database connection from local machine
4. Telegram Bot API status

### Quick Commands Reference

```bash
# Check health
curl https://yegetadesta.vercel.app/api/health

# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Setup webhook
curl "https://yegetadesta.vercel.app/api/bot?setup_secret=<SECRET>"

# Test database locally
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Seed database locally
DATABASE_URL="<production-url>" npx prisma db seed

# Check Vercel logs
vercel logs <deployment-url>
```

---

## Most Likely Issue

Based on "Failed to fetch dashboard", the most likely causes are:

1. **Database not seeded** - Run health check, if users=0, seed it
2. **Wrong TELEGRAM_BOT_TOKEN** - Double-check it matches your bot
3. **Missing environment variables** - Verify all are set and redeploy

Start with the health check and work through the list!
