<!-- Bootstrap Copilot instructions for CarCostCompare -->
# Copilot Agent Instructions

Purpose
-------
Provide quick, actionable guidance for the Copilot agent to be productive in this repository.

Repository status
-----------------
- Current snapshot: minimal repository (only `LICENSE` present). No README, build files, or docs were found.

Agent workflow
--------------
1. Discover: look for repository metadata and developer docs in this order: `README.md`, `CONTRIBUTING.md`, `docs/**`, `package.json`, `pyproject.toml`, `Makefile`, `.github/workflows/**`.
2. Inventory: collect build/test/run commands from discovered files and prefer linking to those sources rather than copying content here.
3. If no build/test commands are found, ask maintainers: "What commands build and test this project? (e.g., `npm test`, `pytest`, `make test`)".
4. Make changes conservatively: when editing or adding files, explain intent and create small, reviewable patches.

Link, don't embed
-----------------
- Prefer linking to existing documentation and files. If a topic isn't documented, create a short doc and link to authoritative resources.

What the agent should look for first
-----------------------------------
- Top-level README and CONTRIBUTING
- `package.json` (npm scripts)
- `pyproject.toml` / `setup.cfg` (Python build/test hooks)
- `Makefile` or `build.gradle` / `pom.xml` (other build systems)
- `.github/workflows` (CI expectations)

Example prompts to use now
--------------------------
- "Scan the repo and list build/test commands and missing docs."
- "Create a README.md with a minimal project overview and usage examples." 
- "Add a GitHub Actions workflow that runs the project's tests." 
- "Suggest a set of developer 'getting started' steps for this repo." 

ApplyTo suggestions
-------------------
- When the repo grows, split instructions using `applyTo` patterns for: frontend, backend, tests, CI.

Next steps for maintainers
-------------------------
- Add a `README.md` with project overview and include build/test commands.
- If preferred build/test commands exist, update this file to include direct links to those files.

Contact
-------
If anything here is incorrect, update this file or ask in a PR comment.
