export type Puzzle = {
  id: string;
  opener: string;
  swipeRate: number;
};

export const GUESS_TOLERANCE = 5;

export const puzzles: Puzzle[] = [
  {
    id: "playlist-dealbreaker",
    opener: "Your playlist decides our first date. What song are you opening with?",
    swipeRate: 73
  },
  {
    id: "coffee-walk",
    opener: "Quick vote: coffee date or a walk with no awkward agenda?",
    swipeRate: 66
  },
  {
    id: "two-truths-first-date",
    opener: "Two truths and a lie, but one has to be about your worst first date.",
    swipeRate: 78
  },
  {
    id: "green-flag",
    opener: "What's a tiny green flag that instantly makes someone more attractive?",
    swipeRate: 82
  },
  {
    id: "food-opinion",
    opener: "Settle this for me: fries with mayo, ketchup, or something chaotic?",
    swipeRate: 61
  },
  {
    id: "sunday-plan",
    opener: "You get one perfect Sunday. Are we brunch people, museum people, or nap people?",
    swipeRate: 70
  },
  {
    id: "petty-ick",
    opener: "Give me your most harmless ick. I promise to only judge a little.",
    swipeRate: 64
  },
  {
    id: "travel-chaos",
    opener: "Would you rather miss a flight together or get lost in a new city together?",
    swipeRate: 69
  },
  {
    id: "voice-note",
    opener: "Hot take: voice notes are romantic if the person is funny enough.",
    swipeRate: 58
  },
  {
    id: "first-round",
    opener: "First round is on me if you can recommend a place I haven't tried yet.",
    swipeRate: 76
  }
];

export function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getPreviousDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return getTodayDateKey(date);
}

function dayNumber(dateKey: string) {
  return Math.floor(new Date(`${dateKey}T00:00:00.000Z`).getTime() / 86_400_000);
}

export function getPuzzleForDate(dateKey = getTodayDateKey()) {
  return puzzles[dayNumber(dateKey) % puzzles.length];
}

export function isGuessCorrect(guess: number, swipeRate: number) {
  return Math.abs(guess - swipeRate) <= GUESS_TOLERANCE;
}
