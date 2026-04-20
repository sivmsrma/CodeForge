const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
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

function resolveTerminalCwd(candidatePath) {
  const rawPath = candidatePath && typeof candidatePath === "string"
    ? candidatePath
    : workspaceRoot;
  return path.resolve(rawPath);
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

async function listWorkspaceFiles(currentDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listWorkspaceFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(path.relative(workspaceRoot, fullPath).replaceAll("\\", "/"));
    }
  }
  return files;
}

function sendMenuAction(win, action) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("cf:menu-action", action);
}

function createMenu(win) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => sendMenuAction(win, "file.new")
        },
        {
          label: "Open File...",
          accelerator: "CmdOrCtrl+O",
          click: () => sendMenuAction(win, "file.open")
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => sendMenuAction(win, "file.save")
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => sendMenuAction(win, "file.saveAs")
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => app.quit()
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", click: () => sendMenuAction(win, "edit.undo") },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", click: () => sendMenuAction(win, "edit.redo") },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", click: () => sendMenuAction(win, "edit.cut") },
        { label: "Copy", accelerator: "CmdOrCtrl+C", click: () => sendMenuAction(win, "edit.copy") },
        { label: "Paste", accelerator: "CmdOrCtrl+V", click: () => sendMenuAction(win, "edit.paste") },
        { label: "Select All", accelerator: "CmdOrCtrl+A", click: () => sendMenuAction(win, "edit.selectAll") }
      ]
    },
    {
      label: "Selection",
      submenu: [
        { label: "Copy Line Up", accelerator: "Shift+Alt+Up", click: () => sendMenuAction(win, "selection.copyLineUp") },
        { label: "Copy Line Down", accelerator: "Shift+Alt+Down", click: () => sendMenuAction(win, "selection.copyLineDown") },
        { label: "Expand Selection", accelerator: "Shift+Alt+Right", click: () => sendMenuAction(win, "selection.expand") },
        { label: "Shrink Selection", accelerator: "Shift+Alt+Left", click: () => sendMenuAction(win, "selection.shrink") }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "Force Reload", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { label: "Toggle Developer Tools", accelerator: "F12", role: "toggleDevTools" },
        { label: "Toggle Full Screen", accelerator: "F11", click: () => sendMenuAction(win, "view.toggleFullScreen") },
        { type: "separator" },
        {
          label: "Toggle AI Panel",
          accelerator: "CmdOrCtrl+J",
          click: () => sendMenuAction(win, "view.toggleAI")
        },
        {
          label: "Toggle File Explorer",
          accelerator: "CmdOrCtrl+B",
          click: () => sendMenuAction(win, "view.toggleSidebar")
        },
        {
          label: "Toggle Terminal",
          accelerator: "Ctrl+`",
          click: () => sendMenuAction(win, "view.toggleTerminal")
        }
      ]
    },
    {
      label: "Go",
      submenu: [
        { label: "Back", accelerator: "Alt+Left", click: () => sendMenuAction(win, "go.back") },
        { label: "Forward", accelerator: "Alt+Right", click: () => sendMenuAction(win, "go.forward") },
        { label: "Go to File...", accelerator: "CmdOrCtrl+P", click: () => sendMenuAction(win, "go.file") },
        { label: "Go to Symbol...", accelerator: "CmdOrCtrl+Shift+O", click: () => sendMenuAction(win, "go.symbol") }
      ]
    },
    {
      label: "Run",
      submenu: [
        { label: "Start Debugging", accelerator: "F5", click: () => sendMenuAction(win, "run.debug") },
        { label: "Start Without Debugging", accelerator: "Ctrl+F5", click: () => sendMenuAction(win, "run.noDebug") },
        { label: "Toggle Breakpoint", accelerator: "F9", click: () => sendMenuAction(win, "run.breakpoint") }
      ]
    },
    {
      label: "Terminal",
      submenu: [
        { label: "New Terminal", accelerator: "Ctrl+Shift+`", click: () => sendMenuAction(win, "terminal.new") },
        { label: "Run Task", click: () => sendMenuAction(win, "terminal.runTask") },
        { label: "Clear Terminal", click: () => sendMenuAction(win, "terminal.clear") }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About CodeForge",
          click: async () => {
            await dialog.showMessageBox(win, {
              type: "info",
              title: "About CodeForge",
              message: "CodeForge",
              detail: "Cursor style AI code editor powered by Electron and React."
            });
          }
        },
        {
          label: "Learn More",
          click: async () => shell.openExternal("https://github.com/sivmsrma/CodeForge")
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "CodeForge",
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(createMenu(win));
  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.on("maximize", () => {
    if (!win.isDestroyed()) win.webContents.send("cf:window-maximized", true);
  });
  win.on("unmaximize", () => {
    if (!win.isDestroyed()) win.webContents.send("cf:window-maximized", false);
  });
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

  ipcMain.handle("cf:list-files", async () => {
    const files = await listWorkspaceFiles(workspaceRoot);
    return files.sort((a, b) => a.localeCompare(b));
  });

  ipcMain.handle("cf:create-folder", async (_event, folderPath) => {
    const absolutePath = resolveWorkspacePath(folderPath);
    await fs.mkdir(absolutePath, { recursive: true });
    return { ok: true };
  });

  ipcMain.handle("cf:rename-path", async (_event, payload) => {
    const { oldPath, newPath } = payload || {};
    const oldAbsolutePath = resolveWorkspacePath(oldPath);
    const newAbsolutePath = resolveWorkspacePath(newPath);
    await fs.rename(oldAbsolutePath, newAbsolutePath);
    return { ok: true };
  });

  ipcMain.handle("cf:delete-path", async (_event, targetPath) => {
    const absolutePath = resolveWorkspacePath(targetPath);
    await fs.rm(absolutePath, { recursive: true, force: true });
    return { ok: true };
  });

  ipcMain.handle("cf:reveal-in-explorer", async (_event, targetPath) => {
    const absolutePath = resolveWorkspacePath(targetPath);
    shell.showItemInFolder(absolutePath);
    return { ok: true };
  });
  
  ipcMain.handle("cf:save-file-as", async (_event, payload) => {
    const { content, defaultPath } = payload || {};
    const result = await dialog.showSaveDialog({
      defaultPath: defaultPath || path.join(workspaceRoot, "untitled.txt"),
      title: "Save File As"
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    const absolutePath = resolveWorkspacePath(result.filePath);
    await fs.writeFile(absolutePath, content ?? "", "utf-8");
    return path.relative(workspaceRoot, absolutePath);
  });

  ipcMain.handle("cf:ask-ai", async (_event, payload) => askOllama(payload || {}));
  
  ipcMain.handle("cf:resolve-directory", async (_event, payload) => {
    const { cwd, target } = payload || {};
    const baseCwd = resolveTerminalCwd(cwd);
    const resolved = path.resolve(
      baseCwd,
      target && target.trim() ? target.trim() : "."
    );
    const stats = await fs.stat(resolved);
    if (!stats.isDirectory()) {
      throw new Error("Target path is not a directory.");
    }
    return resolved;
  });

  ipcMain.handle("cf:execute-command", async (_event, payload) => {
    const { exec } = require("child_process");
    const command = typeof payload === "string" ? payload : payload?.command;
    const cwd = typeof payload === "string" ? workspaceRoot : payload?.cwd || workspaceRoot;
    const terminalCwd = resolveTerminalCwd(cwd);
    const escapedCommand = String(command || "").replace(/"/g, '`"');
    
    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -Command "${escapedCommand}"`, {
        cwd: terminalCwd,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      }, (error, stdout, stderr) => {
        const out = (stdout || "").trimEnd();
        const err = (stderr || "").trimEnd();
        if (error) {
          const exit = typeof error.code === "number" ? `\n[exit code: ${error.code}]` : "";
          resolve([out, err, `Error: ${error.message}${exit}`].filter(Boolean).join("\n"));
          return;
        }
        resolve([out, err].filter(Boolean).join("\n"));
      });
    });
  });

  ipcMain.handle("cf:git-status", async () => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec("git status --porcelain", { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout) => {
        if (error) {
          resolve({});
          return;
        }
        const map = {};
        const lines = String(stdout || "").split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          // format: XY path  OR  ?? path
          const code = line.slice(0, 2);
          const filePath = line.slice(3).trim().replaceAll("\\", "/");
          if (!filePath) continue;
          if (code === "??") {
            map[filePath] = "U";
          } else if (code.includes("M")) {
            map[filePath] = "M";
          } else if (code.includes("A")) {
            map[filePath] = "A";
          } else if (code.includes("D")) {
            map[filePath] = "D";
          } else {
            map[filePath] = code.trim() || "M";
          }
        }
        resolve(map);
      });
    });
  });

  ipcMain.handle("cf:git-info", async () => {
    const { exec } = require("child_process");
    const run = (cmd) => new Promise((resolve) => {
      exec(cmd, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout) => {
        if (error) resolve(null);
        else resolve(String(stdout || "").trim());
      });
    });

    const branch = (await run("git rev-parse --abbrev-ref HEAD")) || "";
    const dirtyList = (await run("git diff --name-only")) || "";
    const isDirty = Boolean(dirtyList.trim());
    return { branch, isDirty };
  });

  ipcMain.handle("cf:window-action", async (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return { ok: false };

    if (action === "minimize") {
      win.minimize();
      return { ok: true };
    }
    if (action === "maximize-toggle") {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      return { ok: true, isMaximized: win.isMaximized() };
    }
    if (action === "close") {
      win.close();
      return { ok: true };
    }
    return { ok: false };
  });

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
