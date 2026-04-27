import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '@vscode/codicons/dist/codicon.css';
import EditorPanel from './features/editor/EditorPanel';
import FilePanel from './features/files/FilePanel';
import AIPanel from './features/ai/AIPanel';
import TerminalComponent from './features/terminal/TerminalComponent';
import './index.css';

const MENUS = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'file.new', label: 'New File', shortcut: 'Ctrl+N' },
      { id: 'file.newWindow', label: 'New Window', shortcut: 'Ctrl+Shift+N' },
      { id: 'file.open', label: 'Open File...', shortcut: 'Ctrl+O' },
      { id: 'file.openFolder', label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O' },
      { id: 'file.openWorkspace', label: 'Open Workspace from File...' },
      { id: 'file.openRecent', label: 'Open Recent' },
      { type: 'separator' },
      { id: 'file.addFolder', label: 'Add Folder to Workspace...' },
      { id: 'file.saveWorkspaceAs', label: 'Save Workspace As...' },
      { id: 'file.duplicateWorkspace', label: 'Duplicate Workspace' },
      { type: 'separator' },
      { id: 'file.save', label: 'Save', shortcut: 'Ctrl+S' },
      { id: 'file.saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
      { id: 'file.saveAll', label: 'Save All', shortcut: 'Ctrl+K S' },
      { type: 'separator' },
      { id: 'file.share', label: 'Share' },
      { id: 'file.autoSave', label: 'Auto Save' },
      { id: 'file.preferences', label: 'Preferences' },
      { type: 'separator' },
      { id: 'file.revert', label: 'Revert File' },
      { id: 'file.closeEditor', label: 'Close Editor', shortcut: 'Ctrl+F4' },
      { id: 'file.closeFolder', label: 'Close Folder' },
      { id: 'file.closeWindow', label: 'Close Window', shortcut: 'Alt+F4' },
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
      { type: 'separator' },
      { id: 'edit.find', label: 'Find', shortcut: 'Ctrl+F' },
      { id: 'edit.replace', label: 'Replace', shortcut: 'Ctrl+H' },
      { id: 'edit.findInFiles', label: 'Find in Files', shortcut: 'Ctrl+Shift+F' },
      { id: 'edit.replaceInFiles', label: 'Replace in Files', shortcut: 'Ctrl+Shift+H' },
      { type: 'separator' },
      { id: 'edit.toggleLineComment', label: 'Toggle Line Comment', shortcut: 'Ctrl+/' },
      { id: 'edit.toggleBlockComment', label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A' },
      { id: 'edit.emmet', label: 'Emmet: Expand Abbreviation', shortcut: 'Tab' }
    ]
  },
  {
    id: 'selection',
    label: 'Selection',
    items: [
      { id: 'selection.copyLineUp', label: 'Copy Line Up', shortcut: 'Shift+Alt+Up' },
      { id: 'selection.copyLineDown', label: 'Copy Line Down', shortcut: 'Shift+Alt+Down' },
      { id: 'selection.expand', label: 'Expand Selection', shortcut: 'Shift+Alt+Right' },
      { id: 'selection.shrink', label: 'Shrink Selection', shortcut: 'Shift+Alt+Left' },
      { type: 'separator' },
      { id: 'selection.moveLineUp', label: 'Move Line Up', shortcut: 'Alt+Up' },
      { id: 'selection.moveLineDown', label: 'Move Line Down', shortcut: 'Alt+Down' },
      { id: 'selection.duplicate', label: 'Duplicate Selection' },
      { id: 'selection.addCursorAbove', label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+Up' },
      { id: 'selection.addCursorBelow', label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+Down' },
      { id: 'selection.addCursorsToLineEnds', label: 'Add Cursors to Line Ends', shortcut: 'Shift+Alt+I' },
      { id: 'selection.selectAllOccurrences', label: 'Select All Occurrences', shortcut: 'Ctrl+Shift+L' }
    ]
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'view.commandPalette', label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
      { id: 'view.openView', label: 'Open View...' },
      { type: 'separator' },
      { id: 'view.explorer', label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
      { id: 'view.search', label: 'Search', shortcut: 'Ctrl+Shift+F' },
      { id: 'view.sourceControl', label: 'Source Control', shortcut: 'Ctrl+Shift+G' },
      { id: 'view.runDebug', label: 'Run and Debug', shortcut: 'Ctrl+Shift+D' },
      { id: 'view.extensions', label: 'Extensions', shortcut: 'Ctrl+Shift+X' },
      { id: 'view.github', label: 'GitHub' },
      { id: 'view.aiChat', label: 'Chat' },
      { type: 'separator' },
      { id: 'view.appearance', label: 'Appearance' },
      { id: 'view.editorLayout', label: 'Editor Layout' },
      { type: 'separator' },
      { id: 'view.toggleSidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B' },
      { id: 'view.toggleAI', label: 'Toggle AI Panel', shortcut: 'Ctrl+J' },
      { id: 'view.toggleTerminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`' },
      { id: 'view.togglePanel', label: 'Toggle Panel', shortcut: 'Ctrl+J' },
      { id: 'view.toggleStatusBar', label: 'Toggle Status Bar' },
      { id: 'view.toggleActivityBar', label: 'Toggle Activity Bar' },
      { id: 'view.toggleFullScreen', label: 'Toggle Full Screen', shortcut: 'F11' },
      { id: 'view.zoomIn', label: 'Zoom In', shortcut: 'Ctrl+=' },
      { id: 'view.zoomOut', label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { id: 'view.resetZoom', label: 'Reset Zoom', shortcut: 'Ctrl+0' }
    ]
  },
  {
    id: 'go',
    label: 'Go',
    items: [
      { id: 'go.back', label: 'Back', shortcut: 'Alt+Left' },
      { id: 'go.forward', label: 'Forward', shortcut: 'Alt+Right' },
      { id: 'go.lastEdit', label: 'Last Edit Location', shortcut: 'Ctrl+K Ctrl+Q' },
      { type: 'separator' },
      { id: 'go.file', label: 'Go to File...', shortcut: 'Ctrl+P' },
      { id: 'go.symbol', label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O' },
      { id: 'go.workspaceSymbol', label: 'Go to Symbol in Workspace...', shortcut: 'Ctrl+T' },
      { id: 'go.definition', label: 'Go to Definition', shortcut: 'F12' },
      { id: 'go.declaration', label: 'Go to Declaration' },
      { id: 'go.typeDefinition', label: 'Go to Type Definition' },
      { id: 'go.implementation', label: 'Go to Implementations', shortcut: 'Ctrl+F12' },
      { id: 'go.references', label: 'Go to References', shortcut: 'Shift+F12' },
      { type: 'separator' },
      { id: 'go.line', label: 'Go to Line/Column...', shortcut: 'Ctrl+G' },
      { id: 'go.bracket', label: 'Go to Bracket', shortcut: 'Ctrl+Shift+\\' },
      { id: 'go.nextProblem', label: 'Next Problem', shortcut: 'F8' },
      { id: 'go.previousProblem', label: 'Previous Problem', shortcut: 'Shift+F8' }
    ]
  },
  {
    id: 'run',
    label: 'Run',
    items: [
      { id: 'run.debug', label: 'Start Debugging', shortcut: 'F5' },
      { id: 'run.noDebug', label: 'Start Without Debugging', shortcut: 'Ctrl+F5' },
      { id: 'run.stop', label: 'Stop Debugging', shortcut: 'Shift+F5' },
      { id: 'run.restart', label: 'Restart Debugging', shortcut: 'Ctrl+Shift+F5' },
      { type: 'separator' },
      { id: 'run.openConfigurations', label: 'Open Configurations' },
      { id: 'run.addConfiguration', label: 'Add Configuration...' },
      { type: 'separator' },
      { id: 'run.stepOver', label: 'Step Over', shortcut: 'F10' },
      { id: 'run.stepInto', label: 'Step Into', shortcut: 'F11' },
      { id: 'run.stepOut', label: 'Step Out', shortcut: 'Shift+F11' },
      { id: 'run.continue', label: 'Continue', shortcut: 'F5' },
      { id: 'run.breakpoint', label: 'Toggle Breakpoint', shortcut: 'F9' },
      { id: 'run.newBreakpoint', label: 'New Breakpoint' },
      { id: 'run.enableAllBreakpoints', label: 'Enable All Breakpoints' },
      { id: 'run.disableAllBreakpoints', label: 'Disable All Breakpoints' },
      { id: 'run.removeAllBreakpoints', label: 'Remove All Breakpoints' }
    ]
  },
  {
    id: 'terminal',
    label: 'Terminal',
    items: [
      { id: 'terminal.new', label: 'New Terminal', shortcut: 'Ctrl+Shift+`' },
      { id: 'terminal.split', label: 'Split Terminal', shortcut: 'Ctrl+Shift+5' },
      { id: 'terminal.runTask', label: 'Run Task' },
      { id: 'terminal.runBuildTask', label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B' },
      { id: 'terminal.runActiveFile', label: 'Run Active File' },
      { id: 'terminal.runSelectedText', label: 'Run Selected Text' },
      { type: 'separator' },
      { id: 'terminal.showRunningTasks', label: 'Show Running Tasks...' },
      { id: 'terminal.restartRunningTask', label: 'Restart Running Task...' },
      { id: 'terminal.terminateTask', label: 'Terminate Task...' },
      { type: 'separator' },
      { id: 'terminal.clear', label: 'Clear' },
      { id: 'terminal.kill', label: 'Kill Terminal' }
    ]
  },
  {
    id: 'github',
    label: 'GitHub',
    items: [
      { id: 'github.signIn', label: 'Sign in to GitHub...' },
      { id: 'github.clone', label: 'Clone Repository...' },
      { id: 'github.publish', label: 'Publish Branch...' },
      { id: 'github.pullRequests', label: 'Pull Requests' },
      { id: 'github.issues', label: 'Issues' },
      { id: 'github.actions', label: 'Actions' },
      { id: 'github.openRemote', label: 'Open on GitHub' }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'help.welcome', label: 'Welcome' },
      { id: 'help.showAllCommands', label: 'Show All Commands', shortcut: 'Ctrl+Shift+P' },
      { id: 'help.documentation', label: 'Documentation' },
      { id: 'help.editorPlayground', label: 'Editor Playground' },
      { id: 'help.releaseNotes', label: 'Release Notes' },
      { type: 'separator' },
      { id: 'help.toggleDevTools', label: 'Toggle Developer Tools' },
      { id: 'help.processExplorer', label: 'Open Process Explorer' },
      { type: 'separator' },
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

const BOTTOM_TABS = ['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'];

const EXTENSION_ITEMS = [
  {
    id: 'ai-assistant',
    name: 'CodeForge AI Assistant',
    description: 'Offline code chat and edit workflow powered by local Ollama.',
    enabled: true
  },
  {
    id: 'monaco-editor',
    name: 'Monaco Editor Core',
    description: 'VS Code editor engine with symbols, find, replace, and language modes.',
    enabled: true
  },
  {
    id: 'git-tools',
    name: 'Git Tools',
    description: 'Source control badges, change list, branch status, and refresh actions.',
    enabled: true
  },
  {
    id: 'debug-runner',
    name: 'Run and Debug',
    description: 'Launch commands, build tasks, debug console, and breakpoint shell.',
    enabled: false
  }
];

function getFileName(filePath) {
  return filePath ? filePath.split(/[\\/]/).pop() : '';
}

function getGitStatusLabel(status) {
  const labels = {
    M: 'Modified',
    U: 'Untracked',
    A: 'Added',
    D: 'Deleted'
  };
  return labels[status] || status || 'Changed';
}

function Codicon({ name, className = '' }) {
  return <span className={`codicon codicon-${name} ${className}`} aria-hidden="true" />;
}

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
  const [leftSearchReplace, setLeftSearchReplace] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    matchCase: false,
    wholeWord: false,
    regex: false
  });
  const [extensionQuery, setExtensionQuery] = useState('');
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
    { id: 'explorer', label: 'Explorer', icon: 'files' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'source-control', label: 'Source Control', icon: 'source-control' },
    { id: 'debug', label: 'Run and Debug', icon: 'debug-alt' },
    { id: 'remote', label: 'Remote Explorer', icon: 'remote-explorer' },
    { id: 'extensions', label: 'Extensions', icon: 'extensions' },
    { id: 'github', label: 'GitHub', icon: 'github' },
    { id: 'ai-agent', label: 'AI Agent', icon: 'copilot' },
    { id: 'more', label: 'More', icon: 'ellipsis' }
  ];
  const leftBottomTabs = [
    { id: 'account', label: 'Accounts', icon: 'account' },
    { id: 'settings', label: 'Manage', icon: 'settings-gear' }
  ];

  const sourceControlCount = useMemo(() => {
    const count = Object.keys(gitMap || {}).length;
    return count > 99 ? '99+' : count;
  }, [gitMap]);

  const gitChanges = useMemo(() => (
    Object.entries(gitMap || {})
      .map(([filePath, status]) => ({
        filePath,
        fileName: getFileName(filePath),
        status,
        statusLabel: getGitStatusLabel(status)
      }))
      .sort((a, b) => a.filePath.localeCompare(b.filePath))
  ), [gitMap]);

  const gitSummary = useMemo(() => gitChanges.reduce((summary, change) => {
    summary[change.status] = (summary[change.status] || 0) + 1;
    return summary;
  }, {}), [gitChanges]);

  const breadcrumbs = useMemo(() => {
    const pathValue = activeFilePath || activeFile;
    return pathValue ? pathValue.split(/[\\/]/).filter(Boolean) : [];
  }, [activeFile, activeFilePath]);

  const visibleExtensions = useMemo(() => {
    const query = extensionQuery.trim().toLowerCase();
    if (!query) return EXTENSION_ITEMS;
    return EXTENSION_ITEMS.filter((item) =>
      [item.name, item.description].some((value) => value.toLowerCase().includes(query))
    );
  }, [extensionQuery]);

  const activeMenu = useMemo(
    () => MENUS.find((menu) => menu.id === activeMenuId) || null,
    [activeMenuId]
  );
  const menuActions = useMemo(
    () => MENUS.flatMap((menu) =>
      menu.items
        .filter((item) => item.type !== 'separator')
        .map((item) => ({
          ...item,
          bucket: menu.label,
          type: 'action'
        }))
    ),
    []
  );

  const quickResults = useMemo(() => {
    const rawQuery = quickSearch.trim();
    const commandMode = rawQuery.startsWith('>');
    const query = rawQuery.replace(/^>\s*/, '').toLowerCase();
    if (!query && !commandMode) return [];

    const files = commandMode ? [] : workspaceFiles
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
      .filter((item) => !query || item.label.toLowerCase().includes(query))
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

  const openCommandPalette = useCallback(() => {
    setSearchFocused(true);
    setQuickSearch('>');
    const input = document.querySelector('.title-bar-input');
    input?.focus();
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
        case 'file.newWindow':
          window.alert('New window support will be wired in the Electron window manager phase.');
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
        case 'file.saveAll':
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
        case 'edit.toggleLineComment':
        case 'edit.toggleBlockComment':
        case 'selection.copyLineUp':
        case 'selection.copyLineDown':
        case 'selection.moveLineUp':
        case 'selection.moveLineDown':
        case 'selection.addCursorAbove':
        case 'selection.addCursorBelow':
        case 'selection.addCursorsToLineEnds':
        case 'selection.selectAllOccurrences':
        case 'selection.expand':
        case 'selection.shrink':
        case 'go.symbol':
        case 'go.definition':
        case 'go.references':
        case 'go.line':
        case 'go.bracket':
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
        case 'view.togglePanel':
          setBottomPanelOpen((prev) => !prev);
          break;
        case 'view.commandPalette':
        case 'help.showAllCommands':
          openCommandPalette();
          break;
        case 'view.explorer':
          setActiveLeftIcon('explorer');
          setSidebarOpen(true);
          break;
        case 'view.search':
        case 'edit.findInFiles':
        case 'edit.replaceInFiles':
          setActiveLeftIcon('search');
          setSidebarOpen(true);
          break;
        case 'view.sourceControl':
          setActiveLeftIcon('source-control');
          setSidebarOpen(true);
          break;
        case 'view.runDebug':
          setActiveLeftIcon('debug');
          setSidebarOpen(true);
          break;
        case 'view.extensions':
          setActiveLeftIcon('extensions');
          setSidebarOpen(true);
          break;
        case 'view.github':
        case 'github.pullRequests':
        case 'github.issues':
        case 'github.actions':
          setActiveLeftIcon('github');
          setSidebarOpen(true);
          break;
        case 'view.aiChat':
          setAiPanelOpen(true);
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
        case 'terminal.split':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('echo Split terminal is queued for the terminal manager phase.');
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
        case 'terminal.runBuildTask':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('npm run build');
          break;
        case 'terminal.runActiveFile':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand(`echo Run active file: ${activeFilePath || activeFile}`);
          break;
        case 'terminal.runSelectedText':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('echo Run selected text is queued for editor selection bridge.');
          break;
        case 'terminal.showRunningTasks':
          setActiveBottomTab('OUTPUT');
          setBottomPanelOpen(true);
          break;
        case 'terminal.kill':
        case 'terminal.terminateTask':
          executeTerminalCommand('terminal.new');
          break;
        case 'github.signIn':
          setActiveLeftIcon('github');
          setSidebarOpen(true);
          window.alert('GitHub sign-in panel is staged. Next phase will connect OAuth/device login.');
          break;
        case 'github.clone':
          setBottomPanelOpen(true);
          setActiveBottomTab('TERMINAL');
          executeTerminalCommand('git clone <repository-url>');
          break;
        case 'github.openRemote':
        case 'help.documentation':
        case 'help.learn':
          window.open('https://github.com/sivmsrma/CodeForge', '_blank', 'noopener,noreferrer');
          break;
        case 'help.about':
          window.alert('CodeForge\nCursor-style editor shell with AI + terminal integration.');
          break;
        default:
          break;
      }
    } catch (error) {
      window.alert(error.message || 'Unable to complete menu action.');
    }
  }, [activeFile, activeFilePath, editorCode, executeEditorCommand, executeTerminalCommand, loadFileByPath, openCommandPalette, saveCurrentFile]);

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
      const isCommandPalette =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'p';
      const isQuickOpen =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'p';

      if (isCommandPalette || isQuickOpen) {
        event.preventDefault();
        setSearchFocused(true);
        setQuickSearch(isCommandPalette ? '>' : '');
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

  return (
    <div className={`app-container ${isResizingSidebar || isResizingBottom || isResizingAI ? 'resizing' : ''}`}>
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="brand-mark">
            <Codicon name="vscode" className="brand-codicon" />
          </div>
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
            <span>{'<'}</span>
            <span>{'>'}</span>
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
              <Codicon name="comment-discussion" className="title-icon" />
            </button>
            <button
              type="button"
              className={`title-icon-btn ${settingsOpen ? 'active' : ''}`}
              title="Settings"
              onClick={() => setSettingsOpen((p) => !p)}
            >
              <Codicon name="settings-gear" className="title-icon" />
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
            >
              <Codicon name="chrome-minimize" />
            </button>
            <button
              type="button"
              className={`traffic-btn maximize ${isWindowMaximized ? 'active' : ''}`}
              title={isWindowMaximized ? 'Restore' : 'Maximize'}
              onClick={() => window.codeforge?.windowAction?.('maximize-toggle')}
            >
              <Codicon name={isWindowMaximized ? 'chrome-restore' : 'chrome-maximize'} />
            </button>
            <button
              type="button"
              className="traffic-btn close"
              title="Close"
              onClick={() => window.codeforge?.windowAction?.('close')}
            >
              <Codicon name="chrome-close" />
            </button>
          </div>
        </div>
      </div>

      {activeMenu && (
        <div className="menu-dropdown">
          <div className="menu-content">
            {activeMenu.items.map((item, index) => (
              item.type === 'separator' ? (
                <div key={`separator-${activeMenu.id}-${index}`} className="menu-separator" />
              ) : (
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
              )
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
              {'>'}
            </button>
          )}
          <div className="sidebar-icons">
            {leftTabs.map((tab) => (
              <div
                key={tab.id}
                className={`sidebar-icon ${activeLeftIcon === tab.id ? 'active' : ''}`}
                onClick={() => {
                  if (tab.id === 'ai-agent') {
                    setAiPanelOpen(true);
                    return;
                  }
                  setActiveLeftIcon(tab.id);
                  setSidebarOpen(true);
                }}
                title={tab.label}
              >
                <Codicon name={tab.icon} className="activity-codicon" />
                {tab.id === 'source-control' && gitChanges.length > 0 && (
                  <span className="activity-badge">{sourceControlCount}</span>
                )}
              </div>
            ))}
            <div className="sidebar-spacer" />
            {leftBottomTabs.map((tab) => (
              <div
                key={tab.id}
                className={`sidebar-icon ${activeLeftIcon === tab.id ? 'active' : ''}`}
                onClick={() => {
                  if (tab.id === 'settings') {
                    setSettingsOpen((open) => !open);
                    return;
                  }
                  setActiveLeftIcon(tab.id);
                  setSidebarOpen(true);
                }}
                title={tab.label}
              >
                <Codicon name={tab.icon} className="activity-codicon" />
              </div>
            ))}
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
                  <div className="search-control-stack">
                    <input
                      type="text"
                      placeholder="Search"
                      className="search-input"
                      value={leftSearchQuery}
                      onChange={(e) => setLeftSearchQuery(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Replace"
                      className="search-input"
                      value={leftSearchReplace}
                      onChange={(e) => setLeftSearchReplace(e.target.value)}
                    />
                    <div className="search-option-row">
                      {[
                        ['matchCase', 'Aa'],
                        ['wholeWord', 'Ab'],
                        ['regex', '.*']
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`search-option ${searchOptions[key] ? 'active' : ''}`}
                          onClick={() => setSearchOptions((options) => ({
                            ...options,
                            [key]: !options[key]
                          }))}
                          title={key}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="left-search-results">
                    {leftSearchQuery.trim() && (
                      <div className="result-group-title">
                        {leftSearchResults.length} file result{leftSearchResults.length === 1 ? '' : 's'}
                      </div>
                    )}
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
                  <div className="scm-toolbar">
                    <button type="button" onClick={() => { refreshGitStatus(); refreshGitInfo(); }}>
                      Refresh
                    </button>
                    <button type="button" onClick={() => setActiveBottomTab('OUTPUT')}>
                      Output
                    </button>
                  </div>
                  <div className="scm-summary">
                    {['M', 'A', 'U', 'D'].map((status) => (
                      <span key={status} className={`scm-pill ${status}`}>
                        {getGitStatusLabel(status)} {gitSummary[status] || 0}
                      </span>
                    ))}
                  </div>
                  <div className="git-status">
                    {gitChanges.length === 0 && (
                      <div className="empty-state">No source control changes</div>
                    )}
                    {gitChanges.map((change) => (
                      <button
                        key={change.filePath}
                        type="button"
                        className="scm-change"
                        onClick={() => loadFileByPath(change.filePath)}
                      >
                        <span className="scm-change-name">{change.fileName}</span>
                        <span className="scm-change-path">{change.filePath}</span>
                        <span className={`file-git-status ${change.status}`}>{change.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeLeftIcon === 'debug' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>RUN AND DEBUG</span>
                  </div>
                  <div className="debug-panel">
                    <button type="button" className="primary-action" onClick={() => handleMenuAction('run.debug')}>
                      Start Debugging
                    </button>
                    {['Variables', 'Watch', 'Call Stack', 'Breakpoints'].map((label) => (
                      <div key={label} className="debug-section">
                        <div className="debug-section-title">{label}</div>
                        <div className="debug-section-body">
                          {label === 'Breakpoints' ? 'No breakpoints' : 'Not available until a debug session starts'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeLeftIcon === 'extensions' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>EXTENSIONS</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search Extensions in Marketplace"
                    className="search-input"
                    value={extensionQuery}
                    onChange={(e) => setExtensionQuery(e.target.value)}
                  />
                  <div className="extensions-list">
                    {visibleExtensions.map((extension) => (
                      <div key={extension.id} className="extension-item">
                        <div className="extension-icon">{extension.name.slice(0, 2).toUpperCase()}</div>
                        <div className="extension-copy">
                          <div className="extension-name">{extension.name}</div>
                          <div className="extension-description">{extension.description}</div>
                        </div>
                        <span className={`extension-status ${extension.enabled ? 'enabled' : ''}`}>
                          {extension.enabled ? 'Enabled' : 'Preview'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeLeftIcon === 'remote' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>REMOTE EXPLORER</span>
                  </div>
                  <div className="tool-panel-list">
                    <button type="button" className="tool-panel-row">
                      <Codicon name="server" />
                      <span>SSH Targets</span>
                    </button>
                    <button type="button" className="tool-panel-row">
                      <Codicon name="vm" />
                      <span>WSL Targets</span>
                    </button>
                    <button type="button" className="tool-panel-row">
                      <Codicon name="repo-clone" />
                      <span>Dev Containers</span>
                    </button>
                  </div>
                </div>
              )}
              {activeLeftIcon === 'github' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>GITHUB</span>
                  </div>
                  <div className="github-panel">
                    <button type="button" className="primary-action" onClick={() => handleMenuAction('github.signIn')}>
                      Sign in to GitHub
                    </button>
                    <div className="debug-section">
                      <div className="debug-section-title">Pull Requests</div>
                      <div className="debug-section-body">Connect GitHub to review pull requests and issues here.</div>
                    </div>
                    <div className="debug-section">
                      <div className="debug-section-title">Actions</div>
                      <div className="debug-section-body">Workflow runs will appear after GitHub integration is connected.</div>
                    </div>
                  </div>
                </div>
              )}
              {activeLeftIcon === 'account' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>ACCOUNTS</span>
                  </div>
                  <div className="tool-panel-list">
                    <button type="button" className="tool-panel-row" onClick={() => handleMenuAction('github.signIn')}>
                      <Codicon name="github" />
                      <span>Sign in with GitHub</span>
                    </button>
                    <button type="button" className="tool-panel-row">
                      <Codicon name="sync" />
                      <span>Turn on Settings Sync</span>
                    </button>
                  </div>
                </div>
              )}
              {activeLeftIcon === 'more' && (
                <div className="panel-content">
                  <div className="sidebar-header">
                    <span>MORE VIEWS</span>
                  </div>
                  <div className="tool-panel-list">
                    {['Testing', 'Timeline', 'Outline', 'Ports', 'Problems', 'Output'].map((label) => (
                      <button key={label} type="button" className="tool-panel-row">
                        <Codicon name="window" />
                        <span>{label}</span>
                      </button>
                    ))}
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
                <span className="tab-close">x</span>
              </div>
            </div>
            <div className="editor-breadcrumbs">
              {breadcrumbs.length > 0 ? (
                breadcrumbs.map((part, index) => (
                  <span key={`${part}-${index}`} className="breadcrumb-item">
                    {part}
                  </span>
                ))
              ) : (
                <span className="breadcrumb-item">Untitled</span>
              )}
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
                {BOTTOM_TABS.map((tab) => (
                  <div
                    key={tab}
                    className={`bottom-tab ${activeBottomTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab(tab)}
                  >
                    {tab === 'PROBLEMS' ? 'Problems' : tab === 'DEBUG CONSOLE' ? 'Debug Console' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    {tab === 'PROBLEMS' && <span className="tab-counter">0</span>}
                  </div>
                ))}
                <div className="bottom-panel-actions">
                  <span className="terminal-profile"><Codicon name="terminal-powershell" /> powershell</span>
                  <button type="button" title="New Terminal" onClick={() => handleMenuAction('terminal.new')}><Codicon name="add" /></button>
                  <button type="button" title="Split Terminal" onClick={() => handleMenuAction('terminal.split')}><Codicon name="split-horizontal" /></button>
                  <button type="button" title="Kill Terminal" onClick={() => handleMenuAction('terminal.kill')}><Codicon name="trash" /></button>
                  <button type="button" title="More Actions"><Codicon name="ellipsis" /></button>
                  <button type="button" title="Maximize Panel"><Codicon name="screen-full" /></button>
                </div>
                <button
                  type="button"
                  className="bottom-panel-close"
                  onClick={() => setBottomPanelOpen(false)}
                  title="Hide Bottom Panel"
                >
                  x
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
                    <div className="panel-empty-title">No problems detected</div>
                    <div className="panel-empty-copy">Build and diagnostics output will appear here as the language service layer grows.</div>
                  </div>
                )}
                {activeBottomTab === 'OUTPUT' && (
                  <div className="output-panel">
                    <div>[CodeForge] Workspace files: {workspaceFiles.length}</div>
                    <div>[CodeForge] Git branch: {gitInfo.branch || 'unknown'}{gitInfo.isDirty ? ' (dirty)' : ''}</div>
                    <div>[CodeForge] Source control changes: {gitChanges.length}</div>
                  </div>
                )}
                {activeBottomTab === 'DEBUG CONSOLE' && (
                  <div className="debug-console">
                    <div>Debug console ready. Start a debug session from Run and Debug.</div>
                  </div>
                )}
                {activeBottomTab === 'PORTS' && (
                  <div className="ports-panel">
                    <div className="ports-grid">
                      <span>Port</span>
                      <span>Process</span>
                      <span>Status</span>
                      <span>5173</span>
                      <span>Vite dev server</span>
                      <span>Available when dev script is running</span>
                    </div>
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
            <div className="sidebar-header ai-header">
              <span>CHAT</span>
              <div className="panel-header-actions">
                <button type="button" title="New Chat"><Codicon name="add" /></button>
                <button type="button" title="Chat Options"><Codicon name="chevron-down" /></button>
                <button type="button" title="Settings"><Codicon name="settings-gear" /></button>
                <button type="button" title="More Actions"><Codicon name="ellipsis" /></button>
                <button type="button" title="Maximize Panel"><Codicon name="screen-full" /></button>
                <button type="button" title="Close Chat" onClick={() => setAiPanelOpen(false)}><Codicon name="close" /></button>
              </div>
            </div>
            <AIPanel
              activeFile={activeFile}
              editorCode={editorCode}
              onApplyCode={(nextCode) => {
                setEditorCode(nextCode || '');
                setIsDirty(true);
              }}
            />
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
          {'^'}
        </button>
      )}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-item" title="Source Control">
            <span className="status-glyph">{'<'}</span>
          </span>
          <span className="status-item" title="Git Branch">
            <span className="status-branch-icon">git</span>
            <span className="status-branch-text">
              {gitInfo.branch || '-'}
              {gitInfo.isDirty ? '*' : ''}
            </span>
          </span>
          <button type="button" className="status-item status-btn" title="Synchronize Changes" onClick={() => { refreshGitStatus(); refreshGitInfo(); }}>
            refresh
          </button>
          <span className="status-item" title="Errors">x 0</span>
          <span className="status-item" title="Warnings">! 0</span>
        </div>
        <div className="status-right">
          <span className="status-item">{isDirty ? 'unsaved' : 'saved'}</span>
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
