\# Project Brief: Blindfold Chess Trainer — Voice-to-Pages Loop



\*\*First session instruction:\*\* You are the iOS voice interface and the implementer in this project. Ideation happens verbally in the Claude iOS app, and you commit code directly to the GitHub repo via the GitHub connector. Every push to `main` auto-deploys to GitHub Pages via Actions. Before writing any code, walk me through §7 conversationally and get my verbal confirmation on each decision. Then commit this `PROJECT.md`, a minimal `index.html` shell, and `.github/workflows/pages.yml` as the first real commit. That first commit auto-deploying and the URL going live is the handshake that proves the loop works end-to-end.



\*\*Audience:\*\* Claude (Opus 4.7) in the iOS app with voice mode and the GitHub connector. This doc is also my human-readable spec.



\## 1. Goal

Build a web-based blindfold chess trainer for advanced players, and — equally important — establish a voice-first iteration loop where I speak into the iOS Claude app, Claude commits code directly to GitHub, GitHub Pages auto-deploys, and my public URL updates within one loop. No watcher host, no Pi, no custom infrastructure.



\## 2. Acceptance criteria (all must pass)

1\. From the iOS Claude app in voice mode, I can describe a change and see it live at my public URL within \~60 seconds, without typing (beyond launching the session).

2\. Every shipped version is a conventional-commit on GitHub, and I can ask "what did you ship today?" and get a correct list by reading `CHANGELOG.md` via the connector.

3\. No credentials live on my mobile device — the GitHub connector handles auth server-side.

4\. v1 ships with ≥4 blindfold-specific drills (§4), usable on mobile Safari.

5\. Rolling back is a one-sentence verbal command that results in a revert commit.



\## 3. Already done — do not redo

\- GitHub repo exists with Pages enabled on custom domain + HTTPS resolving

\- GitHub connector authorized in the iOS Claude app, scoped to this specific repo

\- `.github/workflows/pages.yml` will be committed as part of deliverable #1 below (not pre-existing)



\## 4. Product spec — the trainer

Static SPA, shipped to GitHub Pages. No backend. Audio-first: drills use Web Speech TTS, optional speech recognition for answers, and a hidden "peek" board for debugging only.



\*\*v1 drills (minimum four):\*\*

\- \*\*Square color\*\* — spoken square name; user answers light/dark

\- \*\*Knight sight\*\* — "shortest knight path X → Y"; user says or taps the sequence

\- \*\*Piece tracking\*\* — short PGN played via TTS; user answers "what's on e5?"

\- \*\*Diagonal sweep\*\* — "name all squares on a1–h8 not blocked by a knight on d4"



\*\*Non-goals for v1:\*\* accounts, multiplayer, cloud stats (local-storage streaks only), engine eval. Audience is rated players — no beginner scaffolding.



\*\*Stack preference:\*\* vanilla HTML/CSS/JS, no build step. If a build genuinely helps later (Vite + Preact), we'll add it deliberately — not by default. Must work offline after first load (simple service worker, deferred to a later deliverable).



\*\*Claude Design:\*\* optional desktop accelerator for v2 polish. v1 is voice-first and intentionally minimal — defer.



\## 5. Workflow — how the loop works



\### 5.1 Ideation and implementation (iPhone, Claude iOS app, voice mode)

Full conversational ideation and implementation happen on the phone. The phone's microphone is the only mic in the system. Per session, you: understand the change verbally, then commit the code directly to `main` via the GitHub connector. One feature = one or more commits, each conventional-style.



\### 5.2 Publishing (GitHub Actions → GitHub Pages)

A workflow at `.github/workflows/pages.yml` deploys `/` (or `/dist` if a build gets added later) to Pages on every push to `main`. Typical end-to-end latency is 20–60 seconds from commit to live URL. No custom host involved.



\### 5.3 Version visibility from mobile

After each shipping commit, append one line to `CHANGELOG.md` in a follow-up commit:

`- YYYY-MM-DD HH:MM  <short-sha>  <slug>  <one-line summary>`



When I ask "what shipped today?" or "what did the last three versions change?", fetch `CHANGELOG.md` via the connector and summarize entries matching the requested window.



\### 5.4 Rollback

Verbal command → revert the most recent site commit via the connector → auto-redeploys → append a CHANGELOG line noting the rollback.



\### 5.5 What's intentionally not here

\- No watcher host, no Raspberry Pi, no polling loop, no Anthropic API billing, no systemd unit. If this setup hits a wall (e.g., connector can't handle a large multi-file refactor, or we need real test runs before shipping), we'll introduce Claude Code on a Pi at that point — not before.



\## 6. Deliverables (in order, as commits to the repo)

1\. \*\*Bootstrap commit\*\*: `PROJECT.md` (this file), minimal `index.html` placeholder, `.github/workflows/pages.yml`, empty `CHANGELOG.md`. Confirms the loop before any product work.

2\. \*\*Design shell\*\*: base layout, typography, dark mode, drill selector UI. No drill logic yet.

3\. \*\*Square-color drill\*\* — end-to-end, TTS wired, tap-to-answer, local-storage streak.

4\. \*\*Knight-sight drill\*\*

5\. \*\*Piece-tracking drill\*\*

6\. \*\*Diagonal-sweep drill\*\*

7\. \*\*Offline cache\*\* — service worker so the app works after first load with no network.



Each deliverable is one spec committed as one or more conventional-commit pushes, culminating in a CHANGELOG entry.



\## 7. Surface these decisions before coding

\- TTS strategy: Web Speech API only (free, varies by device) vs. bundled audio clips for the 64 squares + piece names (consistent, +bundle size). I lean Web Speech for v1.

\- Answer input: voice recognition vs. tap vs. both. Voice recognition in mobile Safari is inconsistent — I lean tap for v1, voice for v2.

\- Drill session shape: fixed 10-question rounds vs. timed 60s sprints vs. user-configurable.

\- Direct-to-`main` vs. `preview` branch + promote. I lean direct for a solo voice loop.

\- Whether the "peek" debug board ships in v1 or stays behind a `?debug=1` query param.

\- Commit granularity: one commit per logical change vs. batching. I lean per logical change so CHANGELOG stays honest.



\## 8. Out of scope

\- Teaching chess fundamentals

\- Accounts, auth, cloud analytics

\- Native app

\- Any credential on the mobile device

\- Any backend service



\## 9. Tone

Experienced engineer. Skip git/Pages/conventional-commit explainers. If something is ambiguous, ask one sharp question instead of guessing. In voice loops, prefer terse confirmations ("shipped, `a1b2c3`, live in \~30s") over prose. When I say "ship it," commit without re-confirming unless there's a real reason to pause.

