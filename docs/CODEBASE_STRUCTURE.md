# CodeForge Codebase Structure

Is document me final folder strategy define hai.
Coding isi structure ke hisab se hogi.

---

## 1) High-level Layers

1. `Renderer Layer` (React UI): editor, chat panel, controls.
2. `Bridge Layer` (Preload): safe APIs to renderer.
3. `Core Layer` (Electron Main): file IO, AI calls, orchestration.
4. `Domain Layer` (future): planning, diff engine, agent loop.
5. `Infra Layer` (future): embeddings, indexing, test runners.

---

## 2) Target Folder Structure

```text
CodeForge/
  electron/
    main.cjs                 # main process entry
    preload.cjs              # secure bridge
    ipc/
      fileHandlers.cjs       # read/write/list handlers
      aiHandlers.cjs         # ollama handlers
      systemHandlers.cjs     # app/system related handlers
    services/
      ollamaClient.cjs       # HTTP wrapper for ollama
      workspaceGuard.cjs     # path boundary checks
      promptBuilder.cjs      # prompt construction
      diffService.cjs        # diff parse/apply (phase-2)
    utils/
      logger.cjs
      errors.cjs

  src/
    main.jsx                 # renderer entry
    App.jsx                  # layout shell
    index.css
    features/
      editor/
        EditorPanel.jsx
        editorStore.js
      files/
        FilePanel.jsx
        fileStore.js
      ai/
        AIPanel.jsx
        aiStore.js
    shared/
      components/
      hooks/
      styles/
      constants/
    api/
      bridgeClient.js        # calls to window.codeforge

  docs/
    STRICT_ENGINEERING_RULES.md
    CODEBASE_STRUCTURE.md
    ARCHITECTURE_DECISIONS.md  # ADRs in future

  tests/
    unit/
    integration/
    e2e/

  package.json
  vite.config.js
  .gitignore
  README.md
```

---

## 3) Ownership Rules by Layer

1. `src/*` me koi Node-only API use nahi hogi.
2. `electron/*` me UI imports nahi honge.
3. IPC payload contracts stable and versioned hone chahiye.
4. File system writes always `workspaceGuard` pass karegi.

---

## 4) Module Contracts (Initial)

### `bridgeClient`
Responsibilities:
1. renderer calls normalize karna.
2. errors ko user-friendly message dena.

### `ollamaClient`
Responsibilities:
1. model call wrapper.
2. timeout + retry policy.
3. response sanity check.

### `promptBuilder`
Responsibilities:
1. deterministic prompt templates.
2. instruction + code + constraints combine karna.
3. output format strict rakhna.

### `workspaceGuard`
Responsibilities:
1. path traversal block.
2. only workspace-contained paths allow.

---

## 5) Build Roadmap by Structure

### Phase A (current)
1. monolithic `main.cjs` handlers workable state me.

### Phase B
1. split `ipc` handlers into files.
2. split `services` into reusable modules.

### Phase C
1. add diff service.
2. add indexed project context service.

### Phase D
1. add agent planner/executor/verifier loop.
2. add tests coverage.

---

## 6) Coding Entry Sequence (Mandatory)

1. Structure doc approve.
2. Rule file approve.
3. Create folders as per plan.
4. Move existing code into modules.
5. Start feature development.

No feature code before step 1-4 completion.
