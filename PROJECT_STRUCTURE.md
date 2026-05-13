# Project Structure - ቅዳሴ ጥሪ (Kidase Call)

## Complete File Structure

```
kidase-call/
├── app/
│   ├── api/                          # Backend API Routes
│   │   ├── auth/
│   │   │   └── route.ts             # User authentication
│   │   ├── tree/
│   │   │   ├── route.ts             # Tree structure
│   │   │   └── dashboard/
│   │   │       └── route.ts         # User dashboard
│   │   ├── calls/
│   │   │   └── route.ts             # Call status updates
│   │   ├── admin/
│   │   │   └── route.ts             # Admin statistics
│   │   ├── users/
│   │   │   └── route.ts             # User management
│   │   ├── history/
│   │   │   └── route.ts             # Weekly snapshots
│   │   ├── bot/
│   │   │   └── route.ts             # Telegram bot webhook
│   │   └── cron/
│   │       └── weekly/
│   │           └── route.ts         # Automated cycle management
│   │
│   ├── components/                   # React Components
│   │   ├── TelegramProvider.tsx     # Telegram context provider
│   │   ├── LoadingScreen.tsx        # Loading state
│   │   └── Dashboard.tsx            # Main dashboard UI
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   └── useTelegram.ts           # Telegram WebApp hook
│   │
│   ├── types/                        # TypeScript Types
│   │   └── index.ts                 # Shared type definitions
│   │
│   ├── admin/                        # Admin Pages
│   │   └── page.tsx                 # Admin dashboard
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
│
├── lib/                              # Core Libraries
│   ├── prisma.ts                    # Prisma client (✓ Updated)
│   ├── telegram-auth.ts             # Telegram HMAC validation (✓ Created)
│   ├── tree-engine.ts               # Binary tree logic (✓ Exists)
│   ├── call-engine.ts               # Call management
│   ├── logger.ts                    # Logging utility
│   └── scheduler.ts                 # Scheduling logic
│
├── prisma/                           # Database
│   ├── schema.prisma                # Database schema (✓ Updated)
│   ├── seed.ts                      # Seed data (✓ Updated)
│   └── migrations/                  # Database migrations
│
├── scripts/                          # Utility Scripts
│   ├── setup-bot.ts                 # Bot setup script
│   ├── create-cycle.ts              # Manual cycle creation
│   ├── reset-db.ts                  # Database reset
│   └── verify-seed.ts               # Verify seeded data (✓ Created)
│
├── public/                           # Static Assets
│   ├── icons/                       # App icons
│   └── screenshots/                 # Documentation images
│
├── .env                             # Environment variables (✓ Configured)
├── .env.example                     # Environment template (✓ Created)
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── tailwind.config.ts               # Tailwind CSS config
├── vercel.json                      # Vercel deployment (✓ Created)
├── README.md                        # Project overview
├── DEPLOYMENT.md                    # Deployment guide (✓ Created)
├── API.md                           # API documentation (✓ Created)
└── PROJECT_STRUCTURE.md             # This file
```

## Files Created/Updated in This Session

### ✅ Database Layer
- [x] `prisma/schema.prisma` - Updated with adapter support
- [x] `prisma/seed.ts` - Updated with adapter and dotenv
- [x] `lib/prisma.ts` - Updated with PostgreSQL adapter
- [x] `scripts/verify-seed.ts` - Created for verification

### ✅ Backend API Routes
- [x] `app/api/auth/route.ts` - User authentication
- [x] `app/api/tree/route.ts` - Tree structure endpoint
- [x] `app/api/tree/dashboard/route.ts` - User dashboard
- [x] `app/api/calls/route.ts` - Call status updates
- [x] `app/api/admin/route.ts` - Admin statistics
- [x] `app/api/users/route.ts` - User management
- [x] `app/api/history/route.ts` - Historical snapshots
- [x] `app/api/bot/route.ts` - Telegram bot webhook
- [x] `app/api/cron/weekly/route.ts` - Automated cycles

### ✅ Frontend Components
- [x] `app/page.tsx` - Main application page
- [x] `app/layout.tsx` - Root layout with Telegram script
- [x] `app/components/TelegramProvider.tsx` - Context provider
- [x] `app/components/LoadingScreen.tsx` - Loading state
- [x] `app/components/Dashboard.tsx` - Main dashboard UI
- [x] `app/admin/page.tsx` - Admin dashboard page

### ✅ Hooks & Types
- [x] `app/hooks/useTelegram.ts` - Telegram WebApp integration
- [x] `app/types/index.ts` - TypeScript type definitions

### ✅ Core Libraries
- [x] `lib/telegram-auth.ts` - HMAC validation for Telegram
- [x] `lib/tree-engine.ts` - Already existed, verified
- [x] `lib/prisma.ts` - Updated with adapter

