✝ ቅዳሴ ጥሪ — Kidase Call

Ethiopian Orthodox Tewahedo Church Wake-up Coordination System

A Telegram Mini App that coordinates Saturday-night wake-up responsibility for Kidase (Sunday Mass) using a hierarchical binary call tree, automated weekly cycles, and real-time accountability tracking.

📐 System Architecture
TELEGRAM MINI APP (WebApp)
        │
        ▼
NEXT.JS APP (Vercel)
        │
        ├── /api/auth              Telegram user authentication (initData HMAC)
        ├── /api/tree             Current cycle tree structure
        ├── /api/tree/dashboard   User position + parent + children + status
        ├── /api/calls            Call status updates (PATCH)
        ├── /api/admin            Admin analytics + cycle control
        ├── /api/users            User management + roles
        ├── /api/history          Weekly snapshots archive
        ├── /api/bot              Telegram webhook (start / menu / sync)
        └── /api/cron/weekly      Automated weekly cycle engine
                 │
                 ▼
         POSTGRESQL (Prisma)
                 │
                 ├── users
                 ├── weekly_cycles
                 ├── tree_nodes
                 ├── call_edges
                 ├── waiting_pool
                 └── weekly_snapshots
🌳 Call Tree Model

A balanced binary responsibility tree:

                A
           /         \
          B           C
        /   \       /   \
       D     E     F     G
      / \   / \   / \   / \
     H   I J   K L   M N   O
Rules
Each node is assigned exactly one user per cycle
Every parent node is responsible for calling its 2 children
Tree auto-balances based on user order
Waiting pool users are appended to leaf expansion
🗓 Weekly Cycle Lifecycle
Day	Time (EAT)	Phase	Action
Wednesday	12:00	BUILDING	Tree generation
Friday	12:00	PREVIEW	Users view positions
Saturday	04:00 AM	ACTIVE	Call tracking opens
Sunday	23:59	CLOSED	Cycle locks
Mon–Tue	—	HISTORY	Read-only archive
📞 Call Status Flow
UNCALLED → CALLED → ANSWERED
                    ↘ NO_ANSWER
Meaning
UNCALLED → not yet contacted
CALLED → attempt made
ANSWERED → successful contact
NO_ANSWER → failed attempt
🚀 Setup Guide
1. Create Telegram Bot
Open Telegram → @BotFather
Run /newbot
Copy BOT_TOKEN
Set bot description + menu button (Mini App URL)
2. Database Setup (PostgreSQL)

Recommended providers:

Supabase (best free tier)
Neon (serverless Postgres)
Railway

Set:

DATABASE_URL=postgresql://...
3. Install & Run Project
git clone <repo>
cd kidase-call

npm install

cp .env.example .env.local

Fill:

DATABASE_URL=
TELEGRAM_BOT_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
4. Setup Database
npx prisma db push
npm run db:seed
5. Deploy (Vercel)
vercel --prod
6. Register Telegram WebApp
curl "https://your-app.vercel.app/api/bot?setup_secret=CRON_SECRET"
👤 User Flow
First-time user
Opens Telegram bot
Clicks Open App
Authenticated via Telegram initData
Registered in system
Placed in waiting pool
Weekly Participation

Wednesday

System builds new tree

Friday

Users preview their position

Saturday 4AM

System becomes ACTIVE
Each user sees:
Parent responsibility (if any)
2 child contacts

Action Flow

Mark call → CALLED
Update result → ANSWERED / NO_ANSWER
🏗 Project Structure
prisma/
  schema.prisma
  seed.ts

lib/
  prisma.ts
  tree-engine.ts
  telegram-auth.ts

app/
  page.tsx
  layout.tsx
  globals.css

app/api/
  auth/
  tree/
  calls/
  admin/
  users/
  history/
  bot/
  cron/weekly/

hooks/
  useTelegram.ts

types/
  index.ts

scripts/
  setup-bot.ts
🔐 Security Model
Telegram HMAC validation required for all users
Admin-only endpoints protected via role check
Cron endpoints protected via CRON_SECRET
Weekly cycles are immutable after closing
Users can only update their own call edges
📊 Admin Dashboard Metrics
Active members
Waiting pool size
Weekly participation rate
Call success ratio
Average response time
Historical weekly snapshots
🌍 Localization

Supported languages:

🇪🇹 Amharic (primary user content)
🇬🇧 English (UI system)

Future upgrade:

next-intl
/locales/am.json
/locales/en.json
🧠 Core Idea (System Logic)

This system is not just a reminder tool.

It is a distributed responsibility graph:

Every user is both caller and responder
Every week regenerates structure
Every action is auditable
No central dependency after generation
✨ Philosophy

ቅዳሴ ጥሪ is not about calling people — it is about ensuring no one is forgotten in spiritual responsibility.