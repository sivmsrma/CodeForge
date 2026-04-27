import React, { useEffect, useMemo, useState } from 'react';

function FilePanel({ activeFilePath, onFileSelect, workspaceFiles = [], onWorkspaceRefresh, gitMap = {} }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
  const [contextMenu, setContextMenu] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [dialogInput, setDialogInput] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');

  const files = useMemo(() => {
    const root = { name: 'CODEFORGE', path: '', type: 'folder', children: [] };
    const nodeMap = new Map();

    const ensureFolder = (folderPath) => {
      if (!folderPath) return root.children;
      if (nodeMap.has(folderPath)) return nodeMap.get(folderPath).children;

      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');
      const parentChildren = ensureFolder(parentPath);
      const folderNode = {
        name: folderName,
        path: folderPath,
        type: 'folder',
        children: []
      };
      parentChildren.push(folderNode);
      nodeMap.set(folderPath, folderNode);
      return folderNode.children;
    };

    workspaceFiles.forEach((filePath) => {
      const normalized = filePath.replaceAll('\\', '/');
      const parts = normalized.split('/');
      const fileName = parts[parts.length - 1];
      const folderPath = parts.slice(0, -1).join('/');
      const parentChildren = ensureFolder(folderPath);
      parentChildren.push({
        name: fileName,
        path: normalized,
        type: 'file'
      });
    });

    const sortNodes = (items) => {
      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      items.forEach((item) => {
        if (item.type === 'folder') sortNodes(item.children);
      });
    };
    sortNodes(root.children);

    const rank = { M: 4, U: 3, A: 2, D: 1 };
    const better = (a, b) => {
      if (!a) return b;
      if (!b) return a;
      return (rank[b] || 0) > (rank[a] || 0) ? b : a;
    };

    const computeFolderGit = (node) => {
      if (!node || node.type !== 'folder') return null;
      let best = null;
      for (const child of node.children || []) {
        if (child.type === 'file') {
          best = better(best, gitMap[child.path]);
        } else if (child.type === 'folder') {
          const childBest = computeFolderGit(child);
          child.git = childBest;
          best = better(best, childBest);
        }
      }
      node.git = best;
      return best;
    };
    computeFolderGit(root);
    return root;
  }, [gitMap, workspaceFiles]);

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName) => {
    const extension = (fileName.split('.').pop() || '').toLowerCase();
    const map = {
      js: { kind: 'text', text: 'JS', color: '#f1e05a' },
      cjs: { kind: 'text', text: 'JS', color: '#f1e05a' },
      mjs: { kind: 'text', text: 'JS', color: '#f1e05a' },
      ts: { kind: 'text', text: 'TS', color: '#3178c6' },
      tsx: { kind: 'text', text: 'TS', color: '#3178c6' },
      jsx: { kind: 'react', color: '#61dafb' },
      css: { kind: 'hash', color: '#a074c4' },
      json: { kind: 'braces', color: '#cbcb41' },
      md: { kind: 'doc', color: '#8b949e' },
      html: { kind: 'angle', color: '#e34c26' },
      yml: { kind: 'text', text: 'YML', color: '#aab2bd' },
      yaml: { kind: 'text', text: 'YML', color: '#aab2bd' },
      txt: { kind: 'doc', color: '#8b949e' }
    };
    return map[extension] || { kind: 'text', text: extension ? extension.toUpperCase().slice(0, 3) : 'FILE', color: '#8b949e' };
  };

  const renderIcon = (meta) => {
    if (!meta) return null;
    if (meta.kind === 'react') {
      return (
        <svg viewBox="0 0 24 24" className="file-icon-svg" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 14.6c1.44 0 2.6-1.17 2.6-2.6S13.44 9.4 12 9.4 9.4 10.57 9.4 12s1.17 2.6 2.6 2.6Zm0-11c2.08 0 4.05.34 5.58.94 1.8.7 2.9 1.72 2.9 2.9 0 1.12-.98 2.08-2.52 2.76.22.62.34 1.27.34 1.94 0 .67-.12 1.32-.34 1.94 1.54.68 2.52 1.64 2.52 2.76 0 1.18-1.1 2.2-2.9 2.9-1.53.6-3.5.94-5.58.94-2.08 0-4.05-.34-5.58-.94-1.8-.7-2.9-1.72-2.9-2.9 0-1.12.98-2.08 2.52-2.76A5.8 5.8 0 0 1 5.8 12c0-.67.12-1.32.34-1.94C4.6 9.38 3.62 8.42 3.62 7.3c0-1.18 1.1-2.2 2.9-2.9C7.95 3.8 9.92 3.6 12 3.6Zm0 2c-1.84 0-3.55.29-4.88.8-1.03.4-1.5.82-1.5.9 0 .1.52.55 1.72 1.03 1.15.46 2.68.8 4.66.95.63-1.02 1.35-1.92 2.14-2.66-.66-.67-1.36-1.23-2.14-1.62Zm2.76 2.82c-.63.6-1.22 1.34-1.76 2.18.32.5.62 1.02.9 1.56.6-.08 1.16-.2 1.68-.34.3-.66.46-1.4.46-2.14 0-.43-.05-.85-.12-1.26-.36 0-.75 0-1.16 0Zm-5.52 0c-.41 0-.8 0-1.16 0-.07.41-.12.83-.12 1.26 0 .74.16 1.48.46 2.14.52.14 1.08.26 1.68.34.28-.54.58-1.06.9-1.56-.54-.84-1.13-1.58-1.76-2.18Zm2.76 1.58c.34.54.66 1.1.94 1.68.36 0 .72.02 1.08.02.36 0 .72-.01 1.08-.02.28-.58.6-1.14.94-1.68-.34-.54-.66-1.1-.94-1.68-.36 0-.72-.02-1.08-.02-.36 0-.72.01-1.08.02-.28.58-.6 1.14-.94 1.68Zm-5.96 1.94c-1.2.48-1.72.93-1.72 1.03 0 .08.47.5 1.5.9 1.33.51 3.04.8 4.88.8.78-.39 1.48-.95 2.14-1.62-.79-.74-1.5-1.64-2.14-2.66-1.98.15-3.51.49-4.66.95Zm11.92 0c-1.15-.46-2.68-.8-4.66-.95-.63 1.02-1.35 1.92-2.14 2.66.66.67 1.36 1.23 2.14 1.62 1.84 0 3.55-.29 4.88-.8 1.03-.4 1.5-.82 1.5-.9 0-.1-.52-.55-1.72-1.03Z"
          />
        </svg>
      );
    }
    if (meta.kind === 'hash') return <span className="file-icon-text">#</span>;
    if (meta.kind === 'braces') return <span className="file-icon-text">{'{}'}</span>;
    if (meta.kind === 'doc') return <span className="codicon codicon-file-text file-codicon" aria-hidden="true" />;
    if (meta.kind === 'angle') return <span className="file-icon-text">{'<>'}</span>;
    return <span className="file-icon-text">{meta.text}</span>;
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('blur', closeMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('blur', closeMenu);
    };
  }, []);

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item
    });
  };

  const openDialog = (type) => {
    if (!contextMenu) return;
    const item = contextMenu.item;
    const itemPath = item?.path || '';
    const isFolder = item?.type === 'folder';
    const basePath = isFolder ? itemPath : itemPath.split('/').slice(0, -1).join('/');
    const currentName = itemPath.split('/').pop() || '';
    setDialog({ type, itemPath, isFolder, basePath, currentName });
    setDialogInput(type === 'rename' ? currentName : '');
    setDialogError('');
    setContextMenu(null);
  };

  const openRootDialog = (type) => {
    const itemPath = '';
    const isFolder = true;
    const basePath = '';
    const currentName = 'CODEFORGE';
    setDialog({ type, itemPath, isFolder, basePath, currentName });
    setDialogInput('');
    setDialogError('');
    setContextMenu(null);
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogInput('');
    setDialogError('');
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const runAction = async (action) => {
    if (!contextMenu) return;
    const item = contextMenu.item;
    const itemPath = item?.path || '';
    const isFolder = item?.type === 'folder';
    const basePath = isFolder ? itemPath : itemPath.split('/').slice(0, -1).join('/');

    const close = () => setContextMenu(null);

    try {
      switch (action) {
        case 'newFile':
          openDialog('newFile');
          return;
        case 'newFolder':
          openDialog('newFolder');
          return;
        case 'reveal':
          if (window.codeforge?.revealInExplorer && itemPath) {
            await window.codeforge.revealInExplorer(itemPath);
          }
          break;
        case 'openTerminal':
          window.dispatchEvent(new CustomEvent('cf:terminal-command', { detail: { command: 'pwd' } }));
          break;
        case 'findInFolder':
          window.dispatchEvent(new CustomEvent('cf:explorer-search-focus', { detail: { path: basePath || itemPath } }));
          break;
        case 'copyPath':
        case 'copyRelativePath':
          if (itemPath) {
            await navigator.clipboard.writeText(itemPath);
          }
          break;
        case 'rename': {
          openDialog('rename');
          return;
        }
        case 'delete':
          openDialog('delete');
          return;
          break;
        default:
          break;
      }
    } catch (error) {
      showNotice(error.message || 'Action failed');
    } finally {
      close();
    }
  };

  const submitDialog = async () => {
    if (!dialog) return;
    const value = dialogInput.trim();

    try {
      if (dialog.type === 'newFile') {
        if (!value) {
          setDialogError('File name required');
          return;
        }
        const nextPath = [dialog.basePath, value].filter(Boolean).join('/');
        await window.codeforge?.writeFile?.(nextPath, '');
        await onWorkspaceRefresh?.();
        await onFileSelect(nextPath);
        closeDialog();
        return;
      }

      if (dialog.type === 'newFolder') {
        if (!value) {
          setDialogError('Folder name required');
          return;
        }
        const nextPath = [dialog.basePath, value].filter(Boolean).join('/');
        await window.codeforge?.createFolder?.(nextPath);
        await onWorkspaceRefresh?.();
        closeDialog();
        return;
      }

      if (dialog.type === 'rename') {
        if (!value) {
          setDialogError('New name required');
          return;
        }
        if (value === dialog.currentName) {
          closeDialog();
          return;
        }
        const parent = dialog.itemPath.split('/').slice(0, -1).join('/');
        const nextPath = [parent, value].filter(Boolean).join('/');
        await window.codeforge?.renamePath?.(dialog.itemPath, nextPath);
        await onWorkspaceRefresh?.();
        await onFileSelect(nextPath);
        closeDialog();
        return;
      }

      if (dialog.type === 'delete') {
        await window.codeforge?.deletePath?.(dialog.itemPath);
        await onWorkspaceRefresh?.();
        closeDialog();
      }
    } catch (error) {
      setDialogError(error.message || 'Operation failed');
    }
  };

  const menuItems = [
    { id: 'newFile', label: 'New File...' },
    { id: 'newFolder', label: 'New Folder...' },
    { id: 'divider-1', type: 'divider' },
    { id: 'reveal', label: 'Reveal in File Explorer', shortcut: 'Shift+Alt+R' },
    { id: 'openTerminal', label: 'Open in Integrated Terminal' },
    { id: 'divider-2', type: 'divider' },
    { id: 'findInFolder', label: 'Find in Folder...', shortcut: 'Shift+Alt+F' },
    { id: 'divider-3', type: 'divider' },
    { id: 'copyPath', label: 'Copy Path', shortcut: 'Shift+Alt+C' },
    { id: 'copyRelativePath', label: 'Copy Relative Path', shortcut: 'Ctrl+Shift+C' },
    { id: 'rename', label: 'Rename...', shortcut: 'F2' },
    { id: 'delete', label: 'Delete', shortcut: 'Del' }
  ];

  const collapseAll = () => {
    setExpandedFolders(new Set(['']));
  };

  const renderFileTree = (items, level = 0) => {
    return items.map((item, index) => {
      const isActive = activeFilePath === item.path;
      const isExpanded = expandedFolders.has(item.path);
      const paddingLeft = `${level * 16}px`;

      if (item.type === 'folder') {
        const folderStatus = item.git;
        return (
          <div key={`${item.path}-${index}`}>
            <div
              className={`file-item ${isActive ? 'active' : ''} ${item.name === 'node_modules' ? 'muted' : ''}`}
              style={{ paddingLeft }}
              onClick={() => toggleFolder(item.path)}
              onContextMenu={(event) => handleContextMenu(event, item)}
            >
              <span className="folder-icon">
                <span className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'}`} aria-hidden="true" />
              </span>
              <span className="folder-name" title={item.name}>{item.name}</span>
              <span className="file-status-spacer" />
              {folderStatus && <span className={`folder-git-dot ${folderStatus}`} />}
            </div>
            {isExpanded && item.children && (
              <div>
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      const status = gitMap[item.path];

      return (
        <div
          key={`${item.path}-${index}`}
          className={`file-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft }}
          onClick={() => onFileSelect(item.path)}
          onContextMenu={(event) => handleContextMenu(event, item)}
        >
          {(() => {
            const meta = getFileIcon(item.name);
            return (
              <span className="file-icon-badge" style={{ color: meta.color }}>
                {renderIcon(meta)}
              </span>
            );
          })()}
          <span className="file-name" title={item.name}>{item.name}</span>
          <span className="file-status-spacer" />
          {status && <span className={`file-git-status ${status}`}>{status}</span>}
        </div>
      );
    });
  };

  return (
    <div>
      <div className="sidebar-header">
        <span className="section-toggle" onClick={() => setExplorerOpen((p) => !p)}>
          <span>{explorerOpen ? '▾' : '▸'}</span>
          <span>EXPLORER</span>
        </span>
        <div className="explorer-actions">
          <span>⋯</span>
        </div>
      </div>
      {explorerOpen && (
        <div className="file-tree">
          <div className="workspace-row">
            <div
              className="workspace-row-left"
              onClick={() => toggleFolder('')}
              onContextMenu={(event) => handleContextMenu(event, files)}
              title="Workspace"
            >
              <span className="folder-icon">
                <span className={`codicon ${expandedFolders.has('') ? 'codicon-chevron-down' : 'codicon-chevron-right'}`} aria-hidden="true" />
              </span>
              <span className="folder-name" title="CODEFORGE">CODEFORGE</span>
            </div>
            <div className="workspace-row-actions" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="explorer-icon-btn" title="New File" onClick={() => openRootDialog('newFile')}>
                <span className="codicon codicon-new-file" aria-hidden="true" />
              </button>
              <button type="button" className="explorer-icon-btn" title="New Folder" onClick={() => openRootDialog('newFolder')}>
                <span className="codicon codicon-new-folder" aria-hidden="true" />
              </button>
              <button type="button" className="explorer-icon-btn" title="Refresh" onClick={() => onWorkspaceRefresh?.()}>
                <span className="codicon codicon-refresh" aria-hidden="true" />
              </button>
              <button type="button" className="explorer-icon-btn" title="Collapse All" onClick={collapseAll}>
                <span className="codicon codicon-collapse-all" aria-hidden="true" />
              </button>
            </div>
          </div>

          {expandedFolders.has('') && renderFileTree(files.children, 0)}
        </div>
      )}
      {contextMenu && (
        <div
          className="explorer-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(event) => event.stopPropagation()}
        >
          {menuItems.map((item) =>
            item.type === 'divider' ? (
              <div key={item.id} className="explorer-context-divider" />
            ) : (
              <button
                key={item.id}
                type="button"
                className="explorer-context-item"
                onClick={() => runAction(item.id)}
              >
                <span>{item.label}</span>
                <span className="explorer-context-shortcut">{item.shortcut || ''}</span>
              </button>
            )
          )}
        </div>
      )}
      {dialog && (
        <div className="explorer-dialog-overlay" onClick={closeDialog}>
          <div className="explorer-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="explorer-dialog-title">
              {dialog.type === 'newFile' && 'Create New File'}
              {dialog.type === 'newFolder' && 'Create New Folder'}
              {dialog.type === 'rename' && 'Rename'}
              {dialog.type === 'delete' && 'Delete Item'}
            </div>
            {dialog.type === 'delete' ? (
              <div className="explorer-dialog-message">
                Delete `{dialog.itemPath.split('/').pop()}` permanently?
              </div>
            ) : (
              <input
                className="explorer-dialog-input"
                autoFocus
                value={dialogInput}
                onChange={(event) => setDialogInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitDialog();
                }}
              />
            )}
            {dialogError && <div className="explorer-dialog-error">{dialogError}</div>}
            <div className="explorer-dialog-actions">
              <button type="button" className="explorer-dialog-btn ghost" onClick={closeDialog}>Cancel</button>
              <button type="button" className="explorer-dialog-btn primary" onClick={submitDialog}>
                {dialog.type === 'delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && <div className="explorer-notice">{notice}</div>}
    </div>
  );
}

export default FilePanel;
