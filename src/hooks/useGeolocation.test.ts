import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "./useGeolocation";

const original = navigator.geolocation;

function stubGeolocation(value: Geolocation | undefined) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  stubGeolocation(original);
});

describe("useGeolocation", () => {
  it("stores the live device position when permission is granted", async () => {
    const clearWatch = vi.fn();
    stubGeolocation({
      watchPosition: (success) => {
        success({
          coords: { latitude: 50.941, longitude: 6.958, accuracy: 16 },
        } as GeolocationPosition);
        return 9;
      },
      clearWatch,
      getCurrentPosition: vi.fn(),
    });

    const { result, unmount } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.position).toEqual({
      lat: 50.941,
      lng: 6.958,
      accuracy: 16,
    });

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(9);
  });

  it("marks permission as denied so the map can keep showing machines", async () => {
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

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.position).toBeNull();
  });

  it("can retry after an unavailable reading", async () => {
    const watchPosition = vi
      .fn()
      .mockImplementationOnce((_success, error) => {
        error?.({
          code: 2,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "unavailable",
        } as GeolocationPositionError);
        return 1;
      })
      .mockImplementationOnce((success) => {
        success({
          coords: { latitude: 50.93, longitude: 6.95, accuracy: 22 },
        } as GeolocationPosition);
        return 2;
      });

    stubGeolocation({
      watchPosition,
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
    });

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("unavailable"));

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.position?.lat).toBe(50.93);
  });
});
