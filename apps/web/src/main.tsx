import React from "react";
import ReactDOM from "react-dom/client";
import { Flame, Heart, Lock, Send, Sparkles, UserRound } from "lucide-react";
import "./styles.css";

type Player = {
  playerId: string;
  username: string;
  currentStreak: number;
};

type PreviousGuess = {
  guess: number;
  actualSwipeRate: number;
  correct: boolean;
};

type TodayPuzzle = {
  date: string;
  puzzleId: string;
  opener: string;
  currentStreak: number;
  alreadyGuessed: boolean;
  tolerance: number;
  previousGuess: PreviousGuess | null;
};

type GuessResult = {
  correct: boolean;
  guess: number;
  actualSwipeRate: number;
  currentStreak: number;
  tolerance: number;
  message: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const STORAGE_KEY = "dategain-streak-player";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data as T;
}

function App() {
  const [player, setPlayer] = React.useState<Player | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Player) : null;
  });
  const [username, setUsername] = React.useState("");
  const [today, setToday] = React.useState<TodayPuzzle | null>(null);
  const [guess, setGuess] = React.useState("");
  const [result, setResult] = React.useState<GuessResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!player) return;

    setLoading(true);
    setError("");

    request<TodayPuzzle>(`/api/today?playerId=${player.playerId}`)
      .then((data) => {
        setToday(data);
        setResult(
          data.previousGuess
            ? {
                ...data.previousGuess,
                currentStreak: data.currentStreak,
                tolerance: data.tolerance,
                message: data.previousGuess.correct
                  ? "Close enough. Your streak continues."
                  : "Not quite. The streak resets today."
              }
            : null
        );
      })
      .catch((caught: Error) => {
        localStorage.removeItem(STORAGE_KEY);
        setPlayer(null);
        setError(caught.message);
      })
      .finally(() => setLoading(false));
  }, [player]);

  async function handlePlayerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newPlayer = await request<Player>("/api/players", {
        method: "POST",
        body: JSON.stringify({ username })
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
      setPlayer(newPlayer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create player.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) return;

    setLoading(true);
    setError("");

    try {
      const data = await request<GuessResult>("/api/guess", {
        method: "POST",
        body: JSON.stringify({ playerId: player.playerId, guess: Number(guess) })
      });

      setResult(data);
      setToday((current) => (current ? { ...current, currentStreak: data.currentStreak, alreadyGuessed: true } : current));
      setPlayer((current) => {
        if (!current) return current;
        const updated = { ...current, currentStreak: data.currentStreak };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit guess.");
    } finally {
      setLoading(false);
    }
  }

  function resetPlayer() {
    localStorage.removeItem(STORAGE_KEY);
    setPlayer(null);
    setToday(null);
    setResult(null);
    setGuess("");
    setUsername("");
  }

  return (
    <main className="app-shell">
      <section className="game-panel">
        <div className="brand-row">
          <div className="brand-mark">
            <Heart aria-hidden="true" size={22} />
          </div>
          <div>
            <p className="eyebrow">DateGain Streak</p>
            <h1>Forecast today's opener.</h1>
          </div>
        </div>

        {!player ? (
          <form className="entry-form" onSubmit={handlePlayerSubmit}>
            <label htmlFor="username">Choose a player name</label>
            <div className="input-row">
              <UserRound aria-hidden="true" size={19} />
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={2}
                maxLength={24}
                pattern="[a-zA-Z0-9_-]+"
                placeholder="nikhil"
                required
              />
            </div>
            <button disabled={loading} type="submit">
              <Send aria-hidden="true" size={18} />
              Start playing
            </button>
            <p className="helper">Letters, numbers, underscores, and hyphens only.</p>
          </form>
        ) : (
          <div className="game-stack">
            <div className="status-bar">
              <div>
                <span className="label">Player</span>
                <strong>{player.username}</strong>
              </div>
              <div>
                <span className="label">Current streak</span>
                <strong className="streak">
                  <Flame aria-hidden="true" size={18} />
                  {today?.currentStreak ?? player.currentStreak}
                </strong>
              </div>
            </div>

            <article className="opener-card">
              <div className="date-line">{today?.date ?? "Loading today"}</div>
              <p>{loading && !today ? "Finding today's opener..." : today?.opener}</p>
            </article>

            {result ? (
              <ResultCard result={result} />
            ) : (
              <form className="guess-form" onSubmit={handleGuessSubmit}>
                <label htmlFor="guess">How many out of 100 would swipe right?</label>
                <div className="guess-row">
                  <input
                    id="guess"
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="68"
                    required
                  />
                  <button disabled={loading || !today} type="submit">
                    <Send aria-hidden="true" size={18} />
                    Submit
                  </button>
                </div>
                <p className="helper">One guess per day. Within {today?.tolerance ?? 5} points counts.</p>
              </form>
            )}

            {today?.alreadyGuessed ? (
              <div className="locked-note">
                <Lock aria-hidden="true" size={17} />
                Today's guess is locked. Come back tomorrow for a new opener.
              </div>
            ) : null}

            <button className="text-button" type="button" onClick={resetPlayer}>
              Switch player
            </button>
          </div>
        )}

        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}

function ResultCard({ result }: { result: GuessResult }) {
  return (
    <div className={result.correct ? "result-card correct" : "result-card wrong"}>
      <div className="result-icon">
        <Sparkles aria-hidden="true" size={20} />
      </div>
      <div>
        <span className="label">{result.correct ? "Nice read" : "Missed it"}</span>
        <h2>{result.message}</h2>
        <p>
          You guessed {result.guess}. The opener's swipe rate was {result.actualSwipeRate}. Your streak is now{" "}
          {result.currentStreak}.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
