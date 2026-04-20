import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EditorPanel from './features/editor/EditorPanel';
import FilePanel from './features/files/FilePanel';
import AIPanel from './features/ai/AIPanel';
import TerminalComponent from './features/terminal/TerminalComponent';
import './index.css';
import explorerIcon from '../assets/explorer.png';
import searchIcon from '../assets/search.png';
import sourceControlIcon from '../assets/SourceControl.png';
import runAndDebugIcon from '../assets/runAndDebug.png';
import extensionsIcon from '../assets/Extension.png';

const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'file.new', label: 'New File', shortcut: 'Ctrl+N' },
      { id: 'file.open', label: 'Open File...', shortcut: 'Ctrl+O' },
      { id: 'file.save', label: 'Save', shortcut: 'Ctrl+S' },
      { id: 'file.saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
      { id: 'file.exit', label: 'Exit', shortcut: 'Ctrl+Q' }
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'edit.undo', label: 'Undo', shortcut: 'Ctrl+Z' },
      { id: 'edit.redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
      { id: 'edit.cut', label: 'Cut', shortcut: 'Ctrl+X' },
      { id: 'edit.copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { id: 'edit.paste', label: 'Paste', shortcut: 'Ctrl+V' },
      { id: 'edit.selectAll', label: 'Select All', shortcut: 'Ctrl+A' },
      { id: 'edit.find', label: 'Find', shortcut: 'Ctrl+F' },
      { id: 'edit.replace', label: 'Replace', shortcut: 'Ctrl+H' }
    ]
  },
  {
    id: 'selection',
    label: 'Selection',
    items: [
      { id: 'selection.copyLineUp', label: 'Copy Line Up', shortcut: 'Shift+Alt+Up' },
      { id: 'selection.copyLineDown', label: 'Copy Line Down', shortcut: 'Shift+Alt+Down' },
      { id: 'selection.expand', label: 'Expand Selection', shortcut: 'Shift+Alt+Right' },
      { id: 'selection.shrink', label: 'Shrink Selection', shortcut: 'Shift+Alt+Left' }
    ]
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'view.toggleSidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B' },
      { id: 'view.toggleAI', label: 'Toggle AI Panel', shortcut: 'Ctrl+J' },
      { id: 'view.toggleTerminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`' },
      { id: 'view.toggleFullScreen', label: 'Toggle Full Screen', shortcut: 'F11' }
    ]
  },
  {
    id: 'go',
    label: 'Go',
    items: [
      { id: 'go.back', label: 'Back', shortcut: 'Alt+Left' },
      { id: 'go.forward', label: 'Forward', shortcut: 'Alt+Right' },
      { id: 'go.file', label: 'Go to File...', shortcut: 'Ctrl+P' },
      { id: 'go.symbol', label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O' }
    ]
  },
  {
    id: 'run',
    label: 'Run',
    items: [
      { id: 'run.debug', label: 'Start Debugging', shortcut: 'F5' },
      { id: 'run.noDebug', label: 'Start Without Debugging', shortcut: 'Ctrl+F5' },
      { id: 'run.breakpoint', label: 'Toggle Breakpoint', shortcut: 'F9' }
    ]
  },
  {
    id: 'terminal',
    label: 'Terminal',
    items: [
      { id: 'terminal.new', label: 'New Terminal', shortcut: 'Ctrl+Shift+`' },
      { id: 'terminal.runTask', label: 'Run Task' },
      { id: 'terminal.clear', label: 'Clear' }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'help.about', label: 'About CodeForge' },
      { id: 'help.learn', label: 'Learn More' }
    ]
  }
];

const FALLBACK_WORKSPACE_FILES = [
  'src/App.jsx',
  'src/main.jsx',
  'src/index.css',
  'src/features/editor/EditorPanel.jsx',
  'src/features/files/FilePanel.jsx',
  'src/features/ai/AIPanel.jsx',
  'src/features/terminal/TerminalComponent.jsx',
  'electron/main.cjs',
  'electron/preload.cjs',
  'docs/CODEBASE_STRUCTURE.md',
  'docs/STRICT_ENGINEERING_RULES.md',
  'README.md',
  'package.json',
  'vite.config.js'
];

