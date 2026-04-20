const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("codeforge", {
  pickFile: () => ipcRenderer.invoke("cf:pick-file"),
  readFile: (filePath) => ipcRenderer.invoke("cf:read-file", filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("cf:write-file", { filePath, content }),
  askAI: (payload) => ipcRenderer.invoke("cf:ask-ai", payload)
});
