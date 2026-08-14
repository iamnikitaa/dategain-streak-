# Dategain Streak

Dategain Streak is a tiny daily guessing game themed around dating openers. Each day, players see one opener and guess its estimated swipe-right rate out of 100. The backend owns the answer, validates the guess, enforces one guess per day, and stores each player's streak.

## Live Links

- GitHub: https://github.com/iamnikitaa/dategain-streak-
- Frontend: https://dategain-streak-web.vercel.app/
- API health check:  https://dategain-streak.onrender.com//api/health

## How It Works

1. A player enters a simple handle.
2. The frontend asks the backend for today's opener.
3. The backend chooses one deterministic daily puzzle from a curated opener list.
4. The player guesses how many people out of 100 would swipe right.
5. The backend checks the guess against the hidden swipe rate.
6. A guess within 5 points is correct.
7. Correct guesses continue the streak. Wrong guesses reset it.
8. Players can only guess once per day.

## Tech Stack

- React, Vite, and TypeScript for the frontend
- Node.js, Express, and TypeScript for the backend
- File-backed JSON persistence for players and guesses
- Render for the API deployment
- Vercel for the frontend deployment

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Run the app:

```bash
npm run dev
```

The frontend runs at:

```txt
http://localhost:5173
```

The API runs at:

```txt
http://localhost:4000
```

## Environment Variables

Backend, `apps/api/.env`:

```bash
PORT=4000
CORS_ORIGIN="http://localhost:5173"
DATA_FILE="./data/streak-store.json"
```

Frontend, `apps/web/.env`:

```bash
VITE_API_URL="http://localhost:4000"
```

## API Routes

```txt
GET /api/health
```

Returns API health.

```txt
POST /api/players
```

Creates or fetches a player by handle.

```txt
GET /api/today?playerId=<playerId>
```

Returns today's opener, current streak, and whether the player already guessed.

```txt
POST /api/guess
```

Checks today's guess, stores the result, and updates the streak.

## Deployment

### Render API

Use these settings:

```txt
Root Directory: apps/api
Build Command: npm install && npm run build
Start Command: npm start
```

Environment variables:

```bash
PORT=10000
CORS_ORIGIN="https://your-vercel-url.vercel.app"
DATA_FILE="./data/streak-store.json"
```

### Vercel Frontend

Use these settings:

```txt
Root Directory: apps/web
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```bash
VITE_API_URL="https://your-render-api-url.onrender.com"
```

## Persistence Note

This prototype uses a file-backed JSON store to keep the implementation small and reviewable. For a production version, this should move to hosted Postgres or a durable key-value store so streaks survive all deployment and hosting lifecycle events.
