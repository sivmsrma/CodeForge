const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const workspaceRoot = process.cwd();
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function resolveWorkspacePath(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath || typeof relativeOrAbsolutePath !== "string") {
    throw new Error("A valid file path is required.");
  }

  const candidate = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(workspaceRoot, relativeOrAbsolutePath);

  const normalizedWorkspace = path.resolve(workspaceRoot) + path.sep;
  const normalizedCandidate = path.resolve(candidate);

  if (
    normalizedCandidate !== path.resolve(workspaceRoot) &&
    !normalizedCandidate.startsWith(normalizedWorkspace)
  ) {
    throw new Error("File path must stay inside the workspace.");
  }

  return normalizedCandidate;
}

function buildPrompt(instruction, code) {
  return [
    "You are an expert software engineer.",
    "Apply the instruction to the code.",
    "Return only the full updated code without markdown fences.",
    "",
    "Instruction:",
    instruction,
    "",
    "Code:",
    code
  ].join("\n");
}

async function askOllama({ instruction, code, model }) {
  if (!instruction || !code) {
    throw new Error("Instruction and code are required.");
  }

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "deepseek-coder:6.7b",
      prompt: buildPrompt(instruction, code),
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const output = (data.response || "").trim();

  if (!output) {
    throw new Error("Ollama returned an empty response.");
  }

  return output;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "CodeForge",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("cf:pick-file", async () => {
    const result = await dialog.showOpenDialog({
      defaultPath: workspaceRoot,
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selected = resolveWorkspacePath(result.filePaths[0]);
    return path.relative(workspaceRoot, selected);
  });

  ipcMain.handle("cf:read-file", async (_event, filePath) => {
    const absolutePath = resolveWorkspacePath(filePath);
    const content = await fs.readFile(absolutePath, "utf-8");
    return content;
  });

  ipcMain.handle("cf:write-file", async (_event, payload) => {
    const { filePath, content } = payload || {};
    const absolutePath = resolveWorkspacePath(filePath);
    await fs.writeFile(absolutePath, content ?? "", "utf-8");
    return { ok: true };
  });

  ipcMain.handle("cf:ask-ai", async (_event, payload) => askOllama(payload || {}));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
