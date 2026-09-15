import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  REASON_LABELS,
  type NegativeReason,
  type VotePolarity,
} from "../domain/karma";

const REASONS: NegativeReason[] = [
  "wrong_location",
  "empty",
  "broken",
  "other",
];

interface RateSheetProps {
  machineName: string;
  onCancel: () => void;
  onSubmit: (input: {
    polarity: VotePolarity;
    reason?: NegativeReason;
    note?: string;
  }) => { ok: true } | { ok: false; error: string };
}

export function RateSheet({ machineName, onCancel, onSubmit }: RateSheetProps) {
  const [polarity, setPolarity] = useState<VotePolarity | null>(null);
  const [reason, setReason] = useState<NegativeReason | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!polarity) return false;
    if (polarity === "down" && !reason) return false;
    return true;
  }, [polarity, reason]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!polarity) {
        setError("Choose upvote or downvote.");
        return;
      }
      if (polarity === "down" && !reason) {
        setError("Pick a reason before submitting a downvote.");
        return;
      }
      const result = onSubmit({
        polarity,
        reason: polarity === "down" && reason ? reason : undefined,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
    },
    [polarity, reason, note, onSubmit],
  );

  return (
    <form className="sheet" onSubmit={handleSubmit}>
      <p className="sheet-kicker">Rate this machine</p>
      <h2>{machineName}</h2>
      <p className="muted">
        Downvotes need a reason. Casting a vote does not change your karma
        (±0). The creator is only hit when the reason says the pin was wrong.
      </p>

      <div className="choice-row">
        <button
          type="button"
          className={polarity === "up" ? "choice on good" : "choice"}
          onClick={() => {
            setPolarity("up");
            setReason("");
            setError(null);
          }}
        >
          Upvote
        </button>
        <button
          type="button"
          className={polarity === "down" ? "choice on bad" : "choice"}
          onClick={() => {
            setPolarity("down");
            setError(null);
          }}
        >
          Downvote
        </button>
      </div>

      {polarity === "down" ? (
        <label className="field">
          Reason
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as NegativeReason | "");
              setError(null);
            }}
            required
          >
            <option value="">Select a reason…</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {polarity === "down" ? (
        <label className="field">
          Reviewer note (optional)
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Independent remark for moderators"
          />
        </label>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="sheet-actions">
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={!canSubmit}>
          Submit rating
        </button>
      </div>
    </form>
  );
}