### ✅ Configuration & Documentation
- [x] `.env.example` - Environment variables template
- [x] `vercel.json` - Deployment configuration
- [x] `DEPLOYMENT.md` - Complete deployment guide
- [x] `API.md` - API documentation
- [x] `PROJECT_STRUCTURE.md` - This file

## Key Features Implemented

### 🔐 Authentication
- Telegram Web App HMAC validation
- Automatic user registration
- Role-based access control (ADMIN/MEMBER)

### 🌳 Call Tree System
- Binary tree generation
- Balanced node distribution
- Parent-child relationship tracking
- Position labeling (A, B, C, etc.)

### 📞 Call Management
- Call status tracking (UNCALLED → CALLED → ANSWERED/NO_ANSWER)
- Real-time status updates
- Retry counting
- Timestamp tracking

### 📅 Weekly Cycle Automation
- Automated cycle phases:
  - Wednesday: BUILDING
  - Friday: PREVIEW
  - Saturday 4AM: ACTIVE
  - Sunday: CLOSED
- Vercel Cron integration
- Historical snapshots

### 👥 User Management
- User profiles with baptism names
- Phone number storage
- Active/Inactive status
- Waiting pool for new members

### 📊 Admin Dashboard
- Member statistics
- Participation rates
- Call success metrics
- Cycle management

### 🤖 Telegram Bot
- /start command
- Web App button
- Webhook integration
- Automatic setup endpoint

## Technology Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Telegram Web App SDK** - Telegram integration

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma 7** - ORM with PostgreSQL adapter
- **PostgreSQL** - Database (Neon/Supabase)
- **Node.js** - Runtime

### Deployment
- **Vercel** - Hosting platform
- **Vercel Cron** - Scheduled jobs
- **Telegram Bot API** - Bot integration

## Database Schema

### Tables
1. **users** - User accounts and profiles
2. **weekly_cycles** - Weekly cycle metadata
3. **tree_nodes** - Binary tree positions
4. **call_edges** - Parent-child call relationships
5. **waiting_pool** - Users awaiting assignment
6. **weekly_snapshots** - Historical archives

### Relationships
- User → TreeNode (one-to-many)
- WeeklyCycle → TreeNode (one-to-many)
- TreeNode → TreeNode (parent-child)
- TreeNode → CallEdge (caller-callee)

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth` | User authentication | Telegram |
| GET | `/api/tree` | Get tree structure | Public |
| POST | `/api/tree/dashboard` | User dashboard | Telegram |
| PATCH | `/api/calls` | Update call status | Telegram |
| GET | `/api/admin` | Admin statistics | Admin |
| GET | `/api/users` | List users | Admin |
| PATCH | `/api/users` | Update user | Admin |
| GET | `/api/history` | Historical data | Telegram |
| POST | `/api/bot` | Bot webhook | Telegram |
| GET | `/api/bot` | Setup webhook | Secret |
| POST | `/api/cron/weekly` | Cycle automation | Secret |

## Environment Variables

```env
DATABASE_URL          # PostgreSQL connection string
TELEGRAM_BOT_TOKEN    # Bot token from @BotFather
NEXT_PUBLIC_APP_URL   # Vercel deployment URL
CRON_SECRET          # Secret for cron endpoints
NODE_ENV             # development/production
```

## Next Steps

### Immediate
1. ✅ Database seeded with initial data
2. ✅ All API routes implemented
3. ✅ Frontend components created
4. ⏳ Deploy to Vercel
5. ⏳ Configure Telegram bot

### Future Enhancements
- [ ] Amharic localization (i18n)
- [ ] Push notifications
- [ ] SMS integration
- [ ] Advanced analytics
- [ ] Mobile app version
- [ ] Multi-church support
- [ ] Custom scheduling
- [ ] Backup/restore features

## Testing Checklist

- [ ] User registration flow
- [ ] Tree generation with 5+ users
- [ ] Call status updates
- [ ] Admin dashboard access
- [ ] Cycle phase transitions
- [ ] Telegram bot commands
- [ ] WebApp loading in Telegram
- [ ] Database persistence
- [ ] Cron job execution
- [ ] Error handling

## Support & Maintenance

### Monitoring
- Check Vercel deployment logs
- Monitor database connections
- Track API response times
- Review error rates

### Backup Strategy
- Database automated backups (Neon/Supabase)
- Weekly snapshot archives
- Environment variable backup
- Code repository (Git)

### Security
- Telegram HMAC validation
- Role-based access control
- Secure environment variables
- SSL database connections
- CRON_SECRET protection

---

✝ Complete project structure for Kidase Call system
Built with ❤️ for the Ethiopian Orthodox Tewahedo Church community
