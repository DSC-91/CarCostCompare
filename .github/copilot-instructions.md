<!-- Bootstrap Copilot instructions for CarCostCompare -->
# Copilot Agent Instructions

Purpose
-------
Provide quick, actionable guidance for the Copilot agent to be productive in this repository.

Repository status
-----------------
- Current snapshot: static HTML/CSS/JS app with top-level sources (`index.html`, `app.js`, `calc.js`, `styles.css`) and Jest tests in `tests/`.
- Primary docs live in `/home/runner/work/CarCostCompare/CarCostCompare/README.md` and `/home/runner/work/CarCostCompare/CarCostCompare/CONTRIBUTING.md`.

Agent workflow
--------------
1. Read `README.md` first for product context and command references.
2. Read `CONTRIBUTING.md` next for setup, validation, and file ownership guidance.
3. Check `package.json` for the current automated validation command.
4. Make changes conservatively: prefer the smallest edit in the file that owns the behavior.
5. Run `npm test` before finalizing changes.

Link, don't embed
-----------------
- Prefer linking to existing documentation and files. If a topic isn't documented, create a short doc and link to authoritative resources.

What the agent should look for first
-----------------------------------
- Top-level README and CONTRIBUTING
- `package.json` (npm scripts)
- `tests/*.test.js` (behavior coverage)
- Top-level app files: `index.html`, `app.js`, `calc.js`, `styles.css`

Example prompts to use now
--------------------------
- "Scan the repo and list build/test commands and missing docs."
- "Update the cost calculation logic in `calc.js` and adjust tests."
- "Fix a UI interaction bug in `app.js` and validate with `npm test`."
- "Improve contributor docs if setup or workflow information becomes stale."

ApplyTo suggestions
-------------------
- If repo-specific instructions grow, split them by `calc.js`, `app.js`, tests, and docs.

Next steps for maintainers
-------------------------
- Keep `README.md` and `CONTRIBUTING.md` aligned with the real workflow.
- Update this file whenever the test command, file layout, or contributor expectations change.

Contact
-------
If anything here is incorrect, update this file or ask in a PR comment.
