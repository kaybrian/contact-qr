export function HowTo() {
  return (
    <div className="howto">
      <h2>How to use it</h2>
      <p>
        <b>Test it now:</b> open your phone's camera and point it at the code
        above. iPhone and most Android phones show an "Add Contact" banner
        instantly. (Some older Androids need a QR-reader app or Google Lens.)
      </p>
      <p>
        <b>Keep the code small &amp; scannable:</b> fewer fields and lower error
        correction (<span className="kbd">L</span>) make a simpler grid that
        scans reliably even when printed small. <b>MECARD</b> makes the tightest
        code but can't carry company or job title — use <b>vCard</b> when those
        matter. Always keep it dark-on-white with a clear margin.
      </p>
      <p>
        <b>Phone numbers:</b> use full international format (e.g.{" "}
        <span className="kbd">+250…</span>) so the saved contact works when
        someone calls from another country.
      </p>
    </div>
  );
}
