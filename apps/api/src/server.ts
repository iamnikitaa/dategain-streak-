import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  getPreviousDateKey,
  getPuzzleForDate,
  getTodayDateKey,
  GUESS_TOLERANCE,
  isGuessCorrect
} from "./puzzles.js";
import {
  createGuess,
  findGuessForDate,
  findPlayerById,
  updatePlayerStreak,
  upsertPlayer,
  withStore
} from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const playerSchema = z.object({
  username: z.string().trim().min(2).max(24).regex(/^[a-zA-Z0-9_-]+$/)
});

const guessSchema = z.object({
  playerId: z.string().min(1),
  guess: z.number().int().min(0).max(100)
});

async function refreshStaleStreak(playerId: string, lastPlayedDate: string | null) {
  return withStore((data) => {
    const player = findPlayerById(data, playerId);
    if (!player) return null;

    const today = getTodayDateKey();
    const yesterday = getPreviousDateKey(today);

    if (lastPlayedDate && lastPlayedDate !== today && lastPlayedDate !== yesterday) {
      return updatePlayerStreak(player, 0);
    }

    return player;
  });
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/players", async (request, response, next) => {
  try {
    const payload = playerSchema.parse(request.body);
    const username = payload.username.toLowerCase();
    const player = await withStore((data) => upsertPlayer(data, username));
    const currentPlayer = await refreshStaleStreak(player.id, player.lastPlayedDate);

    if (!currentPlayer) {
      response.status(404).json({ message: "Player not found." });
      return;
    }

    response.json({
      playerId: currentPlayer.id,
      username: currentPlayer.username,
      currentStreak: currentPlayer.currentStreak
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/today", async (request, response, next) => {
  try {
    const playerId = z.string().min(1).parse(request.query.playerId);
    const player = await withStore((data) => findPlayerById(data, playerId));

    if (!player) {
      response.status(404).json({ message: "Player not found." });
      return;
    }

    const currentPlayer = await refreshStaleStreak(player.id, player.lastPlayedDate);
    if (!currentPlayer) {
      response.status(404).json({ message: "Player not found." });
      return;
    }

    const date = getTodayDateKey();
    const puzzle = getPuzzleForDate(date);
    const existingGuess = await withStore((data) => findGuessForDate(data, playerId, date));

    response.json({
      date,
      puzzleId: puzzle.id,
      opener: puzzle.opener,
      currentStreak: currentPlayer.currentStreak,
      alreadyGuessed: Boolean(existingGuess),
      tolerance: GUESS_TOLERANCE,
      previousGuess: existingGuess
        ? {
            guess: existingGuess.guess,
            actualSwipeRate: existingGuess.actualSwipeRate,
            correct: existingGuess.correct
          }
        : null
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/guess", async (request, response, next) => {
  try {
    const payload = guessSchema.parse(request.body);
    const today = getTodayDateKey();
    const yesterday = getPreviousDateKey(today);
    const puzzle = getPuzzleForDate(today);

    const player = await withStore((data) => findPlayerById(data, payload.playerId));
    if (!player) {
      response.status(404).json({ message: "Player not found." });
      return;
    }

    const existingGuess = await withStore((data) => findGuessForDate(data, payload.playerId, today));

    if (existingGuess) {
      response.status(409).json({
        message: "You already made today's guess.",
        correct: existingGuess.correct,
        guess: existingGuess.guess,
        actualSwipeRate: existingGuess.actualSwipeRate,
        currentStreak: player.currentStreak
      });
      return;
    }

    const correct = isGuessCorrect(payload.guess, puzzle.swipeRate);
    const continuedYesterday = player.lastPlayedDate === yesterday;
    const nextStreak = correct ? (continuedYesterday ? player.currentStreak + 1 : 1) : 0;

    const updatedPlayer = await withStore((data) => {
      const currentPlayer = findPlayerById(data, payload.playerId);
      if (!currentPlayer) return null;

      createGuess(data, {
        playerId: payload.playerId,
        date: today,
        puzzleId: puzzle.id,
        guess: payload.guess,
        actualSwipeRate: puzzle.swipeRate,
        correct
      });

      return updatePlayerStreak(currentPlayer, nextStreak, today);
    });

    if (!updatedPlayer) {
      response.status(404).json({ message: "Player not found." });
      return;
    }

    response.json({
      correct,
      guess: payload.guess,
      actualSwipeRate: puzzle.swipeRate,
      currentStreak: updatedPlayer.currentStreak,
      tolerance: GUESS_TOLERANCE,
      message: correct
        ? "Close enough. Your streak continues."
        : "Not quite. The streak resets today."
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: "Invalid request.", issues: error.flatten() });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Something went wrong." });
});

app.listen(port, () => {
  console.log(`DateGain Streak API running on http://localhost:${port}`);
});
