import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapPage } from "./MapPage";
import { AppStateProvider } from "../state/store";

vi.mock("leaflet", () => ({
  default: {
    divIcon: (opts: unknown) => opts,
  },
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Circle: () => null,
  useMap: () => ({
    flyTo: vi.fn(),
    getZoom: () => 13,
  }),
}));

const original = navigator.geolocation;

function stubGeolocation(value: Geolocation | undefined) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  stubGeolocation({
    watchPosition: (success) => {
      success({
        coords: { latitude: 50.941, longitude: 6.958, accuracy: 12 },
      } as GeolocationPosition);
      return 3;
    },
    clearWatch: vi.fn(),
    getCurrentPosition: vi.fn(),
  });
});

afterEach(() => {
  stubGeolocation(original);
});

describe("MapPage location", () => {
  it("shows the user's own position on the map", async () => {
    render(
      <AppStateProvider>
        <MapPage />
      </AppStateProvider>,
    );

    expect(
      await screen.findByText("You are here. Only you can see this pin."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "My location" }),
    ).toBeInTheDocument();
  });

  it("keeps machines visible when location permission is denied", async () => {
    stubGeolocation({
      watchPosition: (_success, error) => {
        error?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError);
        return 1;
      },
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
    });

    render(
      <AppStateProvider>
        <MapPage />
      </AppStateProvider>,
    );

    expect(
      await screen.findByText(/nobody else can see it/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("You are here. Only you can see this pin.")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Location blocked" }));
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
