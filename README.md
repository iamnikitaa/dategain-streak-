# DateGain Streak

DateGain Streak is a tiny daily guessing game themed around dating openers. Each day, players see one opener and guess its estimated swipe-right rate out of 100. The backend owns the answer, validates the guess, enforces one guess per day, and stores each player's streak.

## Tech Stack

- React, Vite, and TypeScript for the frontend
- Node.js, Express, and TypeScript for the backend
- File-backed JSON persistence for players and guesses

## Local Setup

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Environment

Copy `apps/api/.env.example` to `apps/api/.env`.

```bash
PORT=4000
CORS_ORIGIN="http://localhost:5173"
DATA_FILE="./data/streak-store.json"
```

For the web app, copy `apps/web/.env.example` to `apps/web/.env`.

```bash
VITE_API_URL="http://localhost:4000"
```
