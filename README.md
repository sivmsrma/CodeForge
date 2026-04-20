# CodeForge AI Editor

CodeForge ek local-first AI coding editor hai jo Cursor-type workflow target karta hai:
- local model (Ollama)
- direct file edit
- secure desktop shell (Electron)
- fast UI (React + Monaco)

Is document ka goal: project ko zero se production-style discipline ke saath set up karna.

---

## 1) Project Goals

### Primary goals
1. Internet ke bina local AI coding assistant chalana.
2. File ko direct read/write karna (safe boundaries ke saath).
3. Instruction-based code edits karna (editor ke andar).
4. Future me multi-file agent loop support dena.

### Non-goals (initial phase)
1. Cloud-scale model quality guarantee.
2. Auto-merge without human review.
3. Enterprise telemetry and SaaS auth.

---

## 2) Current Tech Stack (Phase-1 Starter)

1. Electron: desktop app shell + trusted backend process.
2. React + Monaco: coding UI + editor experience.
3. Ollama: local LLM inference.
4. IPC bridge: renderer se backend safely connect.

---

## 3) Hardware + Software Requirements

### Minimum
1. Windows 10/11, Ubuntu, ya macOS.
2. Node.js 20+.
3. Git installed.
4. 16 GB RAM.
5. 10+ GB free disk.

### Recommended
1. 32 GB RAM.
2. Dedicated GPU (8+ GB VRAM).
3. NVMe SSD.

Without GPU bhi chalega, but response slow hoga.

---

## 4) Ollama Complete Setup

### Step 4.1 Install Ollama
1. Official installer se install karo.
2. Verify:

```bash
ollama --version
```

### Step 4.2 Start Ollama service
Most systems me install ke baad service auto-run hoti hai.

Manual start (if needed):

```bash
ollama serve
```

### Step 4.3 Pull coding model
Recommended starter model:

```bash
ollama pull deepseek-coder:6.7b
```

Alternative models:
1. `qwen2.5-coder:7b`
2. `codellama:7b`
3. `mistral:7b`

### Step 4.4 Quick CLI validation

```bash
ollama run deepseek-coder:6.7b
```

Prompt do:
`Write a JavaScript function for email validation.`

### Step 4.5 API validation
PowerShell:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:11434/api/generate" `
  -ContentType "application/json" `
  -Body '{"model":"deepseek-coder:6.7b","prompt":"say hello","stream":false}'
```

Bash:

```bash
curl http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-coder:6.7b","prompt":"say hello","stream":false}'
```

Expected: JSON response with `response` field.

---

## 5) Project Setup (Local)

### Step 5.1 Repo bootstrap
From project root:

```bash
npm install
```

### Step 5.2 Start dev app

```bash
npm run dev
```

Isse:
1. Vite renderer start hota hai (`5173`).
2. Electron app launch hota hai.

### Step 5.3 Use app
1. `Browse` se file pick karo.
2. `Load` se file editor me lao.
3. Instruction likho.
4. `Apply AI Edit` dabao.
5. Output review karke `Save` karo.

---

## 6) Security Model

1. Renderer direct filesystem touch nahi karega.
2. Sare file ops Electron main process se honge.
3. Path workspace root ke andar resolve hoga.
4. IPC channels prefixed (`cf:*`) and explicitly handled honge.
5. No secret key hardcode.

---

## 7) Development Lifecycle (Strict Sequence)

1. `README + rules` finalize.
2. `Architecture + folder structure` lock.
3. `Scaffold + base modules` build.
4. `Feature build` in small vertical slices.
5. `Tests + manual verification`.
6. `Refactor + docs update`.

Rule: structure lock hone se pehle random coding nahi karni.

---

## 8) Planned Architecture (Target)

High-level flow:

1. User instruction
2. Context gather (files + selection + history)
3. Prompt build
4. Ollama call
5. Response parse
6. Diff preview
7. Apply + save

Detailed architecture doc:
- `docs/CODEBASE_STRUCTURE.md`

Engineering discipline doc:
- `docs/STRICT_ENGINEERING_RULES.md`

---

## 9) Commands Cheat Sheet

### Git basics
```bash
git status
git add .
git commit -m "feat: ... "
```

### Run app
```bash
npm run dev
```

### Build renderer
```bash
npm run build
```

### Ollama model run
```bash
ollama run deepseek-coder:6.7b
```

---

## 10) Troubleshooting

### `npm install` fails
1. Internet check.
2. Proxy/VPN disable or configure npm proxy.
3. Retry:
```bash
npm cache clean --force
npm install
```

### Electron opens blank screen
1. Check `npm run dev` output.
2. Confirm port `5173` busy nahi.
3. Ensure `VITE_DEV_SERVER_URL` is passed.

### Ollama not responding
1. Confirm service running.
2. Check:
```bash
curl http://127.0.0.1:11434
```
3. Pull model again if not found.

### AI response empty
1. Prompt too vague ho sakta hai.
2. Model mismatch ho sakta hai.
3. Instruction + code length reduce karke retry.

---

## 11) Phase-wise Build Plan

### Phase 1 (done)
1. Base app scaffold.
2. File load/save.
3. Ollama edit call.

### Phase 2
1. Diff preview mode.
2. Multi-file selector.
3. File tree panel.

### Phase 3
1. Agent loop (plan -> edit -> verify).
2. Terminal integration.
3. Git integration panel.

### Phase 4
1. Test runner feedback loop.
2. Rule-based auto-fixes.
3. Performance and prompt optimization.

---

## 12) Important Constraints

1. Local model quality cloud model se lower ho sakti hai.
2. Very large repos me context management mandatory hoga.
3. GPU ke bina latency high hogi.

---

## 13) Contribution Rule

Before every PR/commit:
1. Rule file follow kiya?
2. DRY violation to nahi?
3. Error handling present?
4. Docs updated?
5. Basic manual test done?

If any answer `No`, commit mat karo.
