# Contributing

## Quick start

This repository is a small static web app. There is no build step.

```bash
npm install
npm test
python3 -m http.server 8080
```

Open `http://localhost:8080` after starting the local server, or open `index.html` directly in a browser for quick manual checks.

## Fastest way to iterate

1. Read `/home/runner/work/CarCostCompare/CarCostCompare/README.md` for product behavior.
2. Run `npm test` before and after changes.
3. Edit only the file that owns the behavior:
   - `/home/runner/work/CarCostCompare/CarCostCompare/calc.js` for cost, tax, financing, and comparison logic
   - `/home/runner/work/CarCostCompare/CarCostCompare/app.js` for DOM updates and user interaction handling
   - `/home/runner/work/CarCostCompare/CarCostCompare/index.html` for structure and form fields
   - `/home/runner/work/CarCostCompare/CarCostCompare/styles.css` for presentation
   - `/home/runner/work/CarCostCompare/CarCostCompare/tests/*.test.js` for regression coverage

## Validation

- Primary automated check: `npm test`
- Manual smoke test: load the app, change vehicle values, and confirm the charts and results table update

## Change guidelines

- Keep the app serverless and dependency-light.
- Prefer small patches over broad refactors.
- If you change behavior, update the matching test or add one in `tests/`.
- If you change the workflow or repository layout, update this file and `README.md`.
