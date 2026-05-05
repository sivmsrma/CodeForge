import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VSIcon } from '../../shared/components/VSIcons';

const WORKSPACE_ROOT = 'D:\\Newfolder\\CodeForge';

function createSession(id, cwd) {
  return {
    id,
    name: `${id}: PowerShell`,
    currentPath: cwd || WORKSPACE_ROOT,
    history: [`PowerShell ready in ${cwd || WORKSPACE_ROOT}`],
    commandHistory: [],
    historyIndex: -1,
    input: '',
    isBusy: false
  };
}

function TerminalComponent() {
  const [sessions, setSessions] = useState([createSession(1, WORKSPACE_ROOT)]);
  const [activeSessionId, setActiveSessionId] = useState(1);
  const [nextSessionId, setNextSessionId] = useState(2);
  const terminalBodyRef = useRef(null);
  const inputRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [activeSessionId, sessions]
  );

  const updateSession = useCallback((id, updater) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id
          ? { ...session, ...(typeof updater === 'function' ? updater(session) : updater) }
          : session
      )
    );
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [activeSessionId, focusInput]);

  useEffect(() => {
    terminalBodyRef.current?.scrollTo({ top: terminalBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const active = sessions.find((session) => session.id === activeSessionId) || sessions[0];
    if (!active) return;
    window.dispatchEvent(
      new CustomEvent('cf:terminal-state', {
        detail: {
          count: sessions.length,
          activeName: active.name
        }
      })
    );
  }, [activeSessionId, sessions]);

  const appendLines = useCallback((id, lines) => {
    const normalizedLines = Array.isArray(lines) ? lines : [lines];
    updateSession(id, (session) => ({
      history: [...session.history, ...normalizedLines.filter((line) => line !== undefined && line !== null).map(String)]
    }));
  }, [updateSession]);

  const clearSession = useCallback((id) => {
    updateSession(id, (session) => ({
      history: [`PowerShell ready in ${session.currentPath}`],
      commandHistory: [],
      historyIndex: -1,
      input: '',
      isBusy: false
    }));
  }, [updateSession]);

  const createNewSession = useCallback((cwd) => {
    const resolvedCwd = cwd && typeof cwd === 'string' && cwd.trim() ? cwd : WORKSPACE_ROOT;
    setNextSessionId((prevId) => {
      const id = prevId;
      setSessions((prev) => [...prev, createSession(id, resolvedCwd)]);
      setActiveSessionId(id);
      return prevId + 1;
    });
  }, []);

  const killSession = useCallback((id) => {
    setSessions((prev) => {
      if (prev.length <= 1) {
        return prev.map((session) =>
          session.id === id
            ? {
                ...session,
                history: [`PowerShell ready in ${session.currentPath}`],
                commandHistory: [],
                historyIndex: -1,
                input: '',
                isBusy: false
              }
            : session
        );
      }
      const remaining = prev.filter((session) => session.id !== id);
      if (!remaining.some((session) => session.id === activeSessionId)) {
        setActiveSessionId(remaining[remaining.length - 1].id);
      }
      return remaining;
    });
  }, [activeSessionId]);

  const runCommand = useCallback(async (sessionId, rawCommand) => {
    const command = String(rawCommand || '').trim();
    if (!command) return;

    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const promptLine = `PS ${session.currentPath}> ${command}`;
    updateSession(sessionId, (current) => ({
      history: [...current.history, promptLine],
      commandHistory: [...current.commandHistory, command],
      historyIndex: -1,
      input: '',
      isBusy: true
    }));

    const lower = command.toLowerCase();

    try {
      if (lower === 'clear' || lower === 'cls') {
        clearSession(sessionId);
        return;
      }

      if (lower === 'pwd') {
        appendLines(sessionId, session.currentPath);
        return;
      }

      if (lower.startsWith('cd')) {
        const target = command.slice(2).trim() || '.';
        if (window.codeforge?.resolveDirectory) {
          const nextPath = await window.codeforge.resolveDirectory(session.currentPath, target);
          updateSession(sessionId, {
            currentPath: nextPath,
            isBusy: false
          });
          return;
        }
      }

      if (window.codeforge?.executeCommand) {
        const result = await window.codeforge.executeCommand(command, session.currentPath);
        if (result && String(result).trim().length) {
          appendLines(sessionId, String(result).split(/\r?\n/));
        }
      } else {
        const fallback = {
          ls: 'docs  electron  node_modules  src  package.json  README.md',
          dir: 'docs  electron  node_modules  src  package.json  README.md',
          help: 'Commands: ls, dir, pwd, clear, cls, echo, cd'
        };
        const token = lower.split(' ')[0];
        if (token === 'echo') {
          appendLines(sessionId, command.slice(4).trim());
        } else if (fallback[token]) {
          appendLines(sessionId, fallback[token]);
        } else {
          appendLines(sessionId, `'${token}' is not recognized as an internal or external command.`);
        }
      }
    } catch (error) {
      appendLines(sessionId, `Error: ${error.message || 'Command failed'}`);
    } finally {
      updateSession(sessionId, { isBusy: false });
    }
  }, [appendLines, clearSession, sessions, updateSession]);

  const handleInputChange = useCallback((value) => {
    if (!activeSession) return;
    updateSession(activeSession.id, { input: value });
  }, [activeSession, updateSession]);

  const handleInputKeyDown = useCallback((event) => {
    if (!activeSession) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(activeSession.id, activeSession.input);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!activeSession.commandHistory.length) return;
      const nextIndex = activeSession.historyIndex < activeSession.commandHistory.length - 1
        ? activeSession.historyIndex + 1
        : activeSession.historyIndex;
      const nextInput = activeSession.commandHistory[activeSession.commandHistory.length - 1 - nextIndex] || '';
      updateSession(activeSession.id, { historyIndex: nextIndex, input: nextInput });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (activeSession.historyIndex > 0) {
        const nextIndex = activeSession.historyIndex - 1;
        const nextInput = activeSession.commandHistory[activeSession.commandHistory.length - 1 - nextIndex] || '';
        updateSession(activeSession.id, { historyIndex: nextIndex, input: nextInput });
        return;
      }
      if (activeSession.historyIndex === 0) {
        updateSession(activeSession.id, { historyIndex: -1, input: '' });
      }
      return;
    }

    if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      clearSession(activeSession.id);
    }
  }, [activeSession, clearSession, runCommand, updateSession]);

  useEffect(() => {
    const handler = (event) => {
      const payload = event?.detail?.command;
      if (!payload) return;

      const currentId = activeSessionId;

      if (typeof payload === 'string') {
        if (payload === 'terminal.new') {
          createNewSession(WORKSPACE_ROOT);
          return;
        }
        if (payload === 'terminal.clear' || payload === 'clear') {
          clearSession(currentId);
          return;
        }
        runCommand(currentId, payload);
        return;
      }

      if (typeof payload === 'object') {
        const action = String(payload.action || '').toLowerCase();
        switch (action) {
          case 'new':
          case 'split':
            createNewSession(payload.cwd || WORKSPACE_ROOT);
            break;
          case 'kill':
            killSession(currentId);
            break;
          case 'clear':
            clearSession(currentId);
            break;
          case 'cdworkspace':
            createNewSession(WORKSPACE_ROOT);
            break;
          case 'run':
            runCommand(currentId, payload.command || '');
            break;
          default:
            if (payload.command) {
              runCommand(currentId, payload.command);
            }
            break;
        }
      }
    };

    window.addEventListener('cf:terminal-command', handler);
    return () => window.removeEventListener('cf:terminal-command', handler);
  }, [activeSessionId, clearSession, createNewSession, killSession, runCommand]);

  if (!activeSession) {
    return null;
  }

  return (
    <div className="terminal">
      <div className="terminal-toolbar">
        <div className="terminal-tabs">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`terminal-tab ${session.id === activeSession.id ? 'active' : ''}`}
              onClick={() => setActiveSessionId(session.id)}
              title={session.currentPath}
            >
              <VSIcon name="VscTerminalPowershell" size={12} />
              <span className="terminal-tab-name">{session.name}</span>
              <span
                role="button"
                tabIndex={0}
                className="terminal-tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  killSession(session.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    killSession(session.id);
                  }
                }}
              >
                <VSIcon name="VscClose" size={12} />
              </span>
            </button>
          ))}
        </div>

        <div className="terminal-actions">
          <button type="button" className="terminal-action-btn" title="New Terminal" onClick={() => createNewSession(activeSession.currentPath)}>
            <VSIcon name="VscAdd" size={14} />
          </button>
          <button type="button" className="terminal-action-btn" title="Split Terminal" onClick={() => createNewSession(activeSession.currentPath)}>
            <VSIcon name="VscSplitHorizontal" size={14} />
          </button>
          <button type="button" className="terminal-action-btn" title="Clear" onClick={() => clearSession(activeSession.id)}>
            <VSIcon name="VscClearAll" size={14} />
          </button>
          <button type="button" className="terminal-action-btn" title="Kill Terminal" onClick={() => killSession(activeSession.id)}>
            <VSIcon name="VscTrash" size={14} />
          </button>
        </div>
      </div>

      <div className="terminal-content" ref={terminalBodyRef} onClick={focusInput}>
        {activeSession.history.map((line, index) => (
          <div key={`${activeSession.id}-line-${index}`} className="terminal-line">
            {line}
          </div>
        ))}

        <div className="terminal-input-line">
          <span className="terminal-prompt">{`PS ${activeSession.currentPath}>`}</span>
          <input
            ref={inputRef}
            type="text"
            value={activeSession.input}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="terminal-input"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
          {activeSession.isBusy && <span className="terminal-busy">running...</span>}
        </div>
      </div>
    </div>
  );
}

export default TerminalComponent;
