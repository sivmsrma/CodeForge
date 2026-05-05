import React, { useEffect, useMemo, useState } from 'react';
import { VSIcon } from '../../shared/components/VSIcons';

function FilePanel({ activeFilePath, onFileSelect, workspaceFiles = [], workspaceName = 'CODEFORGE', onWorkspaceRefresh, gitMap = {} }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
  const [contextMenu, setContextMenu] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [dialogInput, setDialogInput] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');

  const files = useMemo(() => {
    const root = { name: workspaceName, path: '', type: 'folder', children: [] };
    const nodeMap = new Map();

    const ensureFolder = (folderPath) => {
      if (!folderPath) return root.children;
      if (nodeMap.has(folderPath)) return nodeMap.get(folderPath).children;

      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');
      const parentChildren = ensureFolder(parentPath);
      const folderNode = { name: folderName, path: folderPath, type: 'folder', children: [] };
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
      parentChildren.push({ name: fileName, path: normalized, type: 'file' });
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
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const getFileIcon = (fileName) => {
    const extension = (fileName.split('.').pop() || '').toLowerCase();
    const map = {
      js: { icon: 'VscFileCode', color: '#f1e05a' },
      cjs: { icon: 'VscFileCode', color: '#f1e05a' },
      mjs: { icon: 'VscFileCode', color: '#f1e05a' },
      ts: { icon: 'VscFileCode', color: '#3178c6' },
      tsx: { icon: 'VscFileCode', color: '#3178c6' },
      jsx: { icon: 'VscFileCode', color: '#61dafb' },
      css: { icon: 'VscSymbolClass', color: '#a074c4' },
      json: { icon: 'VscJson', color: '#cbcb41' },
      md: { icon: 'VscMarkdown', color: '#8b949e' },
      html: { icon: 'VscCode', color: '#e34c26' },
      yml: { icon: 'VscSettings', color: '#aab2bd' },
      yaml: { icon: 'VscSettings', color: '#aab2bd' },
      txt: { icon: 'VscFileText', color: '#8b949e' },
      png: { icon: 'VscFileMedia', color: '#d19a66' },
      jpg: { icon: 'VscFileMedia', color: '#d19a66' },
      jpeg: { icon: 'VscFileMedia', color: '#d19a66' },
      svg: { icon: 'VscFileMedia', color: '#d19a66' }
    };
    return map[extension] || { icon: 'VscFile', color: '#8b949e' };
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
    setContextMenu({ x: event.clientX, y: event.clientY, item });
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
    setDialog({ type, itemPath: '', isFolder: true, basePath: '', currentName: workspaceName });
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
        case 'openTerminal': {
          const targetCwd = (isFolder ? itemPath : basePath) || '.';
          window.dispatchEvent(new CustomEvent('cf:open-terminal-panel'));
          window.dispatchEvent(
            new CustomEvent('cf:terminal-command', {
              detail: {
                command: {
                  action: 'new',
                  cwd: targetCwd
                }
              }
            })
          );
          break;
        }
        case 'findInFolder':
          window.dispatchEvent(new CustomEvent('cf:explorer-search-focus', { detail: { path: basePath || itemPath } }));
          break;
        case 'copyPath':
        case 'copyRelativePath':
          if (itemPath) {
            await navigator.clipboard.writeText(itemPath);
          }
          break;
        case 'rename':
          openDialog('rename');
          return;
        case 'delete':
          openDialog('delete');
          return;
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

  const renderFileTree = (items, level = 0) =>
    items.map((item, index) => {
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
                <VSIcon name={isExpanded ? 'VscChevronDown' : 'VscChevronRight'} size={16} />
                <VSIcon name={isExpanded ? 'VscFolderOpened' : 'VscFolder'} size={16} color="#d4d4d4" />
              </span>
              <span className="folder-name" title={item.name}>{item.name}</span>
              <span className="file-status-spacer" />
              {folderStatus && <span className={`folder-git-dot ${folderStatus}`} />}
            </div>
            {isExpanded && item.children && <div>{renderFileTree(item.children, level + 1)}</div>}
          </div>
        );
      }

      const status = gitMap[item.path];
      const meta = getFileIcon(item.name);

      return (
        <div
          key={`${item.path}-${index}`}
          className={`file-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft }}
          onClick={() => onFileSelect(item.path)}
          onContextMenu={(event) => handleContextMenu(event, item)}
        >
          <span className="file-icon-badge" style={{ color: meta.color }}>
            <VSIcon name={meta.icon} size={16} color={meta.color} />
          </span>
          <span className="file-name" title={item.name}>{item.name}</span>
          <span className="file-status-spacer" />
          {status && <span className={`file-git-status ${status}`}>{status}</span>}
        </div>
      );
    });

  return (
    <div>
      <div className="sidebar-header">
        <span className="section-toggle" onClick={() => setExplorerOpen((prev) => !prev)}>
          <VSIcon name={explorerOpen ? 'VscChevronDown' : 'VscChevronRight'} size={16} />
          <span>EXPLORER</span>
        </span>
        <div className="explorer-actions">
          <VSIcon name="VscEllipsis" size={14} />
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
                <VSIcon name={expandedFolders.has('') ? 'VscChevronDown' : 'VscChevronRight'} size={16} />
                <VSIcon name={expandedFolders.has('') ? 'VscFolderOpened' : 'VscFolder'} size={16} color="#d4d4d4" />
              </span>
              <span className="folder-name" title={workspaceName}>{workspaceName}</span>
            </div>

            <div className="workspace-row-actions" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="explorer-icon-btn" title="New File" onClick={() => openRootDialog('newFile')}>
                <VSIcon name="new-file" size={16} />
              </button>
              <button type="button" className="explorer-icon-btn" title="New Folder" onClick={() => openRootDialog('newFolder')}>
                <VSIcon name="new-folder" size={16} />
              </button>
              <button type="button" className="explorer-icon-btn" title="Refresh" onClick={() => onWorkspaceRefresh?.()}>
                <VSIcon name="refresh" size={16} />
              </button>
              <button type="button" className="explorer-icon-btn" title="Collapse All" onClick={collapseAll}>
                <VSIcon name="collapse-all" size={16} />
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
