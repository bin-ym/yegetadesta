# Deployment Guide - ቅዳሴ ጥሪ (Kidase Call)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon, Supabase, or Railway)
- Telegram Bot Token from @BotFather
- Vercel account (for deployment)

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. It should look like: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (Transaction mode)

### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string from the Connect tab

## Step 2: Telegram Bot Setup

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Copy the **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Send `/setdescription` to set bot description
6. Send `/setmenubutton` to add the Web App button

## Step 3: Local Development

1. Clone the repository:
```bash
git clone <your-repo>
cd kidase-call
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Fill in your `.env.local`:
```env
DATABASE_URL="postgresql://..."
TELEGRAM_BOT_TOKEN="123456789:ABC..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-random-secret-123"
NODE_ENV="development"
```

5. Setup database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

6. Run development server:
```bash
npm run dev
```

## Step 4: Deploy to Vercel

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com)

3. Click "New Project" and import your repository

4. Add Environment Variables:
   - `DATABASE_URL`
   - `TELEGRAM_BOT_TOKEN`
   - `NEXT_PUBLIC_APP_URL` (will be your Vercel URL)
   - `CRON_SECRET`

5. Deploy!

6. After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`)

7. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables with your actual URL

8. Redeploy

## Step 5: Register Telegram WebApp

After deployment, register your app with Telegram:

```bash
curl "https://your-app.vercel.app/api/bot?setup_secret=YOUR_CRON_SECRET"
```

Or visit in browser:
```
https://your-app.vercel.app/api/bot?setup_secret=YOUR_CRON_SECRET
```

## Step 6: Configure Telegram Bot Menu

1. Go back to @BotFather
2. Send `/setmenubutton`
3. Select your bot
4. Send the button text: `📱 Open App`
5. Send your Web App URL: `https://your-app.vercel.app`

## Step 7: Test Your Bot

1. Open your bot in Telegram
2. Send `/start`
3. Click "Open App" button
4. You should see the Kidase Call interface!

## Automated Weekly Cycles

The system automatically manages weekly cycles via Vercel Cron Jobs:

- **Wednesday 12:00 PM**: Build new cycle tree
- **Friday 12:00 PM**: Activate preview mode
- **Saturday 4:00 AM**: Activate call tracking
- **Sunday 11:59 PM**: Close cycle and create snapshot

These are configured in `vercel.json`.

## Manual Cycle Management

You can manually trigger cycle actions:

```bash
# Build new cycle
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "build"}'

# Activate preview
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "preview"}'

# Activate cycle
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "activate"}'

# Close cycle
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "close"}'
```

## Troubleshooting

### Bot not responding
- Check that webhook is set correctly
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check Vercel logs for errors

### Database connection issues
- Verify `DATABASE_URL` is correct
- Check that database allows connections from Vercel IPs
- Ensure SSL mode is set correctly

### WebApp not loading
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Check browser console for errors
- Ensure Telegram Web App script is loading

### Users not seeing tree
- Run the seed script to create initial data
- Manually trigger cycle build
- Check that users are in the database

## Admin Access

To make a user an admin:

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE telegram_id = 'YOUR_TELEGRAM_ID';
```

Then visit: `https://your-app.vercel.app/admin`

## Support

For issues, check:
1. Vercel deployment logs
2. Database connection
3. Telegram Bot API status
4. Browser console errors

## Security Notes

- Never commit `.env` or `.env.local` files
- Keep `CRON_SECRET` secure
- Rotate `TELEGRAM_BOT_TOKEN` if compromised
- Use SSL for database connections
- Validate all Telegram data with HMAC

## Next Steps

1. Customize the UI with your church branding
2. Add Amharic translations
3. Set up monitoring and alerts
4. Configure backup strategy for database
5. Add more admin features as needed

---

✝ May this system serve the spiritual community well!
