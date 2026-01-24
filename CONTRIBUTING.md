# Contributing Guide

Thanks for contributing to the Bridge Opening Project!

## 1) Local setup
```bash
cd ui
npm install
cp .env.example .env.local
npm run dev
```

## 2) Branch naming
Use short, descriptive branch names:
- `feat/control-status-panel`
- `fix/api-timeout-error`
- `docs/readme-architecture`

## 3) Commit message format
Keep commits focused and readable:
- `feat: add control panel heartbeat badge`
- `fix: handle missing ESP32_BASE_URL`
- `docs: document bring-up steps`

## 4) Pull requests
Before opening a PR:
```bash
cd ui
npm run lint
npm run test
npm run build
```

Then open a PR with:
- what changed,
- why it changed,
- how it was tested,
- screenshots for UI changes.

## 5) Expectations
- Keep changes scoped and intentional.
- Prefer deleting dead code over commenting it out.
- Update documentation when behavior or setup changes.
