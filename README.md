# PollCraft – Real-time Poll Platform

A full-stack poll platform where users can create polls, share them via public links, collect feedback, and view live analytics powered by WebSockets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT (JSON Web Tokens) |
| State | Zustand |
| Charts | Recharts |
| Container | Docker + Docker Compose |

## Features

- **Authentication** – Register/login with JWT-protected routes
- **Poll Creation** – Multi-question polls with single-option selection
- **Mandatory/Optional Questions** – Per-question validation on both frontend and backend
- **Anonymous & Authenticated Modes** – Creator decides who can respond
- **Expiry System** – Polls auto-close after the set expiry time
- **Public Share Links** – Unique short links for every poll
- **Real-time Updates** – Live response counts and analytics via Socket.io
- **Analytics Dashboard** – Response counts, option breakdowns, pie/bar charts, participation rate
- **Publish Results** – Creator can publish final results; anyone with the link can view them

## Project Structure

```
poll-platform/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # App entry point + auto-migration
│       ├── config/
│       │   ├── database.ts       # PostgreSQL pool
│       │   └── migrate.ts        # Schema migrations
│       ├── controllers/
│       │   ├── authController.ts
│       │   └── pollController.ts
│       ├── middleware/
│       │   ├── auth.ts           # JWT middleware
│       │   ├── errorHandler.ts
│       │   └── validate.ts
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   └── pollRoutes.ts
│       ├── socket/
│       │   └── socketManager.ts  # Socket.io setup
│       └── types/
│           └── index.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx               # Routes
        ├── index.css
        ├── components/
        │   ├── auth/ProtectedRoute.tsx
        │   ├── layout/           # Navbar, Layout
        │   ├── polls/PollCard.tsx
        │   └── ui/               # Button, Input, Card, Badge, Modal
        ├── hooks/
        │   └── useSocket.ts      # Socket.io hooks
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── CreatePollPage.tsx
        │   ├── PublicPollPage.tsx
        │   └── AnalyticsPage.tsx
        ├── services/
        │   ├── api.ts            # Axios instance
        │   └── socket.ts         # Socket.io client
        ├── store/
        │   ├── authStore.ts      # Zustand auth state
        │   └── pollStore.ts      # Zustand poll state
        └── types/
            └── index.ts
```

## Quick Start with Docker

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd poll-platform
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 2. Start all services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend API** on port `5000`
- **Frontend** on port `3000`

### 3. Open the app

```
http://localhost:3000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Polls (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/polls` | Create poll |
| GET | `/api/polls/my` | Get my polls |
| GET | `/api/polls/:id` | Get poll by ID |
| PUT | `/api/polls/:id` | Update poll |
| DELETE | `/api/polls/:id` | Delete poll |
| GET | `/api/polls/:id/analytics` | Get analytics |
| POST | `/api/polls/:id/publish` | Publish results |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls/public/:link` | Get public poll |
| POST | `/api/polls/public/:link/respond` | Submit response |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:poll` | Client → Server | Join poll room |
| `join:analytics` | Client → Server | Join analytics room |
| `response:new` | Server → Client | New response received |
| `analytics:update` | Server → Client | Analytics data updated |
| `poll:published` | Server → Client | Poll results published |

## Database Schema

```
users          → id, email, name, password_hash
polls          → id, creator_id, title, description, is_anonymous, expires_at, is_published, is_active, public_link
questions      → id, poll_id, text, is_mandatory, order_index
options        → id, question_id, text, order_index
responses      → id, poll_id, respondent_id, submitted_at, ip_address
answers        → id, response_id, question_id, option_id
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `polluser` | DB username |
| `POSTGRES_PASSWORD` | `pollpassword` | DB password |
| `POSTGRES_DB` | `polldb` | DB name |
| `JWT_SECRET` | `supersecretjwtkey_changeme` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `VITE_API_URL` | `http://localhost:5000/api` | API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.io URL |

## Development (without Docker)

### Backend
```bash
cd backend
npm install
# Set DATABASE_URL in .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Health Check

```
GET http://localhost:5000/health
```
