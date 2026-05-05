import { useState, useCallback, useMemo } from 'react';
import { MENU_DEFINITIONS } from '../constants/menuDefinitions';

export const useMenuManagement = (showToast) => {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ left: 12, top: 36 });
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [subMenuPos, setSubMenuPos] = useState({ left: 0, top: 0 });
  const [quickSearch, setQuickSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchCursor, setSearchCursor] = useState(0);

  const menuActions = useMemo(
    () => MENU_DEFINITIONS.flatMap((menu) =>
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

  const getQuickResults = useCallback((workspaceFiles) => {
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
      .filter((item) => !item.disabled && item.label.toLowerCase().includes(query))
      .map((item) => ({
        id: `action:${item.id}`,
        label: item.label,
        description: item.shortcut || '',
        type: 'action',
        value: item.id,
        bucket: item.bucket
      }));

    return [...files, ...actions].slice(0, 12);
  }, [menuActions, quickSearch]);

  const openMenu = useCallback((menuId, menuRefs) => {
    const element = menuRefs.current[menuId];
    if (element) {
      const rect = element.getBoundingClientRect();
      setMenuPosition({ left: rect.left, top: rect.bottom + 1 });
    }
    setActiveMenuId(menuId);
  }, []);

  return {
    activeMenuId,
    setActiveMenuId,
    menuPosition,
    setMenuPosition,
    activeSubMenu,
    setActiveSubMenu,
    subMenuPos,
    setSubMenuPos,
    quickSearch,
    setQuickSearch,
    searchFocused,
    setSearchFocused,
    searchCursor,
    setSearchCursor,
    getQuickResults,
    openMenu
  };
};
