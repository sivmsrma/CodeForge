const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("codeforge", {
  pickFile: () => ipcRenderer.invoke("cf:pick-file"),
  readFile: (filePath) => ipcRenderer.invoke("cf:read-file", filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("cf:write-file", { filePath, content }),
  listFiles: () => ipcRenderer.invoke("cf:list-files"),
  createFolder: (folderPath) => ipcRenderer.invoke("cf:create-folder", folderPath),
  renamePath: (oldPath, newPath) =>
    ipcRenderer.invoke("cf:rename-path", { oldPath, newPath }),
  deletePath: (targetPath) => ipcRenderer.invoke("cf:delete-path", targetPath),
  revealInExplorer: (targetPath) => ipcRenderer.invoke("cf:reveal-in-explorer", targetPath),
  resolveDirectory: (cwd, target) =>
    ipcRenderer.invoke("cf:resolve-directory", { cwd, target }),
  saveFileAs: (content, defaultPath) =>
    ipcRenderer.invoke("cf:save-file-as", { content, defaultPath }),
  askAI: (payload) => ipcRenderer.invoke("cf:ask-ai", payload),
  gitStatus: () => ipcRenderer.invoke("cf:git-status"),
  gitInfo: () => ipcRenderer.invoke("cf:git-info"),
  executeCommand: (command, cwd) => ipcRenderer.invoke("cf:execute-command", { command, cwd }),
  windowAction: (action) => ipcRenderer.invoke("cf:window-action", action),
  onMenuAction: (callback) => {
    const wrapped = (_event, action) => callback(action);
    ipcRenderer.on("cf:menu-action", wrapped);
    return () => ipcRenderer.removeListener("cf:menu-action", wrapped);
  },
  onWindowMaximized: (callback) => {
    const wrapped = (_event, isMaximized) => callback(Boolean(isMaximized));
    ipcRenderer.on("cf:window-maximized", wrapped);
    return () => ipcRenderer.removeListener("cf:window-maximized", wrapped);
  }
});
