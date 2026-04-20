# CodeForge Strict Engineering Rules

Is file ka purpose: coding start hone se pehle team discipline lock karna.
Ye rules mandatory hain.

---

## 1) Core Principles (Non-negotiable)

1. DRY: same logic do jagah repeat nahi hoga.
2. KISS: simplest working solution pe focus.
3. YAGNI: jo feature abhi required nahi, abhi build nahi.
4. SOLID (applicable modules me): maintainable design.
5. Single Responsibility: har module ka clear kaam.
6. Fail-safe by default: errors silently ignore nahi honge.

---

## 2) Architecture Rules

1. Renderer direct `fs` ya shell execute nahi karega.
2. All privileged actions Electron main process se honge.
3. Preload bridge me only explicit whitelisted APIs expose hongi.
4. IPC channels namespaced honi chahiye (`cf:*`).
5. App workspace boundary ke bahar file write allowed nahi.

---

## 3) Code Quality Rules

1. Functions 40 lines se badi ho to split karo.
2. Deep nesting avoid karo (max 3 nested levels target).
3. Magic numbers avoid karo, named constants use karo.
4. All async calls me proper `try/catch` hona chahiye.
5. Error message actionable honi chahiye.
6. Dead code and commented-out code commit nahi hoga.

---

## 4) Naming Conventions

1. Variables/functions: `camelCase`.
2. React components: `PascalCase`.
3. Constants: `UPPER_SNAKE_CASE`.
4. IPC channels: lowercase + colon prefix (`cf:read-file`).
5. File names: clear intent based naming.

---

## 5) Prompt and AI Rules

1. Prompt me task, constraints, and output format clearly define karo.
2. AI response ko blindly file pe write mat karo.
3. Possible ho to diff preview mandatory karo.
4. Unsafe instruction (delete all, wipe repo) block karo.
5. Large file edits chunked approach se karo.

---

## 6) Testing Rules

1. New feature ke saath minimum happy-path manual test mandatory.
2. Bug fix ke saath regression test case add karo.
3. Parse/transform logic ke unit tests likho.
4. Critical path (file read/write, ai edit) smoke test every release.

---

## 7) Git Workflow Rules

1. Direct `main/master` pe coding avoid karo.
2. Branch format: `codex/<feature-name>`.
3. Small commits with clear intent.
4. Commit message format:
   - `feat: ...`
   - `fix: ...`
   - `refactor: ...`
   - `docs: ...`
5. PR before merge (self-review mandatory).

---

## 8) Security Rules

1. API keys and secrets repo me commit nahi honge.
2. `.env` style files tracked nahi honi chahiye.
3. Any path from UI must be validated before IO.
4. Command execution user consent and audit log ke bina nahi.
5. External URLs allowlist ke through hi call hon.

---

## 9) Performance Rules

1. Large files open/edit operations non-blocking honi chahiye.
2. Avoid full project scans on every keystroke.
3. Debounce AI/autocomplete triggers.
4. Long-running operation ka UI status mandatory.

---

## 10) Documentation Rules

1. Behavior change = README/docs update.
2. New module = brief architecture note.
3. Non-obvious code = short meaningful comments.
4. Every milestone ke baad changelog entry.

---

## 11) Minute-by-Minute Development Protocol

Har feature implementation se pehle:

1. 00-05 min: requirement read + scope lock.
2. 05-10 min: existing files impact mapping.
3. 10-15 min: design note + API/contract decision.
4. 15-35 min: implementation slice-1 (minimum working).
5. 35-45 min: verification (manual + quick tests).
6. 45-55 min: refactor for DRY/KISS compliance.
7. 55-60 min: docs + commit preparation.

Rule: agar 60 min me clarity break ho, continue coding nahi, pehle design reset.

---

## 12) Strict No-Do List

1. Copy-paste duplicate logic.
2. Giant god files without modular split.
3. Silent catches (`catch {}`).
4. Hardcoded absolute user-specific paths.
5. Unreviewed AI output auto-commit.

---

## 13) Release Gate Checklist

Release tabhi valid hogi jab:
1. Core flow works: load -> ai edit -> save.
2. Workspace boundary protection passes.
3. Crash-free startup.
4. Docs updated.
5. Rules violations none.
