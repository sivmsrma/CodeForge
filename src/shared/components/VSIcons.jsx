import React from 'react';
import * as VscIcons from 'react-icons/vsc';

/**
 * VSIcon Component
 * 
 * This component provides access to the full VS Code (Codicon) icon set via react-icons.
 * It is permanent and stays within the project.
 * 
 * Usage: <VSIcon name="VscFiles" size={24} color="#fff" />
 */
export const VSIcon = ({ name, size = 16, color = 'currentColor', className = '' }) => {
  // Map our old names to Vsc names for backward compatibility if needed,
  // or just use the Vsc names directly.
  const iconMap = {
    explorer: 'VscFiles',
    search: 'VscSearch',
    'source-control': 'VscSourceControl',
    debug: 'VscDebugAlt',
    extensions: 'VscExtensions',
    account: 'VscAccount',
    settings: 'VscSettingsGear',
    'new-file': 'VscNewFile',
    'new-folder': 'VscNewFolder',
    refresh: 'VscRefresh',
    'collapse-all': 'VscCollapseAll',
    folder: 'VscFolder',
    'folder-opened': 'VscFolderOpened',
    minimize: 'VscChromeMinimize',
    maximize: 'VscChromeMaximize',
    restore: 'VscChromeRestore',
    close: 'VscChromeClose',
    attach: 'VscSymbolInterface',
    'case-sensitive': 'VscCaseSensitive',
    'whole-word': 'VscWholeWord',
    regex: 'VscRegex',
    replace: 'VscReplace',
    'replace-all': 'VscReplaceAll',
    'chevron-right': 'VscChevronRight',
    'chevron-down': 'VscChevronDown',
    'clear-all': 'VscClearAll',
    'git-commit': 'VscGitCommit',
    'git-branch': 'VscGitBranch',
    history: 'VscHistory',
    sync: 'VscSync',
    graph: 'VscGraph',
    'git-compare': 'VscGitCompare',
    discard: 'VscDiscard',
    sparkle: 'VscSparkle',
    ellipsis: 'VscEllipsis',
    'go-to-file': 'VscGoToFile',
    cloud: 'VscCloud',
    markdown: 'VscMarkdown',
    style: 'VscSymbolNumber',
    json: 'VscJson',
    javascript: 'VscSymbolParameter',
    react: 'VscSymbolStructure'
  };

  const vscName = iconMap[name] || name;
  const IconComponent = VscIcons[vscName];

  if (!IconComponent) {
    console.warn(`Icon "${vscName}" not found in react-icons/vsc`);
    return null;
  }

  return <IconComponent size={size} color={color} className={className} />;
};
