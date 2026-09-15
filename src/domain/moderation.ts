import {
  EARLY_WINDOW_DAYS,
  FLAGGED_EARLY_NEGATIVES_MIN,
  FLAGGED_WRONG_LOCATION_MIN,
  WEAR_DAYS,
  daysBetween,
  type Machine,
  type ModerationLabel,
  type User,
  type Vote,
} from "./karma";

export interface UserModeration {
  user: User;
  label: ModerationLabel;
  totalNegativeCount: number;
  recentNegativeCount: number;
  wrongLocationCount: number;
  earlyNegativeCount: number;
  lateWearCount: number;
  otherNotes: string[];
}

export function classifyUser(
  user: User,
  machines: Machine[],
  votes: Vote[],
  now = new Date(),
): UserModeration {
  const owned = machines.filter((m) => m.creatorId === user.id);
  const incoming = votes.filter((v) =>
    owned.some((m) => m.id === v.machineId && v.polarity === "down"),
  );

  let wrongLocationCount = 0;
  let earlyNegativeCount = 0;
  let lateWearCount = 0;
  let recentNegativeCount = 0;
  const otherNotes: string[] = [];

  for (const vote of incoming) {
    const machine = owned.find((m) => m.id === vote.machineId);
    if (!machine) continue;
    const age = daysBetween(machine.createdAt, vote.votedAt);
    const reportAge = daysBetween(vote.votedAt, now.toISOString());
    if (reportAge >= 0 && reportAge <= 30) recentNegativeCount += 1;
    if (vote.reason === "wrong_location") wrongLocationCount += 1;
    if (age < EARLY_WINDOW_DAYS) earlyNegativeCount += 1;
    if (
      age >= WEAR_DAYS &&
      (vote.reason === "empty" || vote.reason === "broken")
    ) {
      lateWearCount += 1;
    }
    if (vote.reason === "other" && vote.note?.trim()) {
      otherNotes.push(vote.note.trim());
    }
  }

  let label: ModerationLabel = "review";
  if (
    wrongLocationCount >= FLAGGED_WRONG_LOCATION_MIN ||
    earlyNegativeCount >= FLAGGED_EARLY_NEGATIVES_MIN
  ) {
    label = "flagged";
  } else if (
    incoming.length > 0 &&
    wrongLocationCount === 0 &&
    earlyNegativeCount === 0 &&
    lateWearCount === incoming.length
  ) {
    label = "unremarkable";
  } else if (incoming.length === 0) {
    label = "unremarkable";
  }

  return {
    user,
    label,
    totalNegativeCount: incoming.length,
    recentNegativeCount,
    wrongLocationCount,
    earlyNegativeCount,
    lateWearCount,
    otherNotes,
  };
}

export function classifyAll(
  users: User[],
  machines: Machine[],
  votes: Vote[],
  now = new Date(),
): UserModeration[] {
  return users
    .map((user) => classifyUser(user, machines, votes, now))
    .sort((a, b) => {
      if (b.recentNegativeCount !== a.recentNegativeCount) {
        return b.recentNegativeCount - a.recentNegativeCount;
      }
      return b.totalNegativeCount - a.totalNegativeCount;
    });
}
