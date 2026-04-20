import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const DEFAULT_CODE = `# CodeForge Codebase Structure

Is document me final folder strategy define hai.
Coding isi structure ke hisab se hogi.

---

## 1) High-level Layers

1. \`Renderer Layer\` (React UI): editor, chat panel, controls.
2. \`Bridge Layer\` (Preload): safe APIs to renderer.
3. \`Core Layer\` (Electron Main): file IO, AI calls, orchestration.
4. \`Domain Layer\` (future): planning, diff engine, agent loop.
5. \`Infra Layer\` (future): embeddings, indexing, test runners.

---

## 2) Target Folder Structure

\`\`\`text
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
\`\`\`

---

## 3) Ownership Rules by Layer

1. \`src/*\` me koi Node-only API use nahi hogi.
2. \`electron/*\` me UI imports nahi honge.
3. IPC payload contracts stable and versioned hone chahiye.
4. File system writes always \`workspaceGuard\` pass karega.

---

## 4) Module Contracts (Initial)

### \`bridgeClient\`
Responsibilities:
1. renderer calls normalize karna.
2. errors ko user-friendly message dena.

### \`ollamaClient\`
Responsibilities:
1. model call wrapper.
2. timeout + retry policy.
3. response sanity check.

### \`promptBuilder\`
Responsibilities:
1. deterministic prompt templates.
2. instruction + code + constraints combine karna.
3. output format strict rakhna.

### \`workspaceGuard\`
Responsibilities:
1. path traversal block.
2. only workspace-contained paths allow.

---

## 5) Build Roadmap by Structure

### Phase A (current)
1. monolithic \`main.cjs\` handlers workable state me.

### Phase B
1. split \`ipc\` handlers into files.
2. split \`services\` into reusable modules.

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
`;

function EditorPanel({ activeFile, code, onCodeChange, settings }) {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('markdown');

  useEffect(() => {
    if (activeFile) {
      const extension = activeFile.split('.').pop();
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'md': 'markdown'
      };
      setLanguage(languageMap[extension] || 'plaintext');
    }
  }, [activeFile]);

  useEffect(() => {
    const handler = (event) => {
      const action = event.detail?.command;
      if (!editorRef.current || !action) return;
      const editor = editorRef.current;

      const actionMap = {
        'edit.undo': 'undo',
        'edit.redo': 'redo',
        'edit.find': 'actions.find',
        'edit.replace': 'editor.action.startFindReplaceAction',
        'go.symbol': 'editor.action.quickOutline',
        'selection.expand': 'editor.action.smartSelect.expand',
        'selection.shrink': 'editor.action.smartSelect.shrink',
        'selection.copyLineUp': 'editor.action.copyLinesUpAction',
        'selection.copyLineDown': 'editor.action.copyLinesDownAction'
      };

      if (action === 'edit.selectAll') {
        editor.trigger('menu', 'editor.action.selectAll', null);
        return;
      }
      if (action === 'edit.cut' || action === 'edit.copy' || action === 'edit.paste') {
        document.execCommand(action.replace('edit.', ''));
        return;
      }
      if (action === 'run.breakpoint') {
        window.alert('Breakpoint toggled (demo).');
        return;
      }

      const command = actionMap[action];
      if (command) {
        editor.trigger('menu', command, null);
      }
    };

    window.addEventListener('cf:editor-command', handler);
    return () => window.removeEventListener('cf:editor-command', handler);
  }, []);

  return (
    <div className="editor-panel">
      <Editor
        height="100%"
        language={language}
        value={code || DEFAULT_CODE}
        onChange={(value) => onCodeChange?.(value || '')}
        theme="vs-dark"
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        options={{
          fontSize: settings?.fontSize || 14,
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          wordWrap: settings?.wordWrap === false ? 'off' : 'on',
          scrollBeyondLastLine: false,
          renderLineHighlight: 'line',
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          lineNumbers: 'on',
          glyphMargin: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true }
        }}
      />
    </div>
  );
}

export default EditorPanel;
