import { describe, expect, it } from "vitest";
import {
  FULL_HIT,
  REDUCED_HIT,
  REGISTER_KARMA,
  WEAR_DAYS,
  clampMachineScore,
  creatorHitForNegative,
  isWearPeriod,
  machineScore,
  personalKarma,
  type Machine,
  type Vote,
} from "./karma";

const young = "2026-09-10T00:00:00.000Z";
const old = "2026-01-01T00:00:00.000Z";
const now = "2026-09-15T00:00:00.000Z";
const day90 = "2026-04-03T00:00:00.000Z";

describe("wear threshold", () => {
  it("treats the 90th day as wear", () => {
    const created = "2026-06-17T00:00:00.000Z";
    const voted = "2026-09-15T00:00:00.000Z";
    expect(isWearPeriod(created, voted)).toBe(true);
    expect(WEAR_DAYS).toBe(90);
  });
});

describe("creatorHitForNegative", () => {
  it("always applies a full hit for wrong location", () => {
    expect(creatorHitForNegative("wrong_location", young, now)).toBe(FULL_HIT);
    expect(creatorHitForNegative("wrong_location", old, now)).toBe(FULL_HIT);
  });

  it("reduces empty/broken on young pins and zeroes them after 90 days", () => {
    expect(creatorHitForNegative("empty", young, now)).toBe(REDUCED_HIT);
    expect(creatorHitForNegative("broken", young, now)).toBe(REDUCED_HIT);
    expect(creatorHitForNegative("empty", old, now)).toBe(0);
    expect(creatorHitForNegative("broken", old, now)).toBe(0);
    expect(creatorHitForNegative("other", old, now)).toBe(0);
  });

  it("treats exactly 90 days as wear", () => {
    expect(creatorHitForNegative("empty", day90, "2026-07-02T00:00:00.000Z")).toBe(
      0,
    );
  });
});

describe("scores", () => {
  it("clamps machine score to -10..+10", () => {
    expect(clampMachineScore(40)).toBe(10);
    expect(clampMachineScore(-40)).toBe(-10);
  });

  it("sums votes then clamps", () => {
    const votes = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      machineId: "m",
      voterId: "u",
      polarity: "down" as const,
      votedAt: now,
    }));
    expect(machineScore(votes)).toBe(-10);
  });
});

describe("personalKarma", () => {
  const machines: Machine[] = [
    {
      id: "m1",
      name: "A",
      address: "x",
      lat: 0,
      lng: 0,
      createdAt: young,
      creatorId: "alex",
    },
  ];

  it("adds +5 per registration and 0 for casting a vote", () => {
    const votes: Vote[] = [
      {
        id: "v1",
        machineId: "m1",
        voterId: "alex",
        polarity: "down",
        reason: "wrong_location",
        votedAt: now,
      },
    ];
    expect(personalKarma("alex", machines, votes)).toBe(REGISTER_KARMA);
  });

  it("applies received downvotes using reason and age", () => {
    const votes: Vote[] = [
      {
        id: "v1",
        machineId: "m1",
        voterId: "sam",
        polarity: "down",
        reason: "wrong_location",
        votedAt: now,
      },
    ];
    expect(personalKarma("alex", machines, votes)).toBe(
      REGISTER_KARMA + FULL_HIT,
    );
  });
});
