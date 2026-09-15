import { Link } from "react-router-dom";
import { useAppState } from "../state/store";

export function HomePage() {
  const { machines } = useAppState();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="smoke-art" aria-hidden="true">
          <span className="smoke smoke-one" />
          <span className="smoke smoke-two" />
          <span className="smoke smoke-three" />
          <span className="art-pin">●</span>
        </div>
        <div className="hero-copy">
          <p className="home-eyebrow">{machines.length} demo locations</p>
          <h1>Find the nearest machine.</h1>
          <p className="home-slogan">By smokers, for smokers.</p>
          <p className="muted">
            A relaxed, community-kept map for when you need a nearby cigarette
            vending machine.
          </p>
        </div>
      </section>

      <section className="hub-actions" aria-label="Quick actions">
        <Link className="hub-action map-action" to="/map">
          <span className="hub-icon" aria-hidden="true">⌖</span>
          <p className="sheet-kicker">Community map</p>
          <h2>Seen something wrong?</h2>
          <p className="muted">
            Add a missing machine or update a pin.
          </p>
          <span className="hub-arrow" aria-hidden="true">← Go to map</span>
        </Link>
        <Link className="hub-action help-action" to="/help">
          <span className="hub-icon" aria-hidden="true">?</span>
          <p className="sheet-kicker">Help & info</p>
          <h2>Not quite sure?</h2>
          <p className="muted">
            Get answers and learn more about the project.
          </p>
          <span className="hub-arrow" aria-hidden="true">Open help →</span>
        </Link>
      </section>

      <Link className="moderator-entry" to="/moderation">
        Open moderator demo <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
