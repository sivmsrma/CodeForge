const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("codeforge", {
  pickFile: () => ipcRenderer.invoke("cf:pick-file"),
  pickFolder: () => ipcRenderer.invoke("cf:pick-folder"),
  setWorkspace: (folderPath) => ipcRenderer.invoke("cf:set-workspace", folderPath),
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
  gitCommit: (message) => ipcRenderer.invoke("cf:git-commit", message),
  gitLog: () => ipcRenderer.invoke("cf:git-log"),
  gitDiscard: (filePath) => ipcRenderer.invoke("cf:git-discard", filePath),
  gitAdd: (filePath) => ipcRenderer.invoke("cf:git-add", filePath),
  gitPush: () => ipcRenderer.invoke("cf:git-push"),
  gitPull: () => ipcRenderer.invoke("cf:git-pull"),
  gitAmend: (message) => ipcRenderer.invoke("cf:git-amend", message),
  searchInFiles: (query, options) => ipcRenderer.invoke("cf:search-in-files", { query, options }),
  executeCommand: (command, cwd) => ipcRenderer.invoke("cf:execute-command", { command, cwd }),
  windowAction: (action) => ipcRenderer.invoke("cf:window-action", action),
  newWindow: () => ipcRenderer.invoke("cf:new-window"),
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
