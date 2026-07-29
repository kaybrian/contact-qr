# Contributing to Contact QR

Thanks for taking the time to contribute. This is a small, deliberately lightweight
project — the guidance below is meant to save you a review round-trip, not to add
ceremony.

## Table of contents

- [Ground rules](#ground-rules)
- [Getting set up](#getting-set-up)
- [Before you open a pull request](#before-you-open-a-pull-request)
- [Testing QR changes](#testing-qr-changes)
- [Where things live](#where-things-live)
- [Working with vCard and MECARD](#working-with-vcard-and-mecard)
- [Accessibility](#accessibility)
- [Commits and pull requests](#commits-and-pull-requests)
- [Reporting bugs](#reporting-bugs)

## Ground rules

Two constraints define this project. A pull request that breaks either will not be
merged, however good the feature is.

**1. Everything runs in the browser.** No server, no analytics, no telemetry, no
error reporting, no CDN fonts, no external requests of any kind. Contact details are
personal data and the app's promise is that they never leave the page. If your
feature seems to need a network call, open an issue first — there is usually a
client-side way to do it.

**2. No new runtime dependencies without discussion.** The app ships `react`,
`react-dom` and `qrcode`, and that is deliberate. Dev dependencies are an easier
conversation. If you think a runtime dependency is genuinely warranted, make the case
in an issue before writing the code.

Beyond that: be kind in review, assume good faith, and remember that the maintainer
is doing this in their spare time.

## Getting set up

**Node `^20.19` or `>=22.12`** is required — this is what `vite` and `rolldown`
declare in their `engines` field. Node 18 will appear to install but emits
`EBADENGINE` warnings and is not supported. If you use `nvm`:

```bash
nvm use          # reads .nvmrc
```

Then:

```bash
git clone https://github.com/<your-username>/contact-qr.git
cd contact-qr
npm install
npm run dev
```

The dev server starts on <http://localhost:5173>. The card and QR update live as you
type.

### Scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload                     |
| `npm run typecheck` | Type-check only, no build output                    |
| `npm run build`     | Type-check and build for production (`dist/`)       |
| `npm run preview`   | Serve the production build locally                  |

## Before you open a pull request

There is **no automated test suite**, so the checks below are the whole safety net.
Please actually run them.

1. `npm run build` passes with no errors
2. If you touched anything that affects the encoded payload or the rendered code,
   you have **scanned it with a real phone** — see below
3. No new runtime dependencies, no network calls
4. The app still works at mobile widths and via keyboard alone

CI runs `npm run build` on every pull request, but it cannot scan a QR code for you.

## Testing QR changes

This is the part that is easy to get wrong, because the preview can look perfect
while the output is unusable.

**Scan with a real phone camera.** Not an online decoder, not the preview pane.
Real-world scanning depends on camera autofocus, screen glare, and the phone's own
QR pipeline, none of which a desktop decoder reproduces.

**Test iOS and Android.** Their vCard parsers genuinely disagree. A card that imports
cleanly on iOS can silently drop fields on Android, and vice versa. If you only have
one platform, say so in the PR — that's useful information, not a failing.

**Check what actually landed in the contact.** Scanning successfully is not the same
as importing correctly. Open the saved contact and confirm each field is populated
and in the right slot.

**Watch the encoded size.** The byte readout in the UI is there for a reason. Larger
payloads mean a denser grid, which scans less reliably — especially in print. As a
rule of thumb, a module should be at least ~0.4 mm when printed; below that, scan
reliability falls off sharply regardless of error-correction level.

**Test at low error correction too.** `L` is the most fragile setting and the first
place a marginal change will break.

## Where things live

```
src/
├── App.tsx                 # State + layout
├── types.ts                # Contact model, formats, sample data
├── lib/
│   ├── encoders.ts         # vCard / MECARD builders and escaping
│   └── download.ts         # PNG export (QR + business card canvas)
└── components/
    ├── ContactForm.tsx     # The details form
    ├── PreviewCard.tsx     # Live business-card preview
    ├── QRCanvas.tsx        # Canvas QR renderer
    └── Controls.tsx        # Format, error correction, tips
```

Rules of thumb:

- **Adding or changing a contact field?** `types.ts` first (the `Contact` interface,
  `emptyContact`, and `sampleContact` all need it), then `encoders.ts` for both
  formats, then `ContactForm.tsx`, then `PreviewCard.tsx` and `download.ts` if it
  should appear on the card.
- **Encoding logic belongs in `lib/`**, not in components. Components should stay
  presentational.
- **`download.ts` draws to a raw canvas**, so it does not share styling with the DOM
  preview. If you change the preview's appearance, check whether the exported PNG
  needs the same change — they will drift otherwise.

## Working with vCard and MECARD

Adding a field means handling both formats, and they are not equivalent.

- **vCard 3.0** carries the full model. Values must be escaped — see `escVCard` in
  `encoders.ts`, which handles `\`, newlines, `,` and `;`.
- **MECARD** is much smaller but far more limited. It has **no field for
  organisation or job title**, and its escaping rules differ (`escMecard`). If your
  new field has no MECARD equivalent, that is fine — omit it, and note the gap in
  your PR so the UI can mention it.

Prefer full international phone format (`+250…`) in any sample or placeholder data,
so saved contacts work when dialled from another country.

## Accessibility

The README claims the app is keyboard-accessible and responsive down to mobile.
That's a maintained invariant, not an aspiration.

- Every control must be reachable and operable by keyboard
- Form inputs need real labels
- Anything conveyed by colour needs a non-colour cue as well
- Errors should be announced — see the existing `role="alert"` in `QRCanvas.tsx`

## Commits and pull requests

Commit messages in this repo use the **imperative mood**, no trailing period:

```
Add halftone QR renderer
Fix MECARD escaping for semicolons
```

For pull requests:

- **One concern per PR.** A focused diff gets reviewed; a large mixed one stalls.
- **Open an issue first for anything substantial.** Small fixes — typos, obvious
  bugs, doc corrections — can go straight to a PR.
- Describe what you changed and, more usefully, **how you verified it**. "Scanned on
  iPhone 14 and Pixel 7, contact imported with all fields" is worth more than a
  screenshot of the preview.
- Screenshots or a short clip help a lot for UI changes.

## Reporting bugs

Scan failures are almost always device-specific, so please include:

- Phone model and OS version
- Which app you scanned with (built-in camera, Google Lens, a dedicated scanner…)
- Format (vCard or MECARD) and error-correction level
- The encoded byte count from the UI
- Whether the code scanned but imported wrongly, or failed to scan at all
- A screenshot of the generated code, if you can share one

Please avoid putting real personal contact details in an issue — the sample contact
or made-up data reproduces almost everything.

---

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
