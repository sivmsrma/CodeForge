import { useState, useCallback, useEffect } from 'react';
import { FALLBACK_WORKSPACE_FILES } from '../constants/menuDefinitions';

export const useFileManagement = (showToast) => {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [editorCode, setEditorCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState(FALLBACK_WORKSPACE_FILES);
  const [workspaceName, setWorkspaceName] = useState('CODEFORGE');
  const [recentFiles, setRecentFiles] = useState([
    'D:\\Newfolder\\CodeForge',
    'D:\\Newfolder\\New',
    'C:\\Users\\vikas\\Desktop\\New folder\\Jewellery_Billing_Software',
    'D:\\billingapp',
    'D:\\Newfolder\\Navambhaw',
    'D:\\Newfolder\\navambhaw-socket',
    'D:\\Newfolder\\navambhaw back',
    'D:\\Newfolder\\navambhaw-pythonbackend'
  ]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const refreshWorkspaceFiles = useCallback(async () => {
    if (!window.codeforge?.listFiles) {
      setWorkspaceFiles(FALLBACK_WORKSPACE_FILES);
      return;
    }
    try {
      const files = await window.codeforge.listFiles();
      setWorkspaceFiles(Array.isArray(files) ? files : FALLBACK_WORKSPACE_FILES);
    } catch {
      setWorkspaceFiles([]);
    }
  }, []);

  const loadFileByPath = useCallback(async (filePath) => {
    if (!filePath) return;
    const fileName = filePath.split(/[\\/]/).pop();
    
    const alreadyOpen = openFiles.find(f => f.path === filePath);
    if (alreadyOpen) {
      setActiveFilePath(filePath);
      return;
    }

    try {
      if (!window.codeforge?.readFile) {
        setEditorCode(`// Content for ${fileName}`);
        setOpenFiles(prev => [...prev, { path: filePath, name: fileName, isDirty: false }]);
        setActiveFilePath(filePath);
        return;
      }
      const content = await window.codeforge.readFile(filePath);
      if (content !== null) {
        setEditorCode(content);
        setOpenFiles(prev => [...prev, { path: filePath, name: fileName, isDirty: false }]);
        setActiveFilePath(filePath);
        setIsDirty(false);

        setRecentFiles((prev) => {
          const filtered = prev.filter((p) => p !== filePath);
          return [filePath, ...filtered].slice(0, 15);
        });
      }
    } catch (error) {
      showToast(`Could not load file: ${fileName}`, 'error');
    }
  }, [openFiles, showToast]);

  const saveCurrentFile = useCallback(async () => {
    if (!window.codeforge) return;

    if (!activeFilePath) {
      const currentName = 'untitled.txt';
      const savedPath = await window.codeforge.saveFileAs(editorCode, currentName);
      if (!savedPath) return;
      setActiveFilePath(savedPath);
      setOpenFiles(prev => {
        const name = savedPath.split(/[\\/]/).pop();
        if (prev.find(f => f.path === savedPath)) return prev;
        return [...prev, { path: savedPath, name, isDirty: false }];
      });
      setIsDirty(false);
      showToast('File saved');
      return;
    }

    await window.codeforge.writeFile(activeFilePath, editorCode);
    setIsDirty(false);
    setOpenFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, isDirty: false } : f));
    showToast('File saved');
  }, [activeFilePath, editorCode, showToast]);

  const closeFile = useCallback((path) => {
    setOpenFiles(prev => {
      const remaining = prev.filter(f => f.path !== path);
      if (activeFilePath === path) {
        if (remaining.length > 0) {
          setActiveFilePath(remaining[remaining.length - 1].path);
        } else {
          setActiveFilePath(null);
          setEditorCode('');
        }
      }
      return remaining;
    });
  }, [activeFilePath]);

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !activeFilePath || !window.codeforge) return undefined;
    const timer = window.setTimeout(() => {
      saveCurrentFile().catch(() => {
        showToast('Auto save failed', 'error');
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [autoSaveEnabled, isDirty, activeFilePath, saveCurrentFile, showToast]);

  useEffect(() => {
    refreshWorkspaceFiles();
  }, [refreshWorkspaceFiles]);

  return {
    openFiles,
    setOpenFiles,
    activeFilePath,
    setActiveFilePath,
    editorCode,
    setEditorCode,
    isDirty,
    setIsDirty,
    workspaceFiles,
    setWorkspaceFiles,
    workspaceName,
    setWorkspaceName,
    recentFiles,
    autoSaveEnabled,
    setAutoSaveEnabled,
    refreshWorkspaceFiles,
    loadFileByPath,
    saveCurrentFile,
    closeFile
  };
};
