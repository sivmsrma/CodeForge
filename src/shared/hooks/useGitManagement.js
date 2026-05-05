import { useState, useCallback, useMemo, useEffect } from 'react';

export const useGitManagement = (showToast, workspaceFiles) => {
  const [gitMap, setGitMap] = useState({});
  const [gitInfo, setGitInfo] = useState({ branch: '', isDirty: false });
  const [gitCommitMessage, setGitCommitMessage] = useState('');
  const [gitHistory, setGitHistory] = useState([]);
  const [commitMenuOpen, setCommitMenuOpen] = useState(false);
  const [isResizingScGraph, setIsResizingScGraph] = useState(false);
  const [scGraphHeight, setScGraphHeight] = useState(250);

  const sourceControlTotal = useMemo(() => {
    return Object.keys(gitMap || {}).length;
  }, [gitMap]);

  const sourceControlCount = useMemo(() => {
    return sourceControlTotal > 99 ? '99+' : String(sourceControlTotal);
  }, [sourceControlTotal]);

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

  const refreshGitHistory = useCallback(async () => {
    if (!window.codeforge?.gitLog) return;
    try {
      const logs = await window.codeforge.gitLog();
      setGitHistory(logs || []);
    } catch (error) {
      console.error('Failed to load git history:', error);
    }
  }, []);

  const handleGitCommit = useCallback(async () => {
    if (!gitCommitMessage.trim()) {
      showToast('Please enter a commit message', 'warn');
      return;
    }
    try {
      const result = await window.codeforge.gitCommit(gitCommitMessage);
      if (result.ok) {
        showToast('Commit successful');
        setGitCommitMessage('');
        refreshGitStatus();
        refreshGitInfo();
        refreshGitHistory();
      } else {
        showToast(`Commit failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Commit failed', 'error');
    }
  }, [gitCommitMessage, refreshGitStatus, refreshGitInfo, refreshGitHistory, showToast]);

  const handleGitAmend = useCallback(async () => {
    if (!window.codeforge?.gitAmend) return;
    try {
      const result = await window.codeforge.gitAmend(gitCommitMessage);
      if (result.ok) {
        showToast('Commit amended successfully');
        setGitCommitMessage('');
        refreshGitStatus();
        refreshGitInfo();
        refreshGitHistory();
      } else {
        showToast(`Amend failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Amend failed', 'error');
    }
  }, [gitCommitMessage, refreshGitHistory, refreshGitInfo, refreshGitStatus, showToast]);

  const handleGitDiscard = useCallback(async (filePath, activeFilePath, loadFileByPath) => {
    if (!window.codeforge?.gitDiscard) return;
    try {
      const result = await window.codeforge.gitDiscard(filePath);
      if (result.ok) {
        showToast(`Discarded changes in ${filePath}`);
        refreshGitStatus();
        refreshGitInfo();
        if (activeFilePath === filePath) {
          loadFileByPath(filePath);
        }
      } else {
        showToast(`Discard failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Discard failed', 'error');
    }
  }, [refreshGitStatus, refreshGitInfo, showToast]);

  const handleGitAdd = useCallback(async (filePath) => {
    if (!window.codeforge?.gitAdd) return;
    try {
      const result = await window.codeforge.gitAdd(filePath);
      if (result.ok) {
        showToast(`Staged ${filePath}`);
        refreshGitStatus();
        refreshGitInfo();
      } else {
        showToast(`Stage failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Stage failed', 'error');
    }
  }, [refreshGitStatus, refreshGitInfo, showToast]);

  const handleGitPush = useCallback(async () => {
    if (!window.codeforge?.gitPush) return;
    showToast('Pushing changes...');
    try {
      const result = await window.codeforge.gitPush();
      if (result.ok) {
        showToast('Successfully pushed to origin');
        refreshGitHistory();
      } else {
        showToast(`Push failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Push failed', 'error');
    }
  }, [refreshGitHistory, showToast]);

  const handleGitSync = useCallback(async () => {
    if (!window.codeforge?.gitPull || !window.codeforge?.gitPush) return;
    showToast('Syncing (Pull & Push)...');
    try {
      const pullResult = await window.codeforge.gitPull();
      if (!pullResult.ok) {
        showToast(`Pull failed: ${pullResult.error}`, 'error');
        return;
      }
      const pushResult = await window.codeforge.gitPush();
      if (pushResult.ok) {
        showToast('Successfully synced');
        refreshGitStatus();
        refreshGitHistory();
      } else {
        showToast(`Push failed: ${pushResult.error}`, 'error');
      }
    } catch (error) {
      showToast('Sync failed', 'error');
    }
  }, [refreshGitHistory, refreshGitStatus, showToast]);

  useEffect(() => {
    refreshGitStatus();
    refreshGitInfo();
    refreshGitHistory();
  }, [refreshGitInfo, refreshGitHistory, refreshGitStatus, workspaceFiles]);

  return {
    gitMap,
    gitInfo,
    gitCommitMessage,
    setGitCommitMessage,
    gitHistory,
    commitMenuOpen,
    setCommitMenuOpen,
    isResizingScGraph,
    setIsResizingScGraph,
    scGraphHeight,
    setScGraphHeight,
    sourceControlTotal,
    sourceControlCount,
    handleGitCommit,
    handleGitAmend,
    handleGitDiscard,
    handleGitAdd,
    handleGitPush,
    handleGitSync,
    refreshGitStatus,
    refreshGitInfo,
    refreshGitHistory
  };
};
