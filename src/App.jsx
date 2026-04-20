import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

const DEFAULT_CODE = `function add(a, b) {
  return a + b;
}
`;

function App() {
  const [filePath, setFilePath] = useState("");
  const [instruction, setInstruction] = useState("Add input validation.");
  const [model, setModel] = useState("deepseek-coder:6.7b");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [status, setStatus] = useState("Ready");
  const bridgeReady = useMemo(() => Boolean(window?.codeforge), []);

  async function handlePickFile() {
    if (!bridgeReady) return;
    const selected = await window.codeforge.pickFile();
    if (selected) {
      setFilePath(selected);
      setStatus(`Selected ${selected}`);
    }
  }

  async function handleLoad() {
    if (!bridgeReady || !filePath.trim()) return;
    try {
      setStatus("Loading file...");
      const content = await window.codeforge.readFile(filePath.trim());
      setCode(content);
      setStatus("File loaded");
    } catch (error) {
      setStatus(`Load failed: ${error.message}`);
    }
  }

  async function handleSave() {
    if (!bridgeReady || !filePath.trim()) return;
    try {
      setStatus("Saving file...");
      await window.codeforge.writeFile(filePath.trim(), code);
      setStatus("File saved");
    } catch (error) {
      setStatus(`Save failed: ${error.message}`);
    }
  }

  async function handleAIEdit() {
    if (!bridgeReady || !instruction.trim()) return;
    try {
      setStatus("Asking Ollama...");
      const updatedCode = await window.codeforge.askAI({
        instruction: instruction.trim(),
        code,
        model: model.trim()
      });
      setCode(updatedCode);
      setStatus("AI edit applied to editor");
    } catch (error) {
      setStatus(`AI failed: ${error.message}`);
    }
  }

  return (
    <div className="app">
      <aside className="panel">
        <h1>CodeForge</h1>
        <p className="muted">Local AI code editor starter (Electron + Ollama)</p>

        <label>File Path (relative to workspace)</label>
        <div className="row">
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="src/example.js"
          />
          <button onClick={handlePickFile}>Browse</button>
        </div>

        <div className="row">
          <button onClick={handleLoad}>Load</button>
          <button onClick={handleSave}>Save</button>
        </div>

        <label>Model</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="deepseek-coder:6.7b"
        />

        <label>Instruction</label>
        <textarea
          rows={7}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Refactor this code for better readability and safety."
        />

        <button className="primary" onClick={handleAIEdit}>
          Apply AI Edit
        </button>

        <p className="status">{status}</p>
        {!bridgeReady ? (
          <p className="error">
            Electron preload bridge not detected. Run this in Electron mode.
          </p>
        ) : null}
      </aside>

      <main className="editorArea">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true
          }}
        />
      </main>
    </div>
  );
}

export default App;
