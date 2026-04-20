import React, { useState, useRef, useEffect } from 'react';

function TerminalComponent() {
  const workspaceRoot = 'D:\\Newfolder\\CodeForge';
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState(workspaceRoot);
  const [history, setHistory] = useState([`PS ${workspaceRoot}>`]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    const newHistory = [...history];
    newHistory.push(`PS ${currentPath}> ${command}`);
    setHistory(newHistory);

    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    try {
      const trimmedCommand = command.trim();
      const lowerTrimmed = trimmedCommand.toLowerCase();

      if (lowerTrimmed === 'clear' || lowerTrimmed === 'cls') {
        setHistory([`PS ${currentPath}>`]);
        setInput('');
        return;
      }

      if (lowerTrimmed === 'pwd') {
        newHistory.push(currentPath);
        setHistory(newHistory);
        setInput('');
        return;
      }

      if (lowerTrimmed.startsWith('cd')) {
        const target = trimmedCommand.slice(2).trim();
        if (window.codeforge?.resolveDirectory) {
          const resolved = await window.codeforge.resolveDirectory(currentPath, target || '.');
          setCurrentPath(resolved);
          setHistory(newHistory);
          setInput('');
          return;
        }
      }

      if (window.codeforge) {
        const result = await window.codeforge.executeCommand(trimmedCommand, currentPath);
        if (result) {
          newHistory.push(result);
        }
        setHistory(newHistory);
        setInput('');
      } else {
        // Mock commands for web version
        const mockCommands = {
          'ls': 'docs  electron  node_modules  src  package.json  README.md',
          'dir': 'docs  electron  node_modules  src  package.json  README.md',
          'pwd': currentPath,
          'help': 'Available commands: ls, dir, pwd, clear, cls, help, echo, mkdir, cd',
        };

        const cmd = command.toLowerCase().split(' ')[0];
        const args = command.toLowerCase().split(' ').slice(1).join(' ');
        
        let result = '';
        if (cmd === 'echo') {
          result = args;
        } else if (cmd === 'mkdir') {
          result = `Directory created: ${args}`;
        } else if (cmd === 'cd') {
          result = `Changed directory to: ${args || currentPath}`;
        } else if (mockCommands[cmd]) {
          result = mockCommands[cmd];
        } else {
          result = `'${cmd}' is not recognized as an internal or external command, operable program or batch file.`;
        }
        
        newHistory.push(result);
        setHistory(newHistory);
        setInput('');
      }
    } catch (error) {
      newHistory.push(`Error: ${error.message}`);
      setHistory(newHistory);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commands = ['ls', 'dir', 'pwd', 'clear', 'help', 'echo', 'mkdir', 'cd'];
      const matches = commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0]);
      }
    }
  };

  const handleClear = () => {
    setHistory([`PS ${currentPath}>`]);
    setInput('');
    setCommandHistory([]);
    setHistoryIndex(-1);
  };

  useEffect(() => {
    const handler = (event) => {
      const command = event.detail?.command;
      if (!command) return;
      if (command === 'terminal.new') {
        handleClear();
        return;
      }
      executeCommand(command);
    };

    window.addEventListener('cf:terminal-command', handler);
    return () => window.removeEventListener('cf:terminal-command', handler);
  });

  return (
    <div className="terminal">
      <div className="terminal-content">
        {history.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
          </div>
        ))}
        <div className="terminal-input-line">
          <span>{`PS ${currentPath}> `}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            autoFocus
            spellCheck={false}
          />
          <span className="cursor">_</span>
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

export default TerminalComponent;
