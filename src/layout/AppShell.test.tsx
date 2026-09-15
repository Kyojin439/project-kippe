import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

function RouteName() {
  return <span>{useLocation().pathname}</span>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<RouteName />} />
          <Route path="/map" element={<RouteName />} />
          <Route path="/help" element={<RouteName />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function pointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
  clientY: number,
) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerId: { value: 1 },
  });
  element.dispatchEvent(event);
}

describe("AppShell swipe navigation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("moves from the center Home screen to Map on a right swipe", () => {
    renderAt("/");
    const phone = document.querySelector(".phone");
    expect(phone).not.toBeNull();
    const main = document.querySelector(".main");

    act(() => pointer(main!, "pointerdown", 80, 200));
    act(() => pointer(main!, "pointermove", 140, 203));
    expect(main).toHaveStyle({ transform: "translate3d(60px, 0, 0)" });
    act(() => {
      pointer(main!, "pointerup", 180, 205);
      vi.advanceTimersByTime(181);
    });

    expect(screen.getByText("/map")).toBeInTheDocument();
  });

  it("moves from the center Home screen to Help on a left swipe", () => {
    renderAt("/");
    const main = document.querySelector(".main");

    act(() => {
      pointer(main!, "pointerdown", 180, 200);
      pointer(main!, "pointerup", 80, 205);
      vi.advanceTimersByTime(181);
    });

    expect(screen.getByText("/help")).toBeInTheDocument();
  });

  it("opens a navigation link with one tap", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("link", { name: "Map" }));

    expect(screen.getByText("/map")).toBeInTheDocument();
  });
});
