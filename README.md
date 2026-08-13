# DateGain Streak

DateGain Streak is a tiny daily guessing game themed around dating openers. Each day, players see one opener and guess its estimated swipe-right rate out of 100. The backend owns the answer, validates the guess, enforces one guess per day, and stores each player's streak.

## Tech Stack

- React, Vite, and TypeScript for the frontend
- Node.js, Express, and TypeScript for the backend
- Prisma for persistence
- SQLite locally, with a straightforward path to Postgres on Supabase or Neon for deployment

## Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Environment

Copy `apps/api/.env.example` to `apps/api/.env`.

```bash
DATABASE_URL="file:./dev.db"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

For the web app, copy `apps/web/.env.example` to `apps/web/.env`.

```bash
VITE_API_URL="http://localhost:4000"
```
