export function HelpPage() {
  return (
    <div className="help-page">
      <header className="page-head">
        <p className="sheet-kicker">Help & information</p>
        <h1>How can we help?</h1>
        <p className="muted">
          Answers about locations, ratings, privacy, and this prototype.
        </p>
      </header>

      <section className="faq-list" aria-label="Frequently asked questions">
        <details>
          <summary>What is Kippe?</summary>
          <p>
            A community map for finding and maintaining cigarette vending
            machine locations. Community ratings help keep pins useful.
          </p>
        </details>
        <details>
          <summary>Why is a location or rating not shown?</summary>
          <p>
            Contributions may be checked before they appear. Validation protects
            the map from accidental or misleading entries and can take time.
          </p>
        </details>
        <details>
          <summary>Why does a downvote need a reason?</summary>
          <p>
            A wrong location is different from a machine that became empty or
            broken months later. The reason helps treat the creator fairly and
            gives moderators a useful signal.
          </p>
        </details>
        <details>
          <summary>Do I need an account?</summary>
          <p>
            This demo uses an anonymous local identity. Ratings are stored only
            on this device and are not sent to a server.
          </p>
        </details>
        <details>
          <summary>Can I help without donating?</summary>
          <p>
            Yes. Checking locations, reporting changes, suggesting improvements,
            and contributing code all improve the community map.
          </p>
        </details>
      </section>

      <section className="contact-card">
        <p className="sheet-kicker">Still need help?</p>
        <h2>Contact the team</h2>
        <p className="muted">
          For questions, corrections, or improvement ideas, use the contact
          channel listed on the official Kippenstummel website.
        </p>
        <a className="ghost link-button" href="mailto:info@mueller-constantin.de">
          Send an email
        </a>
      </section>

      <section className="disclaimer-card">
        <h2>Important information</h2>
        <p>
          For adults aged 18 and over. This service does not sell or advertise
          tobacco products. It provides neutral location information only.
        </p>
        <p>
          This is an unofficial prototype with fictional test data. It is not
          connected to the live Kippenstummel service.
        </p>
      </section>
    </div>
  );
}
