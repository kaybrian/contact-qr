# Contact QR

**One scan, straight into the phone book.**

Contact QR is a small, open-source React app that turns a person's details into a QR code encoded as a **vCard** (or **MECARD**). When someone points their phone camera at the code, the phone recognises the contact and opens its *Add to Contacts* screen — no app, no typing.

Everything runs entirely in the browser. No server, no analytics, no data ever leaves the page.

## Features

- **vCard 3.0 and MECARD** formats — full details, or the smallest possible code
- **Live preview** as a polished business card while you type
- **Adjustable error correction** (L / M / Q / H) with a live encoded-size readout and scannability hint
- **PNG export** — download the QR alone (1024 px) or the whole business card, rendered crisply at 3× on a canvas
- **Raw data inspector** — see exactly what gets encoded
- Fully client-side, keyboard-accessible, responsive down to mobile

## Getting started

Requires [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/kaybrian/contact-qr.git
cd contact-qr
npm install
npm run dev
```

Open http://localhost:5173 and start typing — the card and QR update live.

### Scripts

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot reload     |
| `npm run build`   | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally            |

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev server and builds
- [`qrcode`](https://github.com/soldair/node-qrcode) for QR rendering
- Plain CSS with design tokens — no UI framework

## Project structure

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

## Tips for scannable codes

- Fewer fields and lower error correction (**L**) make a simpler grid that scans reliably even when printed small.
- **MECARD** produces the tightest code, but can't carry a company or job title — use **vCard** when those matter.
- Use full international phone format (e.g. `+250…`) so the saved contact works from any country.
- Keep the code dark-on-white with a clear margin.

## Contributing

Issues and pull requests are welcome! For larger changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo and create a branch
2. `npm install && npm run dev`
3. Make your change, then check that `npm run build` passes
4. Open a pull request

## License

[MIT](LICENSE) — free to use, modify, and distribute.
