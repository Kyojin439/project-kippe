import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import machinesSeed from "../data/machines.json";
import usersSeed from "../data/users.json";
import votesSeed from "../data/votes.json";
import {
  type Machine,
  type NegativeReason,
  type User,
  type Vote,
  type VotePolarity,
} from "../domain/karma";

const DEMO_USER_ID = "demo-you";
const STORAGE_KEY = "kippe-prototype-votes-v1";

function loadVotes(): Vote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return votesSeed as Vote[];
    const parsed = JSON.parse(raw) as Vote[];
    if (!Array.isArray(parsed)) return votesSeed as Vote[];
    return parsed;
  } catch {
    return votesSeed as Vote[];
  }
}

interface AppState {
  users: User[];
  machines: Machine[];
  votes: Vote[];
  demoUserId: string;
  applyVote: (input: {
    machineId: string;
    polarity: VotePolarity;
    reason?: NegativeReason;
    note?: string;
  }) => { ok: true } | { ok: false; error: string };
  resetDemo: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const users = usersSeed as User[];
  const machines = machinesSeed as Machine[];
  const [votes, setVotes] = useState<Vote[]>(loadVotes);

  const persist = (next: Vote[]) => {
    setVotes(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota — UI still has in-memory state */
    }
  };

  const applyVote: AppState["applyVote"] = (input) => {
    if (input.polarity === "down" && !input.reason) {
      return { ok: false, error: "Pick a reason before submitting a downvote." };
    }
    const votedAt = new Date().toISOString();
    const existing = votes.findIndex(
      (v) => v.machineId === input.machineId && v.voterId === DEMO_USER_ID,
    );
    const nextVote: Vote = {
      id: `local-${input.machineId}-${DEMO_USER_ID}`,
      machineId: input.machineId,
      voterId: DEMO_USER_ID,
      polarity: input.polarity,
      reason: input.polarity === "down" ? input.reason : undefined,
      note: input.note?.trim() || undefined,
      votedAt,
    };
    const next =
      existing >= 0
        ? votes.map((v, i) => (i === existing ? nextVote : v))
        : [...votes, nextVote];
    persist(next);
    return { ok: true };
  };

  const value = useMemo<AppState>(
    () => ({
      users,
      machines,
      votes,
      demoUserId: DEMO_USER_ID,
      applyVote,
      resetDemo: () => persist(votesSeed as Vote[]),
    }),
    [users, machines, votes],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
