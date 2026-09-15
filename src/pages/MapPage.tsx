import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { RateSheet } from "../components/RateSheet";
import {
  REASON_LABELS,
  machineScore,
  personalKarma,
  type Machine,
  type Vote,
} from "../domain/karma";
import { useAppState } from "../state/store";

function scoreColor(score: number): string {
  if (score <= -4) return "#c45c4a";
  if (score < 0) return "#d89a4a";
  if (score === 0) return "#8a8078";
  return "#6aa56a";
}

function pinIcon(score: number) {
  const color = scoreColor(score);
  return L.divIcon({
    className: "pin",
    html: `<span style="background:${color}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function latestStatus(votes: Vote[]): string {
  const lastDown = [...votes]
    .filter((v) => v.polarity === "down" && v.reason)
    .sort((a, b) => (a.votedAt < b.votedAt ? 1 : -1))[0];
  if (!lastDown?.reason) return "No negative reports yet";
  return REASON_LABELS[lastDown.reason];
}

function MachineCard({
  machine,
  votes,
  creatorName,
  creatorKarma,
  onRate,
}: {
  machine: Machine;
  votes: Vote[];
  creatorName: string;
  creatorKarma: number;
  onRate: () => void;
}) {
  const score = machineScore(votes);
  return (
    <div className="machine-card">
      <div className="machine-head">
        <h2>{machine.name}</h2>
        <strong className="score" style={{ color: scoreColor(score) }}>
          {score > 0 ? `+${score}` : score}
        </strong>
      </div>
      <p className="muted">{machine.address}</p>
      <dl className="facts">
        <div>
          <dt>Status</dt>
          <dd>{latestStatus(votes)}</dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{new Date(machine.createdAt).toLocaleDateString("en-GB")}</dd>
        </div>
        <div>
          <dt>Creator</dt>
          <dd>{creatorName} · karma {creatorKarma}</dd>
        </div>
      </dl>
      <button type="button" className="primary wide" onClick={onRate}>
        Rate this machine
      </button>
    </div>
  );
}

export function MapPage() {
  const { machines, votes, users, applyVote } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(
    machines[0]?.id ?? null,
  );
  const [rating, setRating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const selected = machines.find((m) => m.id === selectedId) ?? machines[0];
  const selectedVotes = useMemo(
    () => votes.filter((v) => v.machineId === selected?.id),
    [votes, selected?.id],
  );

  if (!selected) return <p>No machines in the demo set.</p>;

  const creator = users.find((u) => u.id === selected.creatorId);
  const creatorKarma = creator
    ? personalKarma(creator.id, machines, votes)
    : 0;

  return (
    <div className="map-page">
      <MapContainer
        center={[selected.lat, selected.lng]}
        zoom={13}
        className="map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OSM &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Recenter lat={selected.lat} lng={selected.lng} />
        {machines.map((machine) => {
          const score = machineScore(
            votes.filter((v) => v.machineId === machine.id),
          );
          return (
            <Marker
              key={machine.id}
              position={[machine.lat, machine.lng]}
              icon={pinIcon(score)}
              eventHandlers={{
                click: () => {
                  setSelectedId(machine.id);
                  setRating(false);
                  setFlash(null);
                },
              }}
            >
              <Popup>{machine.name}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <section className="dock">
        {flash ? <p className="flash">{flash}</p> : null}
        {rating ? (
          <RateSheet
            machineName={selected.name}
            onCancel={() => setRating(false)}
            onSubmit={(input) => {
              const result = applyVote({ machineId: selected.id, ...input });
              if (result.ok) {
                setRating(false);
                setFlash("Rating saved on this device. Check Moderation.");
              }
              return result;
            }}
          />
        ) : (
          <MachineCard
            machine={selected}
            votes={selectedVotes}
            creatorName={creator?.displayName ?? "Unknown"}
            creatorKarma={creatorKarma}
            onRate={() => {
              setFlash(null);
              setRating(true);
            }}
          />
        )}
      </section>
    </div>
  );
}
