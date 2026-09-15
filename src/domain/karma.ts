export const REGISTER_KARMA = 5;
export const CAST_VOTE_KARMA = 0;
export const WEAR_DAYS = 90;
export const FULL_HIT = -2;
export const REDUCED_HIT = -0.5;
export const UPVOTE_MACHINE = 1;
export const DOWNVOTE_MACHINE = -1;
export const MACHINE_SCORE_MIN = -10;
export const MACHINE_SCORE_MAX = 10;
export const EARLY_WINDOW_DAYS = 30;
export const FLAGGED_WRONG_LOCATION_MIN = 2;
export const FLAGGED_EARLY_NEGATIVES_MIN = 3;

export type NegativeReason =
  | "wrong_location"
  | "empty"
  | "broken"
  | "other";

export type VotePolarity = "up" | "down";

export type ModerationLabel = "flagged" | "unremarkable" | "review";

export interface User {
  id: string;
  displayName: string;
  identityHint: string;
}

export interface Machine {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  creatorId: string;
}

export interface Vote {
  id: string;
  machineId: string;
  voterId: string;
  polarity: VotePolarity;
  reason?: NegativeReason;
  note?: string;
  votedAt: string;
}

export const REASON_LABELS: Record<NegativeReason, string> = {
  wrong_location: "Wrong location",
  empty: "Machine empty",
  broken: "Machine broken",
  other: "Other",
};

export const LABEL_COPY: Record<
  ModerationLabel,
  { title: string; hint: string }
> = {
  flagged: {
    title: "Flagged",
    hint: "Many negatives soon after the pin — looks like a bad entry, not wear.",
  },
  unremarkable: {
    title: "Unremarkable",
    hint: "Negatives are empty/broken and arrived late — typical wear.",
  },
  review: {
    title: "Review",
    hint: "Mixed signals. Check reviewer notes before changing karma.",
  },
};

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

/** Exact 90th day counts as wear (older than 90 days). */
export function isWearPeriod(createdAt: string, votedAt: string): boolean {
  return daysBetween(createdAt, votedAt) >= WEAR_DAYS;
}

export function creatorHitForNegative(
  reason: NegativeReason,
  createdAt: string,
  votedAt: string,
): number {
  if (reason === "wrong_location") return FULL_HIT;
  const wear = isWearPeriod(createdAt, votedAt);
  if (reason === "empty" || reason === "broken" || reason === "other") {
    return wear ? 0 : REDUCED_HIT;
  }
  return 0;
}

export function clampMachineScore(value: number): number {
  return Math.max(MACHINE_SCORE_MIN, Math.min(MACHINE_SCORE_MAX, value));
}

export function machineScore(votes: Vote[]): number {
  const raw = votes.reduce((sum, vote) => {
    return sum + (vote.polarity === "up" ? UPVOTE_MACHINE : DOWNVOTE_MACHINE);
  }, 0);
  return clampMachineScore(raw);
}

export function personalKarma(
  userId: string,
  machines: Machine[],
  votes: Vote[],
): number {
  const created = machines.filter((m) => m.creatorId === userId);
  let score = created.length * REGISTER_KARMA;

  for (const vote of votes) {
    if (vote.voterId === userId) {
      score += CAST_VOTE_KARMA;
      continue;
    }
    if (vote.polarity !== "down") continue;
    const machine = machines.find((m) => m.id === vote.machineId);
    if (!machine || machine.creatorId !== userId || !vote.reason) continue;
    score += creatorHitForNegative(vote.reason, machine.createdAt, vote.votedAt);
  }

  return score;
}

export interface KarmaEvent {
  id: string;
  delta: number;
  text: string;
  at: string;
}

export function personalKarmaEvents(
  userId: string,
  machines: Machine[],
  votes: Vote[],
): KarmaEvent[] {
  const events: KarmaEvent[] = [];

  for (const machine of machines.filter((m) => m.creatorId === userId)) {
    events.push({
      id: `reg-${machine.id}`,
      delta: REGISTER_KARMA,
      text: `You registered ${machine.name}.`,
      at: machine.createdAt,
    });
  }

  for (const vote of votes) {
    if (vote.voterId === userId) {
      events.push({
        id: `cast-${vote.id}`,
        delta: CAST_VOTE_KARMA,
        text:
          vote.polarity === "down"
            ? `You gave a machine a downvote${vote.reason ? ` (${REASON_LABELS[vote.reason]})` : ""}.`
            : "You gave a machine an upvote.",
        at: vote.votedAt,
      });
      continue;
    }
    if (vote.polarity !== "down" || !vote.reason) continue;
    const machine = machines.find((m) => m.id === vote.machineId);
    if (!machine || machine.creatorId !== userId) continue;
    const delta = creatorHitForNegative(
      vote.reason,
      machine.createdAt,
      vote.votedAt,
    );
    events.push({
      id: `recv-${vote.id}`,
      delta,
      text: `You received a downvote (${REASON_LABELS[vote.reason]}) for ${machine.name}.`,
      at: vote.votedAt,
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}