function App() {
  const [activeFile, setActiveFile] = useState('CODEBASE_STRUCTURE.md');
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [editorCode, setEditorCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiPanelWidth, setAiPanelWidth] = useState(350);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [activeBottomTab, setActiveBottomTab] = useState('TERMINAL');
  const [activeLeftIcon, setActiveLeftIcon] = useState('explorer');
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchCursor, setSearchCursor] = useState(0);
  const [leftSearchQuery, setLeftSearchQuery] = useState('');
  const [workspaceFiles, setWorkspaceFiles] = useState(FALLBACK_WORKSPACE_FILES);
  const [gitMap, setGitMap] = useState({});
  const [gitInfo, setGitInfo] = useState({ branch: '', isDirty: false });
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [uiSettings, setUiSettings] = useState({
    wordWrap: true,
    fontSize: 14
  });

  const leftTabs = [
    { id: 'explorer', label: 'Explorer' },
    { id: 'search', label: 'Search' },
    { id: 'source-control', label: 'Source Control' },
    { id: 'debug', label: 'Run and Debug' },
    { id: 'extensions', label: 'Extensions' }
  ];
  const leftBottomTabs = [
    { id: 'account', label: 'Account' },
    { id: 'settings', label: 'Settings' }
  ];

  const sourceControlCount = useMemo(() => {
    const count = Object.keys(gitMap || {}).length;
    return count > 99 ? '99+' : count;
  }, [gitMap]);

  const activityIcons = useMemo(() => ({
    explorer: explorerIcon,
    search: searchIcon,
    'source-control': sourceControlIcon,
    debug: runAndDebugIcon,
    extensions: extensionsIcon
  }), []);

  const activeMenu = useMemo(
    () => MENUS.find((menu) => menu.id === activeMenuId) || null,
    [activeMenuId]
  );
  const menuActions = useMemo(
    () => MENUS.flatMap((menu) =>
      menu.items.map((item) => ({
        ...item,
        bucket: menu.label,
        type: 'action'
      }))
    ),
    []
  );

  const quickResults = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();
    if (!query) return [];

    const files = workspaceFiles
      .filter((filePath) => filePath.toLowerCase().includes(query))
      .map((filePath) => ({
        id: `file:${filePath}`,
        label: filePath.split(/[\\/]/).pop(),
        description: filePath,
        type: 'file',
        value: filePath,
        bucket: 'Files'
      }));

    const actions = menuActions
      .filter((item) => item.label.toLowerCase().includes(query))
      .map((item) => ({
        id: `action:${item.id}`,
        label: item.label,
        description: item.shortcut || '',
        type: 'action',
        value: item.id,
        bucket: item.bucket
      }));

    return [...files, ...actions].slice(0, 9);
  }, [menuActions, quickSearch, workspaceFiles]);

  const leftSearchResults = useMemo(() => {
    const query = leftSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return workspaceFiles.filter((filePath) =>
      filePath.toLowerCase().includes(query)
    ).slice(0, 12);
  }, [leftSearchQuery, workspaceFiles]);

  const refreshWorkspaceFiles = useCallback(async () => {
    if (!window.codeforge?.listFiles) {
      setWorkspaceFiles(FALLBACK_WORKSPACE_FILES);
      return;
    }
    try {
      const files = await window.codeforge.listFiles();
      setWorkspaceFiles(Array.isArray(files) && files.length ? files : FALLBACK_WORKSPACE_FILES);
    } catch {
      setWorkspaceFiles(FALLBACK_WORKSPACE_FILES);
    }
  }, []);

  const refreshGitStatus = useCallback(async () => {
    if (!window.codeforge?.gitStatus) {
      setGitMap({});
      return;
    }
    try {
      const map = await window.codeforge.gitStatus();
      setGitMap(map && typeof map === 'object' ? map : {});
    } catch {
      setGitMap({});
    }
  }, []);

  const refreshGitInfo = useCallback(async () => {
    if (!window.codeforge?.gitInfo) {
      setGitInfo({ branch: '', isDirty: false });
      return;
    }
    try {
      const info = await window.codeforge.gitInfo();
      setGitInfo({
        branch: info?.branch ? String(info.branch) : '',
        isDirty: Boolean(info?.isDirty)
      });
    } catch {
      setGitInfo({ branch: '', isDirty: false });
    }
  }, []);

  const loadFileByPath = useCallback(async (filePath) => {
    if (!filePath) return;
    const fileName = filePath.split(/[\\/]/).pop();
    try {
      if (window.codeforge) {
        const content = await window.codeforge.readFile(filePath);
        setEditorCode(content);
        setIsDirty(false);
      } else {
        setEditorCode('');
      }
      setActiveFilePath(filePath);
      setActiveFile(fileName);
    } catch {
      setActiveFilePath(filePath);
      setActiveFile(fileName);
      setEditorCode('');
      setIsDirty(false);
    }
  }, []);

  const executeEditorCommand = useCallback((command) => {
    window.dispatchEvent(new CustomEvent('cf:editor-command', { detail: { command } }));
  }, []);

  const executeTerminalCommand = useCallback((command) => {
    window.dispatchEvent(new CustomEvent('cf:terminal-command', { detail: { command } }));
  }, []);

  const saveCurrentFile = useCallback(async () => {
    if (!window.codeforge) return;
    if (!activeFilePath) {
      const savedPath = await window.codeforge.saveFileAs(editorCode, activeFile || 'untitled.txt');
      if (!savedPath) return;
      setActiveFilePath(savedPath);
      setActiveFile(savedPath.split(/[\\/]/).pop());
      setIsDirty(false);
      return;
    }
    await window.codeforge.writeFile(activeFilePath, editorCode);
    setIsDirty(false);
  }, [activeFile, activeFilePath, editorCode]);

  const handleMenuAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'file.new':
          setActiveFile('untitled.txt');
          setActiveFilePath(null);
          setEditorCode('');
          setIsDirty(false);
          break;
        case 'file.open': {
          if (!window.codeforge) break;
          const selected = await window.codeforge.pickFile();
          if (!selected) break;
          const content = await window.codeforge.readFile(selected);
          setActiveFilePath(selected);
          setActiveFile(selected.split(/[\\/]/).pop());
          setEditorCode(content);
          setIsDirty(false);
          break;
        }
        case 'file.save':
          await saveCurrentFile();
          break;
        case 'file.saveAs': {
          if (!window.codeforge) break;
          const savedPath = await window.codeforge.saveFileAs(editorCode, activeFile || 'untitled.txt');
          if (!savedPath) break;
          setActiveFilePath(savedPath);
          setActiveFile(savedPath.split(/[\\/]/).pop());
          setIsDirty(false);
          break;
        }
        case 'file.exit':
          window.close();
          break;
        case 'edit.undo':
        case 'edit.redo':
        case 'edit.cut':
        case 'edit.copy':
        case 'edit.paste':
        case 'edit.selectAll':
        case 'edit.find':
        case 'edit.replace':
        case 'selection.copyLineUp':
        case 'selection.copyLineDown':
        case 'selection.expand':
        case 'selection.shrink':
        case 'go.symbol':
        case 'run.breakpoint':
          executeEditorCommand(action);
          break;
        case 'view.toggleSidebar':
          setSidebarOpen((prev) => !prev);
          break;
        case 'view.toggleAI':
          setAiPanelOpen((prev) => !prev);
          break;
        case 'view.toggleTerminal':
          setBottomPanelOpen((prev) => !prev);
          break;
        case 'view.toggleFullScreen':
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await document.documentElement.requestFullscreen();
          }
          break;
        case 'go.back':
          window.history.back();
          break;
        case 'go.forward':
          window.history.forward();
          break;
        case 'go.file': {
          const target = window.prompt('Enter workspace-relative path (example: src/App.jsx)');
          if (!target) break;
          await loadFileByPath(target);
          break;
        }
        case 'run.debug':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('npm run dev');
          break;
        case 'run.noDebug':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('npm run build');
          break;
        case 'terminal.new':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('terminal.new');
          break;
        case 'terminal.runTask': {
          const taskCommand = window.prompt('Enter terminal command to run', 'npm run build');
          if (!taskCommand) break;
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand(taskCommand);
          break;
        }
        case 'terminal.clear':
          executeTerminalCommand('clear');
          break;
        case 'help.about':
          window.alert('CodeForge\nCursor-style editor shell with AI + terminal integration.');
          break;
        case 'help.learn':
          window.open('https://github.com/sivmsrma/CodeForge', '_blank', 'noopener,noreferrer');
          break;
        default:
          break;
      }
    } catch (error) {
      window.alert(error.message || 'Unable to complete menu action.');
    }
  }, [activeFile, editorCode, executeEditorCommand, executeTerminalCommand, loadFileByPath, saveCurrentFile]);

  const applyQuickSearchResult = useCallback(async (result) => {
    if (!result) return;
    if (result.type === 'file') {
      await loadFileByPath(result.value);
    } else if (result.type === 'action') {
      await handleMenuAction(result.value);
    }
    setQuickSearch('');
    setSearchCursor(0);
    setSearchFocused(false);
  }, [handleMenuAction, loadFileByPath]);

  const handleSidebarResize = (e) => {
    if (!isResizingSidebar) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  };

  const handleBottomResize = (e) => {
    if (!isResizingBottom) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 100 && newHeight <= 400) {
      setBottomPanelHeight(newHeight);
    }
  };

  const handleAIResize = (e) => {
    if (!isResizingAI) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 300 && newWidth <= 500) {
      setAiPanelWidth(newWidth);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      handleSidebarResize(e);
      handleBottomResize(e);
      handleAIResize(e);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingBottom(false);
      setIsResizingAI(false);
    };

    if (isResizingSidebar || isResizingBottom || isResizingAI) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isResizingSidebar, isResizingBottom, isResizingAI]);

  useEffect(() => {
    const handleMouseDown = () => setActiveMenuId(null);
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setSettingsOpen(false);
      }
    };

    document.addEventListener('click', handleMouseDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setSearchCursor(0);
  }, [quickSearch]);

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setSearchFocused(true);
        setQuickSearch('');
        const input = document.querySelector('.title-bar-input');
        input?.focus();
      }
    };
    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!window.codeforge?.onMenuAction) return undefined;
    return window.codeforge.onMenuAction((action) => {
      handleMenuAction(action);
    });
  }, [handleMenuAction]);

  useEffect(() => {
    if (!window.codeforge?.onWindowMaximized) return undefined;
    return window.codeforge.onWindowMaximized((maximized) => {
      setIsWindowMaximized(maximized);
    });
  }, []);

  useEffect(() => {
    refreshWorkspaceFiles();
  }, [refreshWorkspaceFiles]);

  useEffect(() => {
    refreshGitStatus();
  }, [refreshGitStatus, workspaceFiles]);

  useEffect(() => {
    refreshGitInfo();
  }, [refreshGitInfo, workspaceFiles]);

  const openCommandPalette = useCallback(() => {
    setSearchFocused(true);
    setQuickSearch('');
    const input = document.querySelector('.title-bar-input');
    input?.focus();
  }, []);

  return (
    <div className={`app-container ${isResizingSidebar || isResizingBottom || isResizingAI ? 'resizing' : ''}`}>
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="brand-mark">◆</div>
          <div className="title-menu-strip" onClick={(e) => e.stopPropagation()}>
            {MENUS.map((menu) => (
              <span
                key={menu.id}
                className={`title-menu-item ${activeMenuId === menu.id ? 'active' : ''}`}
                onClick={() => setActiveMenuId((prev) => (prev === menu.id ? null : menu.id))}
                onMouseEnter={() => {
                  if (activeMenuId) {
                    setActiveMenuId(menu.id);
                  }
                }}
              >
                {menu.label}
              </span>
            ))}
          </div>
          <div className="title-nav-controls">
            <span>←</span>
            <span>→</span>
          </div>
          <div className="title-bar-search">
            <input
              type="text"
              placeholder="Search files and commands"
              className="title-bar-input"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 100);
              }}
              onKeyDown={(e) => {
                if (!quickResults.length) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSearchCursor((prev) => (prev + 1) % quickResults.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSearchCursor((prev) => (prev === 0 ? quickResults.length - 1 : prev - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  applyQuickSearchResult(quickResults[searchCursor]);
                } else if (e.key === 'Escape') {
                  setQuickSearch('');
                  setSearchFocused(false);
                }
              }}
            />
            <span className="search-shortcut-hint">Ctrl+P</span>
            {searchFocused && quickResults.length > 0 && (
              <div className="top-search-dropdown">
                {quickResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`top-search-item ${index === searchCursor ? 'active' : ''}`}
                    onMouseDown={() => applyQuickSearchResult(result)}
                  >
                    <span className="top-search-main">{result.label}</span>
                    <span className="top-search-sub">{result.description}</span>
                    <span className="top-search-bucket">{result.bucket}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="title-bar-center">CodeForge</div>
        <div className="title-bar-right">
          <div className="title-icon-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`title-icon-btn ${aiPanelOpen ? 'active' : ''}`}
              title="Toggle Chat"
              onClick={() => setAiPanelOpen((p) => !p)}
            >
              <svg viewBox="0 0 24 24" className="title-icon" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M4 4.75C4 3.78 4.78 3 5.75 3h12.5C19.22 3 20 3.78 20 4.75v9.5c0 .97-.78 1.75-1.75 1.75H10.1l-3.9 3.2c-.65.53-1.6.07-1.6-.78V4.75Zm2 .25v11.18l2.9-2.38h9.35a.75.75 0 0 0 .75-.75v-8.3a.75.75 0 0 0-.75-.75H5.75A.75.75 0 0 0 5 5Z"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`title-icon-btn ${settingsOpen ? 'active' : ''}`}
              title="Settings"
              onClick={() => setSettingsOpen((p) => !p)}
            >
              <svg viewBox="0 0 24 24" className="title-icon" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.13-.54 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
                />
              </svg>
            </button>
          </div>
          {settingsOpen && (
            <div className="settings-dropdown" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); openCommandPalette(); }}>
                <span>Command Palette...</span>
                <span className="settings-shortcut">Ctrl+Shift+P</span>
              </button>
              <div className="settings-divider" />
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); window.alert('Profiles (demo)'); }}>
                <span>Profiles</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); setSettingsModalOpen(true); }}>
                <span>Settings</span>
                <span className="settings-shortcut">Ctrl+,</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); setActiveLeftIcon('extensions'); setSidebarOpen(true); }}>
                <span>Extensions</span>
                <span className="settings-shortcut">Ctrl+Shift+X</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); window.alert('Keyboard Shortcuts (demo)'); }}>
                <span>Keyboard Shortcuts</span>
                <span className="settings-shortcut">Ctrl+K Ctrl+S</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); window.alert('Snippets (demo)'); }}>
                <span>Snippets</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); handleMenuAction('terminal.runTask'); }}>
                <span>Tasks</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); setUiSettings((s) => ({ ...s, wordWrap: !s.wordWrap })); }}>
                <span>Word Wrap</span>
                <span className="settings-shortcut">{uiSettings.wordWrap ? 'On' : 'Off'}</span>
              </button>
              <div className="settings-divider" />
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); window.alert('Backup and Sync Settings (demo)'); }}>
                <span>Backup and Sync Settings...</span>
              </button>
              <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); window.alert('Check for Updates (demo)'); }}>
                <span>Check for Updates...</span>
              </button>
            </div>
          )}
          <div className="traffic-buttons">
            <button
              type="button"
              className="traffic-btn minimize"
              title="Minimize"
              onClick={() => window.codeforge?.windowAction?.('minimize')}
            />
            <button
              type="button"
              className={`traffic-btn maximize ${isWindowMaximized ? 'active' : ''}`}
              title={isWindowMaximized ? 'Restore' : 'Maximize'}
              onClick={() => window.codeforge?.windowAction?.('maximize-toggle')}
            />
            <button
              type="button"
              className="traffic-btn close"
              title="Close"
              onClick={() => window.codeforge?.windowAction?.('close')}
            />
          </div>
        </div>
      </div>

      {activeMenu && (
        <div className="menu-dropdown">
          <div className="menu-content">
            {activeMenu.items.map((item) => (
              <div
                key={item.id}
                className="menu-item"
                onClick={() => {
                  setActiveMenuId(null);
                  handleMenuAction(item.id);
                }}
              >
                <span>{item.label}</span>
                <span className="menu-shortcut">{item.shortcut || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMenu && <div className="menu-overlay" />}

      <div className="main-container">
        <div className="left-sidebar">
          {!sidebarOpen && (
            <button
              type="button"
              className="panel-restore left"
              onClick={() => setSidebarOpen(true)}
              title="Show Sidebar"
            >
              ▸
            </button>
          )}
          <div className="sidebar-icons">
            {leftTabs.map((tab) => (
              <div
                key={tab.id}
                className={`sidebar-icon ${activeLeftIcon === tab.id ? 'active' : ''}`}
                onClick={() => setActiveLeftIcon(tab.id)}
                title={tab.label}
              >
                <img className="activity-icon-img" src={activityIcons[tab.id]} alt="" aria-hidden="true" />
                {tab.id === 'source-control' && Number(sourceControlCount) > 0 && (
                  <span className="activity-badge">{sourceControlCount}</span>
                )}
              </div>
            ))}
            <div className="sidebar-spacer" />
          </div>

          {sidebarOpen && (
            <div
              className="sidebar file-explorer"
              style={{ width: `${sidebarWidth}px`, position: 'relative' }}
            >
              <div
                className="resize-handle vertical"
                onMouseDown={() => setIsResizingSidebar(true)}
              />
              {activeLeftIcon === 'explorer' && (
                <FilePanel
                  activeFilePath={activeFilePath}
                  workspaceFiles={workspaceFiles}
                  gitMap={gitMap}
                  onWorkspaceRefresh={refreshWorkspaceFiles}
                  onFileSelect={loadFileByPath}
                />
              )}
              {activeLeftIcon === 'search' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>SEARCH</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="search-input"
                    value={leftSearchQuery}
                    onChange={(e) => setLeftSearchQuery(e.target.value)}
                  />
                  <div className="left-search-results">
                    {leftSearchResults.map((filePath) => (
                      <div
                        key={filePath}
                        className="left-search-item"
                        onClick={() => loadFileByPath(filePath)}
                      >
                        <div className="left-search-item-name">{filePath.split(/[\\/]/).pop()}</div>
                        <div className="left-search-item-path">{filePath}</div>
                      </div>
                    ))}
                    {leftSearchQuery.trim() && leftSearchResults.length === 0 && (
                      <div className="left-search-empty">No files found</div>
                    )}
                  </div>
                </div>
              )}
              {activeLeftIcon === 'source-control' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>SOURCE CONTROL</span>
                  </div>
                  <div className="git-status">
                    <div>● Modified: 3 files</div>
                    <div>● Added: 2 files</div>
                  </div>
                </div>
              )}
              {activeLeftIcon === 'debug' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>DEBUG</span>
                  </div>
                  <div className="debug-panel">
                    <button onClick={() => handleMenuAction('run.debug')}>Start Debugging</button>
                  </div>
                </div>
              )}
              {activeLeftIcon === 'extensions' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>EXTENSIONS</span>
                  </div>
                  <div className="extensions-list">
                    <div className="extension-item">AI Assistant</div>
                    <div className="extension-item">Code Formatter</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="content-area">
          <div className="editor-container">
            <div className="editor-tabs">
              <div className="tab active">
                <span className="tab-name">{activeFile}{isDirty ? ' *' : ''}</span>
                <span className="tab-close">×</span>
              </div>
            </div>
            <EditorPanel
              activeFile={activeFile}
              code={editorCode}
              onCodeChange={(value) => {
                setEditorCode(value || '');
                setIsDirty(true);
              }}
              settings={uiSettings}
            />
          </div>

          {bottomPanelOpen && (
            <div
              className="bottom-panel"
              style={{ height: `${bottomPanelHeight}px`, position: 'relative' }}
            >
              <div className="bottom-tabs">
                <div
                  className={`bottom-tab ${activeBottomTab === 'PROBLEMS' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('PROBLEMS')}
                >
                  Problems
                </div>
                <div
                  className={`bottom-tab ${activeBottomTab === 'OUTPUT' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('OUTPUT')}
                >
                  Output
                </div>
                <div
                  className={`bottom-tab ${activeBottomTab === 'DEBUG CONSOLE' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('DEBUG CONSOLE')}
                >
                  Debug Console
                </div>
                <div
                  className={`bottom-tab ${activeBottomTab === 'TERMINAL' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('TERMINAL')}
                >
                  Terminal
                </div>
                <div
                  className={`bottom-tab ${activeBottomTab === 'PORTS' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('PORTS')}
                >
                  Ports
                </div>
                <button
                  type="button"
                  className="bottom-panel-close"
                  onClick={() => setBottomPanelOpen(false)}
                  title="Hide Bottom Panel"
                >
                  ×
                </button>
              </div>
              <div
                className="resize-handle horizontal"
                onMouseDown={() => setIsResizingBottom(true)}
              />
              <div className="bottom-content">
                {activeBottomTab === 'TERMINAL' && <TerminalComponent />}
                {activeBottomTab === 'PROBLEMS' && (
                  <div className="problems-panel">
                    <div className="no-problems">No problems detected</div>
                  </div>
                )}
                {activeBottomTab === 'OUTPUT' && (
                  <div className="output-panel">
                    <div>[5:29:17 PM] Starting development server...</div>
                    <div>[5:29:18 PM] VITE ready in 314ms</div>
                  </div>
                )}
                {activeBottomTab === 'DEBUG CONSOLE' && (
                  <div className="debug-console">
                    <div>Debug console ready</div>
                  </div>
                )}
                {activeBottomTab === 'PORTS' && (
                  <div className="ports-panel">
                    <div>No ports in use</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {aiPanelOpen && (
          <div
            className="sidebar ai-panel"
            style={{ width: `${aiPanelWidth}px`, position: 'relative' }}
          >
            <div
              className="resize-handle vertical-left"
              onMouseDown={() => setIsResizingAI(true)}
            />
            <div className="sidebar-header">
              <span>AI Chat</span>
            </div>
            <AIPanel />
          </div>
        )}
      </div>
      {!bottomPanelOpen && (
        <button
          type="button"
          className="panel-restore bottom"
          onClick={() => setBottomPanelOpen(true)}
          title="Show Bottom Panel"
        >
          ▴
        </button>
      )}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-item" title="Source Control">
            <span className="status-glyph">{'<'}</span>
          </span>
          <span className="status-item" title="Git Branch">
            <span className="status-branch-icon">⑂</span>
            <span className="status-branch-text">
              {gitInfo.branch || '—'}
              {gitInfo.isDirty ? '*' : ''}
            </span>
          </span>
          <button type="button" className="status-item status-btn" title="Synchronize Changes" onClick={() => { refreshGitStatus(); refreshGitInfo(); }}>
            ↻
          </button>
          <span className="status-item" title="Errors">× 0</span>
          <span className="status-item" title="Warnings">⚠ 0</span>
        </div>
        <div className="status-right">
          <span className="status-item">{isDirty ? '● unsaved' : 'saved'}</span>
          <span className="status-item">UTF-8</span>
          <span className="status-item">LF</span>
          <span className="status-item">Spaces: 2</span>
          <span className="status-item">{activeFilePath || activeFile}</span>
        </div>
      </div>
      {settingsModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setSettingsModalOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-title">Settings</div>
            <div className="settings-row">
              <span>Word Wrap</span>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={uiSettings.wordWrap}
                  onChange={(e) => setUiSettings((s) => ({ ...s, wordWrap: e.target.checked }))}
                />
                <span className="settings-switch-ui" />
              </label>
            </div>
            <div className="settings-row">
              <span>Editor Font Size</span>
              <input
                className="settings-number"
                type="number"
                min="10"
                max="24"
                value={uiSettings.fontSize}
                onChange={(e) => setUiSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))}
              />
            </div>
            <div className="settings-modal-actions">
              <button type="button" className="settings-modal-btn" onClick={() => setSettingsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
