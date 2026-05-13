# API Documentation - ቅዳሴ ጥሪ (Kidase Call)

## Authentication

All user endpoints require Telegram Web App `initData` for authentication.

### Headers
```
Content-Type: application/json
x-telegram-init-data: <initData from Telegram WebApp>
```

### Body (for POST requests)
```json
{
  "initData": "<initData from Telegram WebApp>"
}
```

---

## Endpoints

### 1. Authentication

#### `POST /api/auth`
Authenticate user and create account if needed.

**Request:**
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "telegramId": "123456789",
    "fullName": "John Doe",
    "baptismName": "Michael",
    "phoneNumber": "+251911000001",
    "role": "MEMBER",
    "status": "ACTIVE"
  }
}
```

---

### 2. Tree Structure

#### `GET /api/tree`
Get current cycle tree structure.

**Response:**
```json
{
  "cycle": {
    "id": "clx...",
    "weekNumber": 20,
    "year": 2026,
    "phase": "ACTIVE"
  },
  "nodes": [...],
  "edges": [...]
}
```

---

### 3. User Dashboard

#### `POST /api/tree/dashboard`
Get personalized dashboard for authenticated user.

**Request:**
```json
{
  "initData": "..."
}
```

**Response:**
```json
{
  "user": {...},
  "currentCycle": {...},
  "myNode": {
    "position": "A",
    "level": 0
  },
  "myParent": {...},
  "myChildren": [...],
  "myOutgoingCalls": [
    {
      "id": "clx...",
      "status": "UNCALLED",
      "calleeNode": {
        "user": {
          "fullName": "Jane Doe",
          "phoneNumber": "+251911000002"
        }
      }
    }
  ],
  "myIncomingCall": {...}
}
```

---

### 4. Call Status Updates

#### `PATCH /api/calls`
Update call status (caller only).

**Request:**
```json
{
  "initData": "...",
  "callEdgeId": "clx...",
  "status": "ANSWERED"
}
```

**Status values:**
- `UNCALLED` - Not yet contacted
- `CALLED` - Attempt made
- `ANSWERED` - Successful contact
- `NO_ANSWER` - Failed attempt

**Response:**
```json
{
  "callEdge": {
    "id": "clx...",
    "status": "ANSWERED",
    "calledAt": "2026-05-13T04:15:00Z",
    "answeredAt": "2026-05-13T04:15:30Z"
  }
}
```

---

### 5. Admin Dashboard

#### `GET /api/admin`
Get admin statistics (admin only).

**Headers:**
```
x-telegram-init-data: <initData>
```

**Response:**
```json
{
  "totalMembers": 50,
  "activeMembers": 45,
  "waitingPoolSize": 5,
  "currentCycle": {...},
  "totalCalls": 44,
  "answeredCalls": 38,
  "noAnswerCalls": 2,
  "participationRate": 86.4
}
```

---

### 6. User Management

#### `GET /api/users`
List all users (admin only).

**Headers:**
```
x-telegram-init-data: <initData>
```

**Response:**
```json
{
  "users": [
    {
      "id": "clx...",
      "fullName": "John Doe",
      "role": "MEMBER",
      "status": "ACTIVE"
    }
  ]
}
```

#### `PATCH /api/users`
Update user (admin only).

**Request:**
```json
{
  "initData": "...",
  "userId": "clx...",
  "updates": {
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

---

### 7. History

#### `GET /api/history`
Get weekly snapshots archive.

**Headers:**
```
x-telegram-init-data: <initData>
```

**Response:**
```json
{
  "snapshots": [
    {
      "id": "clx...",
      "weekNumber": 19,
      "year": 2026,
      "totalMembers": 45,
      "totalCalls": 44,
      "answeredCalls": 40,
      "participationPct": 90.9,
      "treeSnapshot": {...},
      "callLog": {...}
    }
  ]
}
```

---

### 8. Bot Webhook

#### `POST /api/bot`
Telegram bot webhook endpoint.

**Request:** (from Telegram)
```json
{
  "message": {
    "chat": {
      "id": 123456789
    },
    "text": "/start"
  }
}
```

#### `GET /api/bot?setup_secret=<CRON_SECRET>`
Setup bot webhook and commands.

**Response:**
```json
{
  "success": true,
  "webhook": {...}
}
```

---

### 9. Cron Jobs

#### `POST /api/cron/weekly`
Automated weekly cycle management.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json
```

**Request:**
```json
{
  "action": "build" | "preview" | "activate" | "close"
}
```

**Actions:**
- `build` - Create new cycle and generate tree
- `preview` - Activate preview mode (Friday)
- `activate` - Start call tracking (Saturday 4AM)
- `close` - Lock cycle and create snapshot (Sunday)

**Response:**
```json
{
  "success": true,
  "cycle": {...}
}
```

---

## Data Models

### User
```typescript
{
  id: string;
  telegramId: string;
  fullName: string;
  baptismName: string | null;
  phoneNumber: string | null;
  username: string | null;
  address: string | null;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  active: boolean;
  joinedAt: Date;
}
```

### WeeklyCycle
```typescript
{
  id: string;
  weekNumber: number;
  year: number;
  phase: "BUILDING" | "PREVIEW" | "ACTIVE" | "CLOSED" | "HISTORY";
  generatedAt: Date | null;
  previewAt: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  isLocked: boolean;
}
```

### TreeNode
```typescript
{
  id: string;
  cycleId: string;
  userId: string;
  position: string; // "A", "B", "C", etc.
  parentNodeId: string | null;
  level: number; // 0 = root, 1 = first level, etc.
  user: User;
  parent?: TreeNode;
  children?: TreeNode[];
}
```

### CallEdge
```typescript
{
  id: string;
  cycleId: string;
  callerNodeId: string;
  calleeNodeId: string;
  status: "UNCALLED" | "CALLED" | "ANSWERED" | "NO_ANSWER";
  calledAt: Date | null;
  answeredAt: Date | null;
  retryCount: number;
  callerNode: TreeNode;
  calleeNode: TreeNode;
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid Telegram data"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is configured to allow Telegram Web App origins.

## Security

- All Telegram data is validated using HMAC-SHA256
- Admin endpoints require role verification
- Cron endpoints require secret token
- Users can only update their own call edges
- Cycles are immutable after closing

---

✝ API Documentation for Kidase Call System
