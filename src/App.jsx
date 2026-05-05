import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AIPanel from './features/ai/AIPanel';
import './index.css';

// Constants
import { MENU_DEFINITIONS } from './shared/constants/menuDefinitions';

// Shared Components
import TitleBar from './shared/components/TitleBar';
import MenuBar from './shared/components/MenuBar';
import ActivityBar from './shared/components/ActivityBar';
import SidebarPanel from './shared/components/SidebarPanel';
import EditorArea from './shared/components/EditorArea';
import BottomPanel from './shared/components/BottomPanel';
import StatusBar from './shared/components/StatusBar';
import SettingsModal from './shared/components/SettingsModal';

// Hooks
import { useGitManagement } from './shared/hooks/useGitManagement';
import { useSearchManagement } from './shared/hooks/useSearchManagement';
import { useFileManagement } from './shared/hooks/useFileManagement';
import { useLayoutManagement } from './shared/hooks/useLayoutManagement';
import { useMenuManagement } from './shared/hooks/useMenuManagement';

function App() {
  const menuRefs = useRef({});
  const [toast, setToast] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [terminalMeta, setTerminalMeta] = useState({ count: 1, activeName: '1: PowerShell' });

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Hook Initialization
  const fileMgmt = useFileManagement(showToast);
  const layoutMgmt = useLayoutManagement();
  const gitMgmt = useGitManagement(showToast, fileMgmt.workspaceFiles);
  const searchMgmt = useSearchManagement(showToast, fileMgmt.activeFilePath, fileMgmt.setEditorCode, fileMgmt.setIsDirty);
  const menuMgmt = useMenuManagement(showToast);

  const activeMenu = useMemo(
    () => MENU_DEFINITIONS.find((menu) => menu.id === menuMgmt.activeMenuId) || null,
    [menuMgmt.activeMenuId]
  );

  const quickResults = useMemo(() => {
    return menuMgmt.getQuickResults(fileMgmt.workspaceFiles);
  }, [menuMgmt, fileMgmt.workspaceFiles]);

  const executeEditorCommand = useCallback((command) => {
    window.dispatchEvent(new CustomEvent('cf:editor-command', { detail: { command } }));
  }, []);

  const executeTerminalCommand = useCallback((command) => {
    window.dispatchEvent(new CustomEvent('cf:terminal-command', { detail: { command } }));
  }, []);

  const openBottomTab = useCallback((tabId) => {
    layoutMgmt.setBottomPanelOpen(true);
    layoutMgmt.setActiveBottomTab(tabId);
  }, [layoutMgmt]);

  const openSidebarView = useCallback((viewId) => {
    layoutMgmt.setSidebarOpen(true);
    layoutMgmt.setActiveLeftIcon(viewId);
  }, [layoutMgmt]);

  const openCommandPalette = useCallback(() => {
    menuMgmt.setSearchFocused(true);
    menuMgmt.setQuickSearch('');
    const input = document.querySelector('.title-bar-input');
    input?.focus();
  }, [menuMgmt]);

  const handleMenuAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'file.new':
          fileMgmt.setActiveFilePath(null);
          fileMgmt.setEditorCode('');
          fileMgmt.setIsDirty(false);
          break;
        case 'file.newFilePrompt': {
          const fileName = window.prompt('Enter new file name:', 'newfile.js');
          if (fileName) {
            fileMgmt.setActiveFilePath(null);
            fileMgmt.setEditorCode('');
            fileMgmt.setIsDirty(false);
            showToast(`New file ${fileName} created (Save to persist)`);
          }
          break;
        }
        case 'file.newWindow':
          if (window.codeforge?.newWindow) {
            await window.codeforge.newWindow();
          } else {
            window.open(window.location.href, '_blank', 'noopener,noreferrer');
          }
          break;
        case 'file.open': {
          if (!window.codeforge?.pickFile) break;
          const selected = await window.codeforge.pickFile();
          if (!selected) break;
          await fileMgmt.loadFileByPath(selected);
          break;
        }
        case 'file.openFolder': {
          if (!window.codeforge?.pickFolder) {
            showToast('Open Folder is available in desktop app mode only.', 'warn');
            break;
          }
          const folder = await window.codeforge.pickFolder();
          if (!folder) break;
          
          if (window.codeforge.setWorkspace) {
            await window.codeforge.setWorkspace(folder);
            const name = folder.split(/[\\/]/).pop() || folder;
            fileMgmt.setWorkspaceName(name.toUpperCase());
            await fileMgmt.refreshWorkspaceFiles();
            fileMgmt.setOpenFiles([]);
            fileMgmt.setActiveFilePath(null);
            fileMgmt.setEditorCode('');
            showToast(`Opened folder: ${folder}`);
          }
          
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'new', cwd: folder });
          break;
        }
        case 'file.openRecent':
          showToast('Open Recent is not available yet.', 'warn');
          break;
        case 'file.addFolderToWorkspace': {
          if (!window.codeforge?.pickFolder) break;
          const folder = await window.codeforge.pickFolder();
          if (folder) showToast(`Added ${folder} to workspace`);
          break;
        }
        case 'file.saveWorkspaceAs':
        case 'file.duplicateWorkspace':
          showToast('Workspace management coming soon.', 'info');
          break;
        case 'file.save':
          await fileMgmt.saveCurrentFile();
          break;
        case 'file.saveAs': {
          if (!window.codeforge?.saveFileAs) break;
          const currentName = fileMgmt.activeFilePath ? fileMgmt.activeFilePath.split(/[\\/]/).pop() : 'untitled.txt';
          const savedPath = await window.codeforge.saveFileAs(fileMgmt.editorCode, currentName);
          if (!savedPath) break;
          fileMgmt.setActiveFilePath(savedPath);
          fileMgmt.setOpenFiles(prev => {
            const name = savedPath.split(/[\\/]/).pop();
            if (prev.find(f => f.path === savedPath)) return prev;
            return [...prev, { path: savedPath, name, isDirty: false }];
          });
          fileMgmt.setIsDirty(false);
          showToast('File saved as new copy');
          break;
        }
        case 'file.saveAll':
          await fileMgmt.saveCurrentFile();
          break;
        case 'file.autoSave':
          fileMgmt.setAutoSaveEnabled((prev) => !prev);
          break;
        case 'file.preferences':
          setSettingsModalOpen(true);
          break;
        case 'file.revertFile':
          if (fileMgmt.activeFilePath) {
            await fileMgmt.loadFileByPath(fileMgmt.activeFilePath);
            showToast('File reverted to last saved state');
          }
          break;
        case 'file.closeEditor':
          if (fileMgmt.activeFilePath) {
            fileMgmt.closeFile(fileMgmt.activeFilePath);
          }
          break;
        case 'file.closeFolder':
          fileMgmt.setWorkspaceFiles([]);
          fileMgmt.setOpenFiles([]);
          fileMgmt.setActiveFilePath(null);
          fileMgmt.setEditorCode('');
          showToast('Folder closed');
          break;
        case 'file.closeWindow':
        case 'file.exit':
          if (window.codeforge?.windowAction) {
            await window.codeforge.windowAction('close');
          } else {
            window.close();
          }
          break;

        case 'edit.undo':
        case 'edit.redo':
        case 'edit.cut':
        case 'edit.copy':
        case 'edit.paste':
        case 'edit.selectAll':
        case 'edit.find':
        case 'edit.replace':
        case 'edit.toggleComment':
        case 'edit.toggleBlockComment':
        case 'edit.emmetExpand':
        case 'edit.formatDocument':
        case 'selection.selectAll':
        case 'selection.selectLine':
        case 'selection.copyLineUp':
        case 'selection.copyLineDown':
        case 'selection.moveLineUp':
        case 'selection.moveLineDown':
        case 'selection.expand':
        case 'selection.shrink':
        case 'go.symbol':
        case 'go.line':
        case 'go.definition':
        case 'go.reference':
        case 'run.breakpoint':
          executeEditorCommand(action);
          break;

        case 'edit.findInFiles':
        case 'edit.replaceInFiles':
          openSidebarView('search');
          break;

        case 'view.commandPalette':
          openCommandPalette();
          break;
        case 'view.openExplorer':
          openSidebarView('explorer');
          break;
        case 'view.openSearch':
          openSidebarView('search');
          break;
        case 'view.openSourceControl':
          openSidebarView('source-control');
          break;
        case 'view.openRun':
          openSidebarView('debug');
          break;
        case 'view.openExtensions':
          openSidebarView('extensions');
          break;
        case 'view.toggleSidebar':
          layoutMgmt.setSidebarOpen((prev) => !prev);
          break;
        case 'view.toggleActivityBar':
          layoutMgmt.setActivityBarVisible((prev) => !prev);
          break;
        case 'view.toggleAI':
          layoutMgmt.setAiPanelOpen((prev) => !prev);
          break;
        case 'view.togglePanel':
          layoutMgmt.setBottomPanelOpen((prev) => !prev);
          break;
        case 'view.toggleStatusBar':
          layoutMgmt.setStatusBarVisible((prev) => !prev);
          break;
        case 'view.toggleWordWrap':
          layoutMgmt.setUiSettings((prev) => ({ ...prev, wordWrap: !prev.wordWrap }));
          break;
        case 'view.toggleFullScreen':
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await document.documentElement.requestFullscreen();
          }
          break;
        case 'view.showProblems':
          openBottomTab('PROBLEMS');
          break;
        case 'view.showOutput':
          openBottomTab('OUTPUT');
          break;
        case 'view.showDebugConsole':
          openBottomTab('DEBUG CONSOLE');
          break;
        case 'view.showTerminal':
          openBottomTab('TERMINAL');
          break;

        case 'go.back':
          window.history.back();
          break;
        case 'go.forward':
          window.history.forward();
          break;
        case 'go.file':
          openCommandPalette();
          break;

        case 'run.debug':
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'run', command: 'npm run dev' });
          break;
        case 'run.noDebug':
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'run', command: 'npm run build' });
          break;
        case 'run.stopDebug':
          showToast('Debug adapter is not connected yet.', 'warn');
          break;
        case 'run.task': {
          const taskCommand = window.prompt('Enter terminal command to run', 'npm run build');
          if (!taskCommand) break;
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'run', command: taskCommand });
          break;
        }

        case 'terminal.new':
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'new' });
          break;
        case 'terminal.split':
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'split' });
          break;
        case 'terminal.kill':
          executeTerminalCommand({ action: 'kill' });
          break;
        case 'terminal.clear':
          executeTerminalCommand({ action: 'clear' });
          break;
        case 'terminal.runTask': {
          const taskCommand = window.prompt('Enter terminal command to run', 'npm run build');
          if (!taskCommand) break;
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'run', command: taskCommand });
          break;
        }
        case 'terminal.cwdWorkspace':
          openBottomTab('TERMINAL');
          executeTerminalCommand({ action: 'new', cwd: '.' });
          break;
        case 'terminal.selectDefaultProfile':
          showToast('Default profile picker will be added next.', 'warn');
          break;

        case 'help.welcome':
          showToast('Welcome to CodeForge VS mode');
          break;
        case 'help.documentation':
          window.open('https://code.visualstudio.com/docs', '_blank', 'noopener,noreferrer');
          break;
        case 'help.shortcutReference':
          window.open('https://code.visualstudio.com/docs/reference/default-keybindings', '_blank', 'noopener,noreferrer');
          break;
        case 'help.learn':
          window.open('https://github.com/sivmsrma/CodeForge', '_blank', 'noopener,noreferrer');
          break;
        case 'help.about':
          window.alert('CodeForge\nVS Code-style shell with Monaco editor + integrated terminal.');
          break;
        default:
          break;
      }
    } catch (error) {
      showToast(error?.message || 'Unable to complete action.', 'error');
    }
  }, [fileMgmt, layoutMgmt, executeEditorCommand, executeTerminalCommand, openBottomTab, openCommandPalette, openSidebarView, showToast]);

  const getMenuCheckState = useCallback((actionId) => {
    switch (actionId) {
      case 'file.autoSave':
        return fileMgmt.autoSaveEnabled;
      case 'view.toggleSidebar':
        return layoutMgmt.sidebarOpen;
      case 'view.toggleActivityBar':
        return layoutMgmt.activityBarVisible;
      case 'view.toggleAI':
        return layoutMgmt.aiPanelOpen;
      case 'view.togglePanel':
        return layoutMgmt.bottomPanelOpen;
      case 'view.toggleStatusBar':
        return layoutMgmt.statusBarVisible;
      case 'view.toggleWordWrap':
        return layoutMgmt.uiSettings.wordWrap;
      default:
        return false;
    }
  }, [fileMgmt.autoSaveEnabled, layoutMgmt]);

  const applyQuickSearchResult = useCallback(async (result) => {
    if (!result) return;
    if (result.type === 'file') {
      await fileMgmt.loadFileByPath(result.value);
    } else if (result.type === 'action') {
      await handleMenuAction(result.value);
    }
    menuMgmt.setQuickSearch('');
    menuMgmt.setSearchCursor(0);
    menuMgmt.setSearchFocused(false);
  }, [fileMgmt, handleMenuAction, menuMgmt]);

  // Window/Event Listeners
  useEffect(() => {
    const handleMouseMove = (event) => {
      layoutMgmt.handleSidebarResize(event);
      layoutMgmt.handleBottomResize(event);
      layoutMgmt.handleAIResize(event);
      if (gitMgmt.isResizingScGraph) {
        const scPanel = document.querySelector('.sc-panel');
        if (scPanel) {
          const rect = scPanel.getBoundingClientRect();
          const newHeight = rect.bottom - event.clientY;
          if (newHeight >= 100 && newHeight <= 500) {
            gitMgmt.setScGraphHeight(newHeight);
          }
        }
      }
    };

    const handleMouseUp = () => {
      layoutMgmt.setIsResizingSidebar(false);
      layoutMgmt.setIsResizingBottom(false);
      layoutMgmt.setIsResizingAI(false);
      gitMgmt.setIsResizingScGraph(false);
    };

    if (layoutMgmt.isResizingSidebar || layoutMgmt.isResizingBottom || layoutMgmt.isResizingAI || gitMgmt.isResizingScGraph) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [layoutMgmt, gitMgmt]);

  useEffect(() => {
    const handleMouseDown = () => {
      menuMgmt.setActiveMenuId(null);
      setSettingsOpen(false);
      gitMgmt.setCommitMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        menuMgmt.setActiveMenuId(null);
        setSettingsOpen(false);
        menuMgmt.setSearchFocused(false);
      }
    };

    document.addEventListener('click', handleMouseDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuMgmt, gitMgmt]);

  useEffect(() => {
    const onShortcut = (event) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (ctrlOrMeta && event.shiftKey && key === 'p') {
        event.preventDefault();
        openCommandPalette();
        return;
      }
      if (ctrlOrMeta && key === 'p') {
        event.preventDefault();
        openCommandPalette();
        return;
      }
      if (ctrlOrMeta && key === ',') {
        event.preventDefault();
        setSettingsModalOpen(true);
        return;
      }
      if (ctrlOrMeta && key === 's') {
        event.preventDefault();
        handleMenuAction('file.save');
        return;
      }
      if (ctrlOrMeta && key === 'b') {
        event.preventDefault();
        handleMenuAction('view.toggleSidebar');
        return;
      }
      if (ctrlOrMeta && key === 'j') {
        event.preventDefault();
        handleMenuAction('view.togglePanel');
        return;
      }
      if (ctrlOrMeta && event.key === '`') {
        event.preventDefault();
        handleMenuAction('view.showTerminal');
      }
    };

    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, [handleMenuAction, openCommandPalette]);

  useEffect(() => {
    if (!window.codeforge?.onMenuAction) return undefined;
    return window.codeforge.onMenuAction((action) => handleMenuAction(action));
  }, [handleMenuAction]);

  useEffect(() => {
    if (!window.codeforge?.onWindowMaximized) return undefined;
    return window.codeforge.onWindowMaximized((maximized) => setIsWindowMaximized(maximized));
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const details = event.detail || {};
      setTerminalMeta({
        count: Number(details.count) > 0 ? Number(details.count) : 1,
        activeName: details.activeName || '1: PowerShell'
      });
    };
    window.addEventListener('cf:terminal-state', handler);
    return () => window.removeEventListener('cf:terminal-state', handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const targetPath = String(event?.detail?.path || '').trim();
      openSidebarView('search');
      if (targetPath) searchMgmt.setLeftSearchQuery(targetPath);
    };
    window.addEventListener('cf:explorer-search-focus', handler);
    return () => window.removeEventListener('cf:explorer-search-focus', handler);
  }, [openSidebarView, searchMgmt]);

  return (
    <div className={`app-container ${layoutMgmt.isResizingSidebar || layoutMgmt.isResizingBottom || layoutMgmt.isResizingAI ? 'resizing' : ''}`}>
      <TitleBar 
        activeFilePath={fileMgmt.activeFilePath}
        isWindowMaximized={isWindowMaximized}
        quickSearch={menuMgmt.quickSearch}
        setQuickSearch={menuMgmt.setQuickSearch}
        searchFocused={menuMgmt.searchFocused}
        setSearchFocused={menuMgmt.setSearchFocused}
        quickResults={quickResults}
        searchCursor={menuMgmt.searchCursor}
        setSearchCursor={menuMgmt.setSearchCursor}
        applyQuickSearchResult={applyQuickSearchResult}
        handleMenuAction={handleMenuAction}
        openMenu={(id) => menuMgmt.openMenu(id, menuRefs)}
        activeMenuId={menuMgmt.activeMenuId}
        setActiveMenuId={menuMgmt.setActiveMenuId}
        menuRefs={menuRefs}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        setSettingsModalOpen={setSettingsModalOpen}
        uiSettings={layoutMgmt.uiSettings}
        setUiSettings={layoutMgmt.setUiSettings}
        openCommandPalette={openCommandPalette}
      />

      <MenuBar 
        activeMenu={activeMenu}
        menuPosition={menuMgmt.menuPosition}
        getMenuCheckState={getMenuCheckState}
        activeSubMenu={menuMgmt.activeSubMenu}
        setActiveSubMenu={menuMgmt.setActiveSubMenu}
        subMenuPos={menuMgmt.subMenuPos}
        setSubMenuPos={menuMgmt.setSubMenuPos}
        handleMenuAction={handleMenuAction}
        setActiveMenuId={menuMgmt.setActiveMenuId}
        recentFiles={fileMgmt.recentFiles}
        loadFileByPath={fileMgmt.loadFileByPath}
      />

      <div className="main-container">
        <ActivityBar 
          activeLeftIcon={layoutMgmt.activeLeftIcon}
          setActiveLeftIcon={layoutMgmt.setActiveLeftIcon}
          activityBarVisible={layoutMgmt.activityBarVisible}
          sourceControlCount={gitMgmt.sourceControlCount}
          sourceControlTotal={gitMgmt.sourceControlTotal}
          setSettingsModalOpen={setSettingsModalOpen}
        />

        <SidebarPanel 
          sidebarOpen={layoutMgmt.sidebarOpen}
          setSidebarOpen={layoutMgmt.setSidebarOpen}
          sidebarWidth={layoutMgmt.sidebarWidth}
          setIsResizingSidebar={layoutMgmt.setIsResizingSidebar}
          activeLeftIcon={layoutMgmt.activeLeftIcon}
          activeFilePath={fileMgmt.activeFilePath}
          workspaceFiles={fileMgmt.workspaceFiles}
          workspaceName={fileMgmt.workspaceName}
          gitMap={gitMgmt.gitMap}
          refreshWorkspaceFiles={fileMgmt.refreshWorkspaceFiles}
          loadFileByPath={fileMgmt.loadFileByPath}
          performSearch={searchMgmt.performSearch}
          leftSearchQuery={searchMgmt.leftSearchQuery}
          setLeftSearchQuery={searchMgmt.setLeftSearchQuery}
          setSearchResults={searchMgmt.setSearchResults}
          isReplaceOpen={searchMgmt.isReplaceOpen}
          setIsReplaceOpen={searchMgmt.setIsReplaceOpen}
          searchOptions={searchMgmt.searchOptions}
          setSearchOptions={searchMgmt.setSearchOptions}
          replaceQuery={searchMgmt.replaceQuery}
          setReplaceQuery={searchMgmt.setReplaceQuery}
          handleReplaceAll={searchMgmt.handleReplaceAll}
          isSearching={searchMgmt.isSearching}
          searchResults={searchMgmt.searchResults}
          handleReplace={searchMgmt.handleReplace}
          gitInfo={gitMgmt.gitInfo}
          gitCommitMessage={gitMgmt.gitCommitMessage}
          setGitCommitMessage={gitMgmt.setGitCommitMessage}
          handleGitCommit={gitMgmt.handleGitCommit}
          commitMenuOpen={gitMgmt.commitMenuOpen}
          setCommitMenuOpen={gitMgmt.setCommitMenuOpen}
          handleGitAmend={gitMgmt.handleGitAmend}
          handleGitPush={gitMgmt.handleGitPush}
          handleGitSync={gitMgmt.handleGitSync}
          handleGitDiscard={(path) => gitMgmt.handleGitDiscard(path, fileMgmt.activeFilePath, fileMgmt.loadFileByPath)}
          handleGitAdd={gitMgmt.handleGitAdd}
          getFileIcon={(path) => {
            const ext = path.split('.').pop().toLowerCase();
            if (ext === 'json') return { name: 'json', color: '#cbcb41' };
            if (ext === 'js' || ext === 'cjs' || ext === 'mjs') return { name: 'javascript', color: '#f1e05a' };
            if (ext === 'jsx' || ext === 'tsx') return { name: 'react', color: '#61dafb' };
            if (ext === 'css' || ext === 'scss') return { name: 'style', color: '#563d7c' };
            if (ext === 'md') return { name: 'markdown', color: '#083fa1' };
            return { name: 'VscFileCode', color: '#cccccc' };
          }}
          setIsResizingScGraph={gitMgmt.setIsResizingScGraph}
          scGraphHeight={gitMgmt.scGraphHeight}
          gitHistory={gitMgmt.gitHistory}
          refreshGitStatus={gitMgmt.refreshGitStatus}
          refreshGitInfo={gitMgmt.refreshGitInfo}
          refreshGitHistory={gitMgmt.refreshGitHistory}
          showToast={showToast}
          handleMenuAction={handleMenuAction}
        />

        <div className="content-area">
          <EditorArea 
            openFiles={fileMgmt.openFiles}
            activeFilePath={fileMgmt.activeFilePath}
            setActiveFilePath={fileMgmt.setActiveFilePath}
            closeFile={fileMgmt.closeFile}
            editorCode={fileMgmt.editorCode}
            setEditorCode={fileMgmt.setEditorCode}
            setIsDirty={fileMgmt.setIsDirty}
            setOpenFiles={fileMgmt.setOpenFiles}
            uiSettings={layoutMgmt.uiSettings}
            getFileIcon={(path) => {
              const ext = path.split('.').pop().toLowerCase();
              if (ext === 'json') return { name: 'json', color: '#cbcb41' };
              if (ext === 'js' || ext === 'cjs' || ext === 'mjs') return { name: 'javascript', color: '#f1e05a' };
              if (ext === 'jsx' || ext === 'tsx') return { name: 'react', color: '#61dafb' };
              if (ext === 'css' || ext === 'scss') return { name: 'style', color: '#563d7c' };
              if (ext === 'md') return { name: 'markdown', color: '#083fa1' };
              return { name: 'VscFileCode', color: '#cccccc' };
            }}
          />

          <BottomPanel 
            bottomPanelOpen={layoutMgmt.bottomPanelOpen}
            setBottomPanelOpen={layoutMgmt.setBottomPanelOpen}
            bottomPanelHeight={layoutMgmt.bottomPanelHeight}
            setIsResizingBottom={layoutMgmt.setIsResizingBottom}
            activeBottomTab={layoutMgmt.activeBottomTab}
            setActiveBottomTab={layoutMgmt.setActiveBottomTab}
            workspaceFiles={fileMgmt.workspaceFiles}
          />
        </div>

        {layoutMgmt.aiPanelOpen && (
          <div className="sidebar ai-panel" style={{ width: `${layoutMgmt.aiPanelWidth}px`, position: 'relative' }}>
            <div className="resize-handle vertical-left" onMouseDown={() => layoutMgmt.setIsResizingAI(true)} />
            <div className="sidebar-header"><span>AI Chat</span></div>
            <AIPanel />
          </div>
        )}
      </div>

      <StatusBar 
        statusBarVisible={layoutMgmt.statusBarVisible}
        gitInfo={gitMgmt.gitInfo}
        sourceControlTotal={gitMgmt.sourceControlTotal}
        terminalMeta={terminalMeta}
        setActiveLeftIcon={layoutMgmt.setActiveLeftIcon}
      />

      <SettingsModal 
        settingsModalOpen={settingsModalOpen}
        setSettingsModalOpen={setSettingsModalOpen}
        uiSettings={layoutMgmt.uiSettings}
        setUiSettings={layoutMgmt.setUiSettings}
        autoSaveEnabled={fileMgmt.autoSaveEnabled}
        setAutoSaveEnabled={fileMgmt.setAutoSaveEnabled}
      />

      {toast && (
        <div className={`app-toast ${toast.tone}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
