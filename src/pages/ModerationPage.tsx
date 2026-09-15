import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LABEL_COPY, personalKarma, REASON_LABELS } from "../domain/karma";
import { classifyAll } from "../domain/moderation";
import { useAppState } from "../state/store";

export function ModerationPage() {
  const { users, machines, votes } = useAppState();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const rows = useMemo(
    () =>
      classifyAll(
        users.filter((u) => u.id !== "demo-you"),
        machines,
        votes,
      ),
    [users, machines, votes],
  );
  const [openId, setOpenId] = useState(rows[0]?.user.id ?? "");
  const open = rows.find((r) => r.user.id === openId) ?? rows[0];

  const reports = useMemo(() => {
    if (!open) return [];
    const owned = machines.filter((m) => m.creatorId === open.user.id);
    return votes
      .filter(
        (vote) =>
          vote.polarity === "down" &&
          owned.some((machine) => machine.id === vote.machineId),
      )
      .map((vote) => {
        const machine = owned.find((item) => item.id === vote.machineId);
        return {
          ...vote,
          machineName: machine?.name ?? "Unknown machine",
          reasonLabel: vote.reason
            ? REASON_LABELS[vote.reason]
            : "No reason recorded",
        };
      })
      .sort((a, b) => (a.votedAt < b.votedAt ? 1 : -1));
  }, [open, machines, votes]);

  if (!open) return <p>No creators in the demo set.</p>;

  const karma = personalKarma(open.user.id, machines, votes);
  const displayedReports = detailsOpen ? reports : reports.slice(0, 3);

  return (
    <div className="mod-page">
      <header className="page-head">
        <Link className="back-link" to="/">← Back to app</Link>
        <p className="sheet-kicker">Moderator workspace</p>
        <h1>Accounts needing attention</h1>
      </header>

      <section className="mod-summary" aria-label="Moderation summary">
        <div>
          <strong>{rows.filter((row) => row.recentNegativeCount > 0).length}</strong>
          <span>active accounts</span>
        </div>
        <div>
          <strong>
            {rows.reduce((sum, row) => sum + row.recentNegativeCount, 0)}
          </strong>
          <span>downvotes · 30 days</span>
        </div>
      </section>

      <ul className="mod-list">
        {rows.map((row, index) => (
          <li key={row.user.id}>
            <button
              type="button"
              className={row.user.id === open.user.id ? "mod-row on" : "mod-row"}
              onClick={() => {
                setOpenId(row.user.id);
                setDetailsOpen(false);
              }}
            >
              <span className="rank" aria-label={`Rank ${index + 1}`}>
                {index + 1}
              </span>
              <span className="mod-identity">
                <strong>{row.user.displayName}</strong>
                <small>{row.totalNegativeCount} all-time downvotes</small>
                <small className={`status-label ${row.label}`}>
                  {LABEL_COPY[row.label].title}
                </small>
              </span>
              <span className="recent-count">
                <strong>{row.recentNegativeCount}</strong>
                <small>last 30 days</small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <article className="mod-detail">
        <div className="detail-heading">
          <div>
            <p className="sheet-kicker">Account summary</p>
            <h2>{open.user.displayName}</h2>
          </div>
        </div>
        <section className="account-metrics">
          <div><strong>{karma}</strong><span>personal karma</span></div>
          <div><strong>{open.wrongLocationCount}</strong><span>wrong location</span></div>
          <div><strong>{open.earlyNegativeCount}</strong><span>within 30 days</span></div>
        </section>

        <section className="report-history">
          <h3>{detailsOpen ? "All downvotes" : "Latest downvotes"}</h3>
          <ol className="timeline">
            {displayedReports.map((report) => (
              <li key={report.id} className="down">
                <time dateTime={report.votedAt}>
                  {new Date(report.votedAt).toLocaleString("en-GB")}
                </time>
                <strong>{report.machineName}</strong>
                <span>{report.reasonLabel}</span>
                {report.note ? <blockquote>“{report.note}”</blockquote> : null}
              </li>
            ))}
          </ol>
        </section>

        {reports.length > 3 ? (
          <button
            type="button"
            className="ghost wide report-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((value) => !value)}
          >
            {detailsOpen ? "Show latest 3" : `View all ${reports.length} downvotes`}
            <span aria-hidden="true">{detailsOpen ? "↑" : "↓"}</span>
          </button>
        ) : null}
      </article>
    </div>
  );
}
