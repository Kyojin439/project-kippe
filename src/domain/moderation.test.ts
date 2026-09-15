import { describe, expect, it } from "vitest";
import type { Machine, User, Vote } from "./karma";
import { classifyAll, classifyUser } from "./moderation";

const alex: User = {
  id: "alex",
  displayName: "Alex",
  identityHint: "",
};
const sam: User = {
  id: "sam",
  displayName: "Sam",
  identityHint: "",
};
const jordan: User = {
  id: "jordan",
  displayName: "Jordan",
  identityHint: "",
};

function machine(id: string, creatorId: string, createdAt: string): Machine {
  return {
    id,
    name: id,
    address: "x",
    lat: 0,
    lng: 0,
    createdAt,
    creatorId,
  };
}

describe("classifyUser", () => {
  it("flags many wrong-location reports shortly after create", () => {
    const machines = [
      machine("m1", "alex", "2026-09-13T00:00:00.000Z"),
      machine("m2", "alex", "2026-09-13T00:00:00.000Z"),
    ];
    const votes: Vote[] = [
      {
        id: "1",
        machineId: "m1",
        voterId: "sam",
        polarity: "down",
        reason: "wrong_location",
        votedAt: "2026-09-13T12:00:00.000Z",
      },
      {
        id: "2",
        machineId: "m2",
        voterId: "sam",
        polarity: "down",
        reason: "wrong_location",
        votedAt: "2026-09-14T12:00:00.000Z",
      },
    ];
    expect(classifyUser(alex, machines, votes).label).toBe("flagged");
  });

  it("marks late empty/broken as unremarkable", () => {
    const machines = [machine("m1", "sam", "2025-10-01T00:00:00.000Z")];
    const votes: Vote[] = [
      {
        id: "1",
        machineId: "m1",
        voterId: "alex",
        polarity: "down",
        reason: "empty",
        votedAt: "2026-08-01T00:00:00.000Z",
      },
    ];
    expect(classifyUser(sam, machines, votes).label).toBe("unremarkable");
  });

  it("sends mixed signals to review", () => {
    const machines = [
      machine("m1", "jordan", "2026-09-10T00:00:00.000Z"),
      machine("m2", "jordan", "2025-09-20T00:00:00.000Z"),
    ];
    const votes: Vote[] = [
      {
        id: "1",
        machineId: "m1",
        voterId: "sam",
        polarity: "down",
        reason: "wrong_location",
        votedAt: "2026-09-11T00:00:00.000Z",
      },
      {
        id: "2",
        machineId: "m2",
        voterId: "sam",
        polarity: "down",
        reason: "empty",
        votedAt: "2026-08-01T00:00:00.000Z",
      },
    ];
    expect(classifyUser(jordan, machines, votes).label).toBe("review");
  });
});

describe("classifyAll", () => {
  it("ranks accounts by downvotes in the last 30 days", () => {
    const machines = [
      machine("alex-machine", "alex", "2026-01-01T00:00:00.000Z"),
      machine("sam-machine", "sam", "2026-01-01T00:00:00.000Z"),
    ];
    const votes: Vote[] = [
      {
        id: "alex-recent",
        machineId: "alex-machine",
        voterId: "jordan",
        polarity: "down",
        reason: "wrong_location",
        votedAt: "2026-09-10T00:00:00.000Z",
      },
      {
        id: "sam-old-1",
        machineId: "sam-machine",
        voterId: "alex",
        polarity: "down",
        reason: "empty",
        votedAt: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "sam-old-2",
        machineId: "sam-machine",
        voterId: "jordan",
        polarity: "down",
        reason: "broken",
        votedAt: "2026-06-02T00:00:00.000Z",
      },
    ];

    const ranked = classifyAll(
      [sam, alex],
      machines,
      votes,
      new Date("2026-09-15T00:00:00.000Z"),
    );

    expect(ranked.map((row) => row.user.id)).toEqual(["alex", "sam"]);
    expect(ranked[0]?.recentNegativeCount).toBe(1);
    expect(ranked[1]?.totalNegativeCount).toBe(2);
  });
});
