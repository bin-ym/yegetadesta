# Telegram User Approval Flow

## 📱 New User Journey

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Opens App via Telegram                             │
│     ↓                                                        │
│  2. System Validates Telegram Data                          │
│     ↓                                                        │
│  3. Check if User Exists in Database                        │
│     ├─ YES → Show Dashboard (existing user)                 │
│     └─ NO  → Continue to Step 4                             │
│                                                              │
│  4. Check if Pending Request Exists                         │
│     ├─ PENDING   → Show "Waiting for Approval" Screen       │
│     ├─ REJECTED  → Show "Access Denied" Message             │
│     └─ NO REQUEST → Continue to Step 5                      │
│                                                              │
│  5. Create Pending User Request                             │
│     ↓                                                        │
│  6. Show "Access Request Submitted" Screen                  │
│                                                              │
│  ⏳ User Waits for Super Admin Approval                     │
└─────────────────────────────────────────────────────────────┘
```

## 👨‍💼 Super Admin Approval Process

```
┌─────────────────────────────────────────────────────────────┐
│  1. Super Admin Logs into Admin Dashboard                   │
│     ↓                                                        │
│  2. Clicks "Pending" Tab                                    │
│     ↓                                                        │
│  3. Views List of Pending Requests                          │
│     │                                                        │
│     │  Shows:                                               │
│     │  • Full Name                                          │
│     │  • Username (@username)                               │
│     │  • Telegram ID                                        │
│     │  • Request Date/Time                                  │
│     │                                                        │
│     ↓                                                        │
│  4. Super Admin Makes Decision                              │
│     ├─ APPROVE                                              │
│     │   ↓                                                   │
│     │   • Create User with MEMBER role                      │
│     │   • Add to Next Pool (WaitingPool)                    │
│     │   • Mark request as APPROVED                          │
│     │   • User can access on next login                     │
│     │                                                        │
│     └─ REJECT                                               │
│         ↓                                                    │
│         • Mark request as REJECTED                           │
│         • User sees "Access Denied" on next login            │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Status Flow Diagram

```
┌──────────────┐
│  New User    │
│  (Telegram)  │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│  PENDING         │  ← User sees "Waiting for Approval"
│  (PendingUser)   │
└────┬─────────┬───┘
     │         │
     │         │
APPROVE    REJECT
     │         │
     ↓         ↓
┌─────────┐  ┌──────────┐
│ ACTIVE  │  │ REJECTED │
│ (User)  │  │ (Denied) │
│         │  └──────────┘
│ Added   │
│ to Pool │
└─────────┘
```

## 📊 Database Tables

### Before Approval:
```
PendingUser Table:
┌────────────┬─────────────┬──────────┬──────────┬─────────────┐
│ telegramId │  fullName   │ username │  status  │ requestedAt │
├────────────┼─────────────┼──────────┼──────────┼─────────────┤
│ 123456789  │ John Doe    │ @johnd   │ PENDING  │ 2026-05-23  │
│ 987654321  │ Jane Smith  │ @janes   │ PENDING  │ 2026-05-23  │
└────────────┴─────────────┴──────────┴──────────┴─────────────┘
```

### After Approval:
```
User Table:
┌────────────┬─────────────┬──────────┬────────┬──────────┐
│ telegramId │  fullName   │ username │  role  │  status  │
├────────────┼─────────────┼──────────┼────────┼──────────┤
│ 123456789  │ John Doe    │ @johnd   │ MEMBER │ ACTIVE   │
└────────────┴─────────────┴──────────┴────────┴──────────┘

WaitingPool Table:
┌──────────┬────────────┬──────────┬──────────┐
│ cycleId  │   userId   │ position │  status  │
├──────────┼────────────┼──────────┼──────────┤
│ cycle_1  │ user_123   │    0     │ WAITING  │
└──────────┴────────────┴──────────┴──────────┘
```

## 🎨 UI Screens

### 1. Pending Access Screen (User View)
```
┌─────────────────────────────────────┐
│         🕐 (Clock Icon)             │
│                                     │
│   Access Request Pending            │
│                                     │
│   Your request to join Kidase Call  │
│   has been submitted and is waiting │
│   for approval from the Super Admin.│
│                                     │
│   ℹ️ What happens next?             │
│   • Super Admin will review         │
│   • Once approved, you'll be added  │
│     to the next pool                │
│   • You'll receive access to all    │
│     features                        │
│                                     │
│   Please check back later...        │
└─────────────────────────────────────┘
```

### 2. Admin Pending Tab (Super Admin View)
```
┌─────────────────────────────────────────────────────────┐
│  🕐 Pending User Requests (2)                           │
├─────────────────────────────────────────────────────────┤
│  👤 John Doe                                            │
│     @johnd • Telegram ID: 123456789                     │
│     Requested: 5/23/2026, 10:30 AM                      │
│                                                          │
│     [✓ Approve]  [✗ Reject]                             │
├─────────────────────────────────────────────────────────┤
│  👤 Jane Smith                                          │
│     @janes • Telegram ID: 987654321                     │
│     Requested: 5/23/2026, 11:15 AM                      │
│                                                          │
│     [✓ Approve]  [✗ Reject]                             │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security Features

✅ Only Super Admin can approve users
✅ Telegram data validation required
✅ Prevents duplicate pending requests
✅ Tracks who approved/rejected (reviewedBy field)
✅ Timestamps for audit trail

## 🎯 Key Benefits

1. **Control**: Super Admin controls who joins
2. **Security**: Prevents unauthorized access
3. **Tracking**: Full audit trail of requests
4. **User Experience**: Clear feedback to users
5. **Automation**: Approved users auto-join next pool
