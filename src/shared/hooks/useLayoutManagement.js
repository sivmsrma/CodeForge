import { useState, useCallback, useEffect } from 'react';

export const useLayoutManagement = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activityBarVisible, setActivityBarVisible] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiPanelWidth, setAiPanelWidth] = useState(360);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(240);
  const [activeBottomTab, setActiveBottomTab] = useState('TERMINAL');
  const [activeLeftIcon, setActiveLeftIcon] = useState('explorer');
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [uiSettings, setUiSettings] = useState({
    fontSize: 14,
    fontFamily: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
    wordWrap: true,
    minimap: true
  });

  const handleSidebarResize = useCallback((event) => {
    if (!isResizingSidebar) return;
    const newWidth = event.clientX - (activityBarVisible ? 48 : 0);
    if (newWidth >= 220 && newWidth <= 520) {
      setSidebarWidth(newWidth);
    }
  }, [activityBarVisible, isResizingSidebar]);

  const handleBottomResize = useCallback((event) => {
    if (!isResizingBottom) return;
    const newHeight = window.innerHeight - event.clientY - (statusBarVisible ? 22 : 0);
    if (newHeight >= 140 && newHeight <= 480) {
      setBottomPanelHeight(newHeight);
    }
  }, [isResizingBottom, statusBarVisible]);

  const handleAIResize = useCallback((event) => {
    if (!isResizingAI) return;
    const newWidth = window.innerWidth - event.clientX;
    if (newWidth >= 300 && newWidth <= 620) {
      setAiPanelWidth(newWidth);
    }
  }, [isResizingAI]);

  return {
    sidebarWidth,
    setSidebarWidth,
    sidebarOpen,
    setSidebarOpen,
    activityBarVisible,
    setActivityBarVisible,
    aiPanelOpen,
    setAiPanelOpen,
    aiPanelWidth,
    setAiPanelWidth,
    bottomPanelOpen,
    setBottomPanelOpen,
    bottomPanelHeight,
    setBottomPanelHeight,
    activeBottomTab,
    setActiveBottomTab,
    activeLeftIcon,
    setActiveLeftIcon,
    statusBarVisible,
    setStatusBarVisible,
    isResizingSidebar,
    setIsResizingSidebar,
    isResizingBottom,
    setIsResizingBottom,
    isResizingAI,
    setIsResizingAI,
    uiSettings,
    setUiSettings,
    handleSidebarResize,
    handleBottomResize,
    handleAIResize
  };
};
