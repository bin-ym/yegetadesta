# Vercel Deployment Checklist

## ✅ Fixed Issues
- [x] Fixed import path in `lib/tree-engine.ts` (was using non-existent `@/app/generated/prisma`)
- [x] Added `postinstall` script to auto-generate Prisma client
- [x] Updated build script to include Prisma generation
- [x] Removed custom buildCommand from vercel.json (uses package.json scripts)

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Fix Vercel deployment issues"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables
Add these in Vercel dashboard (Settings → Environment Variables):

```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your-random-secret-here
NODE_ENV=production
```

**Important:** 
- Add all variables to **Production**, **Preview**, and **Development** environments
- After first deploy, update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
- Redeploy after updating the URL

### Step 4: Deploy
Click "Deploy" button

Vercel will:
1. Install dependencies
2. Run `postinstall` (generates Prisma client)
3. Run `build` (generates Prisma + builds Next.js)
4. Deploy your app

### Step 5: Setup Telegram Bot
After successful deployment:

```bash
# Replace with your actual values
curl "https://your-app.vercel.app/api/bot?setup_secret=YOUR_CRON_SECRET"
```

This will:
- Set the webhook URL
- Configure bot commands

### Step 6: Configure Bot Menu Button
1. Open Telegram → @BotFather
2. Send `/setmenubutton`
3. Select your bot
4. Button text: `📱 Open App`
5. Web App URL: `https://your-app.vercel.app`

### Step 7: Test
1. Open your bot in Telegram
2. Send `/start`
3. Click "Open App"
4. You should see the Kidase Call interface!

## 🔍 Troubleshooting

### Build fails with Prisma error
- Check that `DATABASE_URL` is set in environment variables
- Ensure the database is accessible from Vercel
- Check Vercel build logs for specific error

### "Module not found" errors
- Make sure all imports use correct paths
- Run `npm run build` locally first to catch errors
- Check that all dependencies are in `package.json`

### Telegram WebApp not loading
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Check browser console for errors
- Ensure bot webhook is set correctly

### Database connection issues
- Verify connection string format
- Check SSL mode is set (`?sslmode=require`)
- Ensure database allows connections from Vercel IPs
- For Neon: use the pooled connection string

### Cron jobs not running
- Cron jobs require Vercel Pro plan
- Check Vercel dashboard → Cron Jobs tab
- Verify `CRON_SECRET` is set correctly
- Test manually with curl first

## 📊 Verify Deployment

### Check API endpoints
```bash
# Health check
curl https://your-app.vercel.app/api/tree

# Setup bot (one-time)
curl "https://your-app.vercel.app/api/bot?setup_secret=YOUR_SECRET"
```

### Check database
```bash
# Connect to your database
psql $DATABASE_URL

# Verify tables exist
\dt

# Check users
SELECT * FROM users;
```

### Monitor logs
- Vercel Dashboard → Your Project → Logs
- Filter by function to see API route logs
- Check for errors or warnings

## 🎯 Post-Deployment

### Seed database (if needed)
If you haven't seeded the database yet:

```bash
# Locally with production DATABASE_URL
DATABASE_URL="your-production-url" npx prisma db seed
```

Or create a temporary API endpoint to seed from Vercel.

### Create first admin user
Connect to your database and run:

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE telegram_id = 'YOUR_TELEGRAM_ID';
```

### Test weekly cycle
Manually trigger cycle creation:

```bash
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "build"}'
```

## 🔐 Security Checklist
- [ ] `CRON_SECRET` is strong and random
- [ ] `TELEGRAM_BOT_TOKEN` is kept secret
- [ ] Database uses SSL connection
- [ ] Environment variables are not in code
- [ ] `.env` files are in `.gitignore`

## 📈 Monitoring
- Set up Vercel Analytics (free)
- Monitor API response times
- Check database connection pool usage
- Review error logs regularly

## 🎉 Success!
Once deployed, your Kidase Call system will:
- ✅ Accept new users via Telegram
- ✅ Generate weekly call trees
- ✅ Track call status
- ✅ Provide admin dashboard
- ✅ Archive weekly snapshots

---

Need help? Check:
- Vercel deployment logs
- Browser console (F12)
- Database connection
- Telegram Bot API status
