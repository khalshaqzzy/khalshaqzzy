# Deep Space GitHub Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub profile README with a projectless Deep Space Technical Dossier identity for Muhammad Khalfani Shaquille Indrajaya.

**Architecture:** The profile uses one Markdown document as the public GitHub surface plus local SVG assets for the visual identity, systems map, live telemetry, and contribution tiles. A scheduled GitHub Action runs a dependency-free Node script to refresh aggregate public GitHub API data without listing repository names.

**Tech Stack:** GitHub Markdown, GitHub-safe HTML, SVG, Node.js 20, GitHub Actions, GitHub REST API, skillicons.dev, shields.io, github-readme-activity-graph.

---

### Task 1: Profile Identity Asset

**Files:**
- Create: `assets/deep-space-dossier.svg`
- Create: `assets/systems-map.svg`
- Create: `assets/github-telemetry.svg`
- Create: `assets/contribution-tiles.svg`

- [ ] **Step 1: Create the SVG banner**

Create a 1400x520 SVG with near-black background, thin orbital geometry, star coordinate details, and the text "DEEP SPACE TECHNICAL DOSSIER". Include the name, role line, education metadata, and a right-side capability telemetry panel. Use only inline SVG primitives and text so GitHub can render it.

- [ ] **Step 2: Create the systems map SVG**

Create a second SVG component that maps interface, orchestration, retrieval, service, data, cloud, and observability layers as a technical star-chart.

- [ ] **Step 3: Generate the telemetry SVG**

Run `node scripts/update-profile-telemetry.mjs` to fetch public GitHub data, update the telemetry SVG, update the contribution tile SVG, and replace the telemetry block inside `README.md`.

- [ ] **Step 4: Inspect the SVG text**

Run: `Select-String -Path assets/deep-space-dossier.svg,assets/systems-map.svg,assets/github-telemetry.svg,assets/contribution-tiles.svg -Pattern "DEEP SPACE|Muhammad|Geospatial|Grand Finalist|Product-Minded"`

Expected: Matches for allowed identity text only; no matches for removed concepts except if explicitly searching a removed word returns nothing.

### Task 2: README Structure

**Files:**
- Create: `README.md`

- [ ] **Step 1: Add hero and metadata**

Add the local SVG at the top, followed by compact contact links and a systems thesis.

- [ ] **Step 2: Add architecture and capability sections**

Add architecture layer tables, skill icon strips, custom AI capability capsules, and engineering modes without named project references.

- [ ] **Step 3: Add recognition and telemetry**

Add the two approved recognitions and GitHub telemetry cards using the `khalshaqzzy` username.

- [ ] **Step 4: Add contact footer**

Add email, LinkedIn, and GitHub links.

### Task 3: Verification

**Files:**
- Check: `README.md`
- Check: `assets/deep-space-dossier.svg`
- Check: `assets/systems-map.svg`
- Check: `assets/github-telemetry.svg`
- Check: `assets/contribution-tiles.svg`
- Check: `.github/workflows/update-profile-telemetry.yml`
- Check: `scripts/update-profile-telemetry.mjs`

- [ ] **Step 1: Search for removed content**

Run: `Select-String -Path README.md,assets/deep-space-dossier.svg -Pattern "Zipo|CLIMB|CJ Laundry|geospatial|Product-Minded|customer portal|admin tools|Grand Finalist|developer tooling"`

Expected: No matches.

- [ ] **Step 2: Confirm expected content**

Run: `Select-String -Path README.md,assets/deep-space-dossier.svg -Pattern "Systems Architecture|Most Innovative Use of SEA-LION Models|1st Place Software Development|skillicons.dev|github-profile-summary-cards"`

Expected: Matches for all expected profile concepts and external README services.

- [ ] **Step 3: Check Git status**

Run: `git status --short`

Expected: README, SVG assets, design spec, and plan appear as untracked files.
