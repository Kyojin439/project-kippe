import { useCallback, useEffect, useState } from "react";

export type GeoPosition = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type GeoStatus =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable";

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!geo) {
      setStatus("unavailable");
      return;
    }

    setStatus((current) => (current === "ready" ? current : "locating"));

    const watchId = geo.watchPosition(
      (next) => {
        setPosition({
          lat: next.coords.latitude,
          lng: next.coords.longitude,
          accuracy: next.coords.accuracy,
        });
        setStatus("ready");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          return;
        }
        setStatus("unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 12_000,
      },
    );

    return () => geo.clearWatch(watchId);
  }, [attempt]);

  return { position, status, refresh };
}
