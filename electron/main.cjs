const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

let workspaceRoot = process.cwd();
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

ipcMain.handle("cf:set-workspace", async (_event, folderPath) => {
  if (!folderPath) return { ok: false };
  workspaceRoot = path.resolve(folderPath);
  return { ok: true, workspaceRoot };
});

function resolveWorkspacePath(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath || typeof relativeOrAbsolutePath !== "string") {
    throw new Error("A valid file path is required.");
  }

  // If it's absolute, we allow it (for flexibility with Open Recent/Folder)
  if (path.isAbsolute(relativeOrAbsolutePath)) {
    return path.resolve(relativeOrAbsolutePath);
  }

  // Otherwise, resolve relative to workspace root
  return path.resolve(workspaceRoot, relativeOrAbsolutePath);
}

function resolveTerminalCwd(candidatePath) {
  const rawPath = candidatePath && typeof candidatePath === "string"
    ? candidatePath
    : workspaceRoot;
  return path.resolve(rawPath);
}

function buildPrompt(instruction, code) {
  const hasCode = typeof code === "string" && code.trim().length > 0;
  if (hasCode) {
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

  return [
    "You are an expert coding assistant.",
    "Respond concisely and accurately.",
    "",
    "User request:",
    instruction
  ].join("\n");
}

async function askOllama({ instruction, code, model }) {
  if (!instruction) {
    throw new Error("Instruction is required.");
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
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") continue;
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
  const action = (id) => () => sendMenuAction(win, id);

  const template = [
    {
      label: "File",
      submenu: [
        { label: "New Text File", accelerator: "CmdOrCtrl+N", click: action("file.new") },
        { label: "New Window", accelerator: "CmdOrCtrl+Shift+N", click: action("file.newWindow") },
        { type: "separator" },
        { label: "Open File...", accelerator: "CmdOrCtrl+O", click: action("file.open") },
        { label: "Open Folder...", click: action("file.openFolder") },
        { type: "separator" },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: action("file.save") },
        { label: "Save As...", accelerator: "CmdOrCtrl+Shift+S", click: action("file.saveAs") },
        { label: "Save All", click: action("file.saveAll") },
        { label: "Auto Save", click: action("file.autoSave") },
        { type: "separator" },
        { label: "Close Editor", accelerator: "CmdOrCtrl+W", click: action("file.closeEditor") },
        { label: "Close Window", accelerator: "CmdOrCtrl+Shift+W", click: action("file.closeWindow") },
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
        { label: "Undo", accelerator: "CmdOrCtrl+Z", click: action("edit.undo") },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", click: action("edit.redo") },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", click: action("edit.cut") },
        { label: "Copy", accelerator: "CmdOrCtrl+C", click: action("edit.copy") },
        { label: "Paste", accelerator: "CmdOrCtrl+V", click: action("edit.paste") },
        { label: "Select All", accelerator: "CmdOrCtrl+A", click: action("edit.selectAll") },
        { type: "separator" },
        { label: "Find", accelerator: "CmdOrCtrl+F", click: action("edit.find") },
        { label: "Replace", accelerator: "CmdOrCtrl+H", click: action("edit.replace") },
        { label: "Find in Files", accelerator: "CmdOrCtrl+Shift+F", click: action("edit.findInFiles") },
        { label: "Replace in Files", accelerator: "CmdOrCtrl+Shift+H", click: action("edit.replaceInFiles") },
        { type: "separator" },
        { label: "Toggle Line Comment", accelerator: "CmdOrCtrl+/", click: action("edit.toggleComment") },
        { label: "Format Document", accelerator: "Shift+Alt+F", click: action("edit.formatDocument") }
      ]
    },
    {
      label: "Selection",
      submenu: [
        { label: "Select Line", accelerator: "CmdOrCtrl+L", click: action("selection.selectLine") },
        { label: "Copy Line Up", accelerator: "Shift+Alt+Up", click: action("selection.copyLineUp") },
        { label: "Copy Line Down", accelerator: "Shift+Alt+Down", click: action("selection.copyLineDown") },
        { label: "Move Line Up", accelerator: "Alt+Up", click: action("selection.moveLineUp") },
        { label: "Move Line Down", accelerator: "Alt+Down", click: action("selection.moveLineDown") },
        { type: "separator" },
        { label: "Expand Selection", accelerator: "Shift+Alt+Right", click: action("selection.expand") },
        { label: "Shrink Selection", accelerator: "Shift+Alt+Left", click: action("selection.shrink") }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Command Palette...", accelerator: "CmdOrCtrl+Shift+P", click: action("view.commandPalette") },
        { type: "separator" },
        { label: "Explorer", accelerator: "CmdOrCtrl+Shift+E", click: action("view.openExplorer") },
        { label: "Search", accelerator: "CmdOrCtrl+Shift+F", click: action("view.openSearch") },
        { label: "Source Control", accelerator: "CmdOrCtrl+Shift+G", click: action("view.openSourceControl") },
        { label: "Run and Debug", accelerator: "CmdOrCtrl+Shift+D", click: action("view.openRun") },
        { label: "Extensions", accelerator: "CmdOrCtrl+Shift+X", click: action("view.openExtensions") },
        { type: "separator" },
        { label: "Toggle Primary Side Bar", accelerator: "CmdOrCtrl+B", click: action("view.toggleSidebar") },
        { label: "Toggle Activity Bar", click: action("view.toggleActivityBar") },
        { label: "Toggle Secondary Side Bar", click: action("view.toggleAI") },
        { label: "Toggle Panel", accelerator: "CmdOrCtrl+J", click: action("view.togglePanel") },
        { label: "Toggle Status Bar", click: action("view.toggleStatusBar") },
        { label: "Toggle Word Wrap", accelerator: "Alt+Z", click: action("view.toggleWordWrap") },
        { label: "Toggle Full Screen", accelerator: "F11", click: action("view.toggleFullScreen") },
        { type: "separator" },
        { label: "Toggle Developer Tools", accelerator: "F12", role: "toggleDevTools" }
      ]
    },
    {
      label: "Go",
      submenu: [
        { label: "Back", accelerator: "Alt+Left", click: action("go.back") },
        { label: "Forward", accelerator: "Alt+Right", click: action("go.forward") },
        { type: "separator" },
        { label: "Go to File...", accelerator: "CmdOrCtrl+P", click: action("go.file") },
        { label: "Go to Symbol...", accelerator: "CmdOrCtrl+Shift+O", click: action("go.symbol") },
        { label: "Go to Line...", accelerator: "CmdOrCtrl+G", click: action("go.line") },
        { label: "Go to Definition", accelerator: "F12", click: action("go.definition") },
        { label: "Go to References", accelerator: "Shift+F12", click: action("go.reference") }
      ]
    },
    {
      label: "Run",
      submenu: [
        { label: "Start Debugging", accelerator: "F5", click: action("run.debug") },
        { label: "Start Without Debugging", accelerator: "Ctrl+F5", click: action("run.noDebug") },
        { label: "Toggle Breakpoint", accelerator: "F9", click: action("run.breakpoint") },
        { type: "separator" },
        { label: "Run Task...", click: action("run.task") }
      ]
    },
    {
      label: "Terminal",
      submenu: [
        { label: "New Terminal", accelerator: "Ctrl+Shift+`", click: action("terminal.new") },
        { label: "Split Terminal", accelerator: "Ctrl+Shift+5", click: action("terminal.split") },
        { label: "Kill Active Terminal", accelerator: "Ctrl+Shift+W", click: action("terminal.kill") },
        { label: "Clear Terminal", click: action("terminal.clear") },
        { type: "separator" },
        { label: "Run Task...", click: action("terminal.runTask") },
        { label: "New Terminal at Workspace Root", click: action("terminal.cwdWorkspace") }
      ]
    },
    {
      label: "Help",
      submenu: [
        { label: "Welcome", click: action("help.welcome") },
        { label: "Documentation", click: action("help.documentation") },
        { label: "Keyboard Shortcuts Reference", click: action("help.shortcutReference") },
        { type: "separator" },
        {
          label: "About CodeForge",
          click: async () => {
            await dialog.showMessageBox(win, {
              type: "info",
              title: "About CodeForge",
              message: "CodeForge",
              detail: "VS Code-style shell with Monaco, terminal and local AI integration."
            });
          }
        },
        { label: "Learn More", click: async () => shell.openExternal("https://github.com/sivmsrma/CodeForge") }
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

  ipcMain.handle("cf:pick-folder", async () => {
    const result = await dialog.showOpenDialog({
      defaultPath: workspaceRoot,
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return path.resolve(result.filePaths[0]);
  });

  ipcMain.handle("cf:read-file", async (_event, filePath) => {
    try {
      const absolutePath = resolveWorkspacePath(filePath);
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        return null; // Don't try to read directories as text
      }
      const content = await fs.readFile(absolutePath, "utf-8");
      return content;
    } catch (error) {
      console.warn(`IPC: Failed to read file ${filePath}:`, error.message);
      return null;
    }
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

  ipcMain.handle("cf:search-in-files", async (_event, payload) => {
    const { query, options } = payload || {};
    if (!query) return [];

    const { matchCase, wholeWord, useRegex } = options || {};
    const results = [];
    
    // Helper to search a single file
    const searchFile = async (filePath) => {
      try {
        const absolutePath = resolveWorkspacePath(filePath);
        const content = await fs.readFile(absolutePath, "utf-8");
        
        const lines = content.split(/\r?\n/);
        const fileMatches = [];
        
        let flags = "g";
        if (!matchCase) flags += "i";
        
        let searchPattern = query;
        if (!useRegex) {
          searchPattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        if (wholeWord) {
          searchPattern = `\\b${searchPattern}\\b`;
        }

        const regex = new RegExp(searchPattern, flags);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (regex.test(line)) {
            fileMatches.push({
              lineNumber: i + 1,
              text: line.trim(),
              preview: line
            });
          }
        }

        if (fileMatches.length > 0) {
          return {
            path: filePath,
            name: path.basename(filePath),
            matches: fileMatches
          };
        }
      } catch (e) {
        // Skip files that can't be read
      }
      return null;
    };

    const allFiles = await listWorkspaceFiles(workspaceRoot);
    const filteredFiles = allFiles.filter(f => 
      !f.includes("node_modules/") && 
      !f.includes(".git/") && 
      !f.includes("dist/") && 
      !f.includes("build/")
    );

    // Process in parallel with a limit to avoid system strain
    const concurrency = 20;
    for (let i = 0; i < filteredFiles.length; i += concurrency) {
      const batch = filteredFiles.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(searchFile));
      results.push(...batchResults.filter(Boolean));
      
      // Safety: limit total results for responsiveness
      if (results.length > 1000) break;
    }

    return results;
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

  ipcMain.handle("cf:git-commit", async (_event, message) => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      // First stage all changes if they are not staged
      exec("git add .", { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (addError) => {
        if (addError) {
          resolve({ ok: false, error: addError.message });
          return;
        }
        // Then commit
        const escapedMessage = String(message || "Update").replace(/"/g, '\\"');
        exec(`git commit -m "${escapedMessage}"`, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (commitError, stdout) => {
          if (commitError) {
            resolve({ ok: false, error: commitError.message });
          } else {
            resolve({ ok: true, output: stdout });
          }
        });
      });
    });
  });

  ipcMain.handle("cf:git-log", async () => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      // Get last 20 commits with author and date
      const format = "%h|%s|%an|%ar";
      exec(`git log -n 20 --pretty=format:"${format}"`, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        const logs = String(stdout || "").split(/\r?\n/).filter(Boolean).map(line => {
          const [hash, subject, author, date] = line.split("|");
          return { hash, subject, author, date };
        });
        resolve(logs);
      });
    });
  });

  ipcMain.handle("cf:git-discard", async (_event, filePath) => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec(`git checkout -- "${filePath}"`, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error) => {
        if (error) {
          resolve({ ok: false, error: error.message });
        } else {
          resolve({ ok: true });
        }
      });
    });
  });

  ipcMain.handle("cf:git-add", async (_event, filePath) => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec(`git add "${filePath}"`, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error) => {
        if (error) resolve({ ok: false, error: error.message });
        else resolve({ ok: true });
      });
    });
  });

  ipcMain.handle("cf:git-push", async () => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec("git push", { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout, stderr) => {
        if (error) resolve({ ok: false, error: stderr || error.message });
        else resolve({ ok: true, output: stdout });
      });
    });
  });

  ipcMain.handle("cf:git-pull", async () => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      exec("git pull", { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout, stderr) => {
        if (error) resolve({ ok: false, error: stderr || error.message });
        else resolve({ ok: true, output: stdout });
      });
    });
  });

  ipcMain.handle("cf:git-amend", async (_event, message) => {
    const { exec } = require("child_process");
    return new Promise((resolve) => {
      const msgArg = message ? `-m "${String(message).replace(/"/g, '\\"')}"` : "--no-edit";
      exec(`git commit --amend ${msgArg}`, { cwd: workspaceRoot, encoding: "utf8", windowsHide: true }, (error, stdout) => {
        if (error) resolve({ ok: false, error: error.message });
        else resolve({ ok: true, output: stdout });
      });
    });
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

  ipcMain.handle("cf:new-window", async () => {
    createWindow();
    return { ok: true };
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
