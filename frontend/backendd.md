# AyurBot Backend API Reference
## Base URL: http://localhost:3000/api

---

## Auth
POST /api/auth/login
Body: { email, password }
Response: { token, role, user: { id, name, email } }

POST /api/auth/register
Body: { name, email, password, role: 'patient'|'doctor' }

---

## Patients (Doctor-only)
GET    /api/patients               → List all patients
GET    /api/patients/:id           → Get patient detail
PUT    /api/patients/:id           → Update patient
POST   /api/patients               → Add new patient

---

## Sessions / Therapies
GET    /api/sessions               → All sessions (filter by ?patientId=, ?date=)
GET    /api/sessions/:id           → Single session
POST   /api/sessions               → Book new session
PUT    /api/sessions/:id/reschedule → Reschedule
Body: { newDate, newTime, reason }
DELETE /api/sessions/:id           → Cancel

---

## Stats (Doctor Dashboard)
GET /api/stats/overview
Response: { totalPatients, todaySessions, completionRate, activePrograms }

---

## CORS / Auth Middleware
- Add: res.setHeader('Access-Control-Allow-Origin', '*')
- JWT middleware: validate Bearer token on protected routes

---

## Frontend Integration
In index.html, set:
  const API_BASE = 'http://localhost:3000';

Then uncomment the fetch calls in:
  - loginFromBackend()
  - submitReschedule()
  - viewPatient() / editPatient()


  # AyurBot Backend API Reference

**Base URL:** `http://localhost:3000/api`

---

## Authentication

### POST `/auth/login`
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "token": "jwt_token",
  "role": "patient | doctor",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

---

### POST `/auth/register`
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "patient | doctor"
}
```
**Response:**
```json
{
  "token": "jwt_token",
  "user": { "id": "string", "name": "string", "email": "string" }
}
```

---

### POST `/auth/logout`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{ "message": "Logged out successfully" }
```

---

## Patients
> Doctor-only. All routes require `Authorization: Bearer <token>` and `role: doctor`.

### GET `/patients`
**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name |
| `status` | string | `active`, `completing`, `all` |

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "constitution": "Vata-Pitta",
    "program": "21-day Detox",
    "progress": 78,
    "status": "active",
    "nextSession": {
      "date": "2025-09-14",
      "time": "2:30 PM",
      "therapy": "Abhyanga"
    }
  }
]
```

---

### GET `/patients/:id`
**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "constitution": "string",
  "program": "string",
  "progress": 78,
  "status": "active",
  "doctorId": "string",
  "programStartDate": "2025-09-01",
  "programDays": 21
}
```

---

### POST `/patients`
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "constitution": "string",
  "program": "string",
  "doctorId": "string"
}
```
**Response:** Created patient object.

---

### PUT `/patients/:id`
**Body:**
```json
{
  "name": "string",
  "constitution": "string",
  "program": "string",
  "progress": 78,
  "status": "active | completing"
}
```
**Response:** Updated patient object.

---

### DELETE `/patients/:id`
**Response:**
```json
{ "message": "Patient removed successfully" }
```

---

## Sessions / Therapies
> All routes require `Authorization: Bearer <token>`.

### GET `/sessions`
**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `patientId` | string | Filter by patient |
| `doctorId` | string | Filter by doctor |
| `date` | string | Format: `YYYY-MM-DD` |
| `status` | string | `confirmed`, `pending`, `cancelled`, `completed` |

**Response:**
```json
[
  {
    "id": "string",
    "patientId": "string",
    "patientName": "string",
    "doctorId": "string",
    "doctorName": "string",
    "therapyType": "Abhyanga",
    "date": "2025-09-14",
    "time": "2:30 PM",
    "room": "Room 101",
    "status": "confirmed"
  }
]
```

---

### GET `/sessions/:id`
**Response:** Full session object (same shape as above).

---

### POST `/sessions`
**Body:**
```json
{
  "patientId": "string",
  "doctorId": "string",
  "therapyType": "string",
  "date": "YYYY-MM-DD",
  "time": "string",
  "room": "string"
}
```
**Response:** Created session object.

---

### PUT `/sessions/:id/reschedule`
**Body:**
```json
{
  "newDate": "YYYY-MM-DD",
  "newTime": "string",
  "reason": "string"
}
```
**Response:** Updated session object.

---

### PUT `/sessions/:id/status`
**Body:**
```json
{
  "status": "confirmed | pending | cancelled | completed"
}
```
**Response:** Updated session object.

---

### DELETE `/sessions/:id`
**Response:**
```json
{ "message": "Session cancelled successfully" }
```

---

## Stats
> Doctor-only. Requires `Authorization: Bearer <token>` and `role: doctor`.

### GET `/stats/overview`
**Response:**
```json
{
  "totalPatients": 124,
  "todaySessions": 18,
  "completionRate": 94,
  "activePrograms": 45
}
```

---

### GET `/stats/patient/:id`
**Response:**
```json
{
  "detoxProgress": 78,
  "sessionsCompleted": 12,
  "daysRemaining": 9,
  "programDay": 12
}
```

---

## Notifications
> Requires `Authorization: Bearer <token>`.

### GET `/notifications`
**Response:**
```json
[
  {
    "id": "string",
    "message": "string",
    "type": "info | success | warning",
    "read": false,
    "createdAt": "ISO timestamp"
  }
]
```

---

### PUT `/notifications/:id/read`
**Response:**
```json
{ "message": "Marked as read" }
```

---

## Chat (Optional — Server-side AI)
> Use this if you want to proxy Claude API calls through your backend instead of calling from the frontend.

### POST `/chat/message`
**Body:**
```json
{
  "message": "string",
  "role": "patient | doctor",
  "history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ]
}
```
**Response:**
```json
{ "reply": "string" }
```

---

## Data Models

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "password": "bcrypt hashed",
  "role": "patient | doctor",
  "createdAt": "ISO timestamp"
}
```

### Patient
```json
{
  "id": "string",
  "userId": "string",
  "doctorId": "string",
  "constitution": "string",
  "program": "string",
  "progress": 0,
  "status": "active | completing | completed",
  "programStartDate": "YYYY-MM-DD",
  "programDays": 21
}
```

### Session
```json
{
  "id": "string",
  "patientId": "string",
  "doctorId": "string",
  "therapyType": "string",
  "date": "YYYY-MM-DD",
  "time": "string",
  "room": "string",
  "status": "confirmed | pending | cancelled | completed",
  "rescheduleReason": "string | null",
  "createdAt": "ISO timestamp"
}
```

---

## Middleware

### CORS
```js
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})
```

### JWT Auth
```js
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

### Role Guard
```js
const doctorOnly = (req, res, next) => {
  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Forbidden' })
  next()
}
```

---

## Frontend Integration

Set in `index.html`:
```js
const API_BASE = 'http://localhost:3000'
const token = localStorage.getItem('ayur_token')
```

All protected requests:
```js
fetch(`${API_BASE}/api/sessions`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```