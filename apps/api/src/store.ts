import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type Player = {
  id: string;
  username: string;
  currentStreak: number;
  lastPlayedDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Guess = {
  id: string;
  playerId: string;
  date: string;
  puzzleId: string;
  guess: number;
  actualSwipeRate: number;
  correct: boolean;
  createdAt: string;
};

type StoreData = {
  players: Player[];
  guesses: Guess[];
};

const defaultData: StoreData = {
  players: [],
  guesses: []
};

const dataFile = path.resolve(process.cwd(), process.env.DATA_FILE ?? "./data/streak-store.json");
let writeQueue = Promise.resolve();

async function readStore(): Promise<StoreData> {
  try {
    const contents = await readFile(dataFile, "utf8");
    return JSON.parse(contents) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(defaultData);
    }

    throw error;
  }
}

async function writeStore(data: StoreData) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2));
}

function now() {
  return new Date().toISOString();
}

export async function withStore<T>(operation: (data: StoreData) => T | Promise<T>) {
  const run = writeQueue.then(async () => {
    const data = await readStore();
    const result = await operation(data);
    await writeStore(data);
    return result;
  });

  writeQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}

export function findPlayerById(data: StoreData, playerId: string) {
  return data.players.find((player) => player.id === playerId) ?? null;
}

export function findPlayerByUsername(data: StoreData, username: string) {
  return data.players.find((player) => player.username === username) ?? null;
}

export function upsertPlayer(data: StoreData, username: string) {
  const existingPlayer = findPlayerByUsername(data, username);
  if (existingPlayer) return existingPlayer;

  const timestamp = now();
  const player: Player = {
    id: randomUUID(),
    username,
    currentStreak: 0,
    lastPlayedDate: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  data.players.push(player);
  return player;
}

export function findGuessForDate(data: StoreData, playerId: string, date: string) {
  return data.guesses.find((guess) => guess.playerId === playerId && guess.date === date) ?? null;
}

export function createGuess(
  data: StoreData,
  guess: Omit<Guess, "id" | "createdAt">
) {
  const existingGuess = findGuessForDate(data, guess.playerId, guess.date);
  if (existingGuess) return existingGuess;

  const createdGuess: Guess = {
    id: randomUUID(),
    createdAt: now(),
    ...guess
  };

  data.guesses.push(createdGuess);
  return createdGuess;
}

export function updatePlayerStreak(
  player: Player,
  currentStreak: number,
  lastPlayedDate: string | null = player.lastPlayedDate
) {
  player.currentStreak = currentStreak;
  player.lastPlayedDate = lastPlayedDate;
  player.updatedAt = now();
  return player;
}
