import React from 'react';
import { VSIcon } from './VSIcons';
import { MENU_DEFINITIONS } from '../constants/menuDefinitions';

const TitleBar = ({ 
  activeFilePath, 
  isWindowMaximized, 
  quickSearch, 
  setQuickSearch, 
  searchFocused, 
  setSearchFocused, 
  quickResults, 
  searchCursor, 
  setSearchCursor, 
  applyQuickSearchResult, 
  handleMenuAction, 
  openMenu, 
  activeMenuId, 
  setActiveMenuId,
  menuRefs,
  settingsOpen,
  setSettingsOpen,
  setSettingsModalOpen,
  uiSettings,
  setUiSettings,
  openCommandPalette
}) => {
  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="brand-mark">
          <VSIcon name="VscCode" size={16} />
          <span className="app-name">CodeForge</span>
        </div>

        <div className="title-menu-strip" onClick={(event) => event.stopPropagation()}>
          {MENU_DEFINITIONS.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className={`title-menu-item ${activeMenuId === menu.id ? 'active' : ''}`}
              ref={(node) => {
                if (node) menuRefs.current[menu.id] = node;
              }}
              onClick={() => {
                if (activeMenuId === menu.id) {
                  setActiveMenuId(null);
                  return;
                }
                openMenu(menu.id);
              }}
              onMouseEnter={() => {
                if (activeMenuId) {
                  openMenu(menu.id);
                }
              }}
            >
              {menu.label}
            </button>
          ))}
        </div>

        <div className="title-nav-controls" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="title-nav-btn" onClick={() => handleMenuAction('go.back')} title="Back">
            <VSIcon name="VscArrowLeft" size={14} />
          </button>
          <button type="button" className="title-nav-btn" onClick={() => handleMenuAction('go.forward')} title="Forward">
            <VSIcon name="VscArrowRight" size={14} />
          </button>
        </div>

        <div className="title-bar-search">
          <VSIcon name="VscSearch" size={14} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search files and commands"
            className="title-bar-input"
            value={quickSearch}
            onChange={(event) => setQuickSearch(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setSearchFocused(false), 110);
            }}
            onKeyDown={(event) => {
              if (!quickResults.length) return;
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSearchCursor((prev) => (prev + 1) % quickResults.length);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSearchCursor((prev) => (prev === 0 ? quickResults.length - 1 : prev - 1));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                applyQuickSearchResult(quickResults[searchCursor]);
              } else if (event.key === 'Escape') {
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

      <div className="title-bar-center">{activeFilePath ? activeFilePath : 'CodeForge'}</div>

      <div className="title-bar-right" onClick={(event) => event.stopPropagation()}>
        <div className="title-icon-actions">
          <button
            type="button"
            className="title-icon-btn"
            title="Command Palette"
            onClick={openCommandPalette}
          >
            <VSIcon name="VscTerminalPowershell" size={16} className="title-icon" />
          </button>
          <button
            type="button"
            className={`title-icon-btn ${settingsOpen ? 'active' : ''}`}
            title="Settings"
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            <VSIcon name="settings" size={16} className="title-icon" />
          </button>
        </div>

        {settingsOpen && (
          <div className="settings-dropdown">
            <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); openCommandPalette(); }}>
              <span>Command Palette...</span>
              <span className="settings-shortcut">Ctrl+Shift+P</span>
            </button>
            <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); setSettingsModalOpen(true); }}>
              <span>Settings</span>
              <span className="settings-shortcut">Ctrl+,</span>
            </button>
            <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); handleMenuAction('view.openExtensions'); }}>
              <span>Extensions</span>
              <span className="settings-shortcut">Ctrl+Shift+X</span>
            </button>
            <div className="settings-divider" />
            <button type="button" className="settings-item" onClick={() => { setSettingsOpen(false); setUiSettings((prev) => ({ ...prev, wordWrap: !prev.wordWrap })); }}>
              <span>Word Wrap</span>
              <span className="settings-shortcut">{uiSettings.wordWrap ? 'On' : 'Off'}</span>
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
            <VSIcon name="minimize" size={12} />
          </button>
          <button
            type="button"
            className={`traffic-btn maximize ${isWindowMaximized ? 'active' : ''}`}
            title={isWindowMaximized ? 'Restore' : 'Maximize'}
            onClick={() => window.codeforge?.windowAction?.('maximize-toggle')}
          >
            <VSIcon name={isWindowMaximized ? 'restore' : 'maximize'} size={12} />
          </button>
          <button
            type="button"
            className="traffic-btn close"
            title="Close"
            onClick={() => window.codeforge?.windowAction?.('close')}
          >
            <VSIcon name="close" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
