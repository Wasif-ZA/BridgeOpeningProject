# Bridge operator console (ui/)

Next.js 15 operator console and `/api/cmd` proxy for the Bridge Opening Project.
See the repo root `README.md` for the full picture.

```bash
npm ci
cp .env.example .env.local   # set ESP32_BASE_URL, or skip and use Mock mode
npm run dev                  # http://localhost:3000
npm run lint
npm test                     # needs Node 22.18+
npm run build
```

- `src/app/page.tsx`: overview page.
- `src/app/control/page.tsx`: control panel (Mock toggle in the header works with no hardware).
- `src/app/api/cmd/route.ts`: validates `{ op: "0".."9" }` and forwards it to `${ESP32_BASE_URL}/cmd`.
- `tests/cmd-route.test.mjs`: proxy tests using Node's test runner.
