import React from 'react';
import { VSIcon } from './VSIcons';
import FilePanel from '../../features/files/FilePanel';

const SidebarPanel = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarWidth,
  setIsResizingSidebar,
  activeLeftIcon,
  activeFilePath,
  workspaceFiles,
  workspaceName,
  gitMap,
  refreshWorkspaceFiles,
  loadFileByPath,
  performSearch,
  leftSearchQuery,
  setLeftSearchQuery,
  setSearchResults,
  isReplaceOpen,
  setIsReplaceOpen,
  searchOptions,
  setSearchOptions,
  replaceQuery,
  setReplaceQuery,
  handleReplaceAll,
  isSearching,
  searchResults,
  handleReplace,
  gitInfo,
  gitCommitMessage,
  setGitCommitMessage,
  handleGitCommit,
  commitMenuOpen,
  setCommitMenuOpen,
  handleGitAmend,
  handleGitPush,
  handleGitSync,
  handleGitDiscard,
  handleGitAdd,
  getFileIcon,
  setIsResizingScGraph,
  scGraphHeight,
  gitHistory,
  refreshGitStatus,
  refreshGitInfo,
  refreshGitHistory,
  showToast,
  handleMenuAction
}) => {
  if (!sidebarOpen) {
    return (
      <button
        type="button"
        className="panel-restore left"
        onClick={() => setSidebarOpen(true)}
        title="Show Sidebar"
      >
        <VSIcon name="VscChevronRight" size={16} />
      </button>
    );
  }

  return (
    <div className="sidebar file-explorer" style={{ width: `${sidebarWidth}px`, position: 'relative' }}>
      <div className="resize-handle vertical" onMouseDown={() => setIsResizingSidebar(true)} />

      {activeLeftIcon === 'explorer' && (
        <FilePanel
          activeFilePath={activeFilePath}
          workspaceFiles={workspaceFiles}
          workspaceName={workspaceName}
          gitMap={gitMap}
          onWorkspaceRefresh={refreshWorkspaceFiles}
          onFileSelect={loadFileByPath}
        />
      )}

      {activeLeftIcon === 'search' && (
        <div className="panel-content search-panel">
          <div className="sidebar-header">
            <span>Search</span>
            <div className="search-actions">
              <button type="button" onClick={() => performSearch(leftSearchQuery)} title="Refresh">
                <VSIcon name="refresh" size={14} />
              </button>
              <button type="button" onClick={() => { setLeftSearchQuery(''); setSearchResults([]); }} title="Clear Search Results">
                <VSIcon name="clear-all" size={14} />
              </button>
            </div>
          </div>

          <div className="search-and-replace-container">
            <div className="search-row-container">
              <button 
                type="button" 
                className={`replace-toggle ${isReplaceOpen ? 'open' : ''}`}
                onClick={() => setIsReplaceOpen(!isReplaceOpen)}
              >
                <VSIcon name={isReplaceOpen ? 'chevron-down' : 'chevron-right'} size={14} />
              </button>
              <div className="search-input-group">
                <div className="input-with-icons">
                  <input
                    type="text"
                    placeholder="Search"
                    className="search-input-main"
                    value={leftSearchQuery}
                    onChange={(event) => setLeftSearchQuery(event.target.value)}
                  />
                  {leftSearchQuery && (
                    <button className="clear-input-btn" onClick={() => setLeftSearchQuery('')} title="Clear">
                      <VSIcon name="close" size={14} />
                    </button>
                  )}
                  <div className="input-options-icons">
                    <button 
                      type="button" 
                      className={searchOptions.matchCase ? 'active' : ''} 
                      onClick={() => setSearchOptions(prev => ({ ...prev, matchCase: !prev.matchCase }))}
                      title="Match Case"
                    >
                      <VSIcon name="case-sensitive" size={14} />
                    </button>
                    <button 
                      type="button" 
                      className={searchOptions.wholeWord ? 'active' : ''} 
                      onClick={() => setSearchOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
                      title="Match Whole Word"
                    >
                      <VSIcon name="whole-word" size={14} />
                    </button>
                    <button 
                      type="button" 
                      className={searchOptions.useRegex ? 'active' : ''} 
                      onClick={() => setSearchOptions(prev => ({ ...prev, useRegex: !prev.useRegex }))}
                      title="Use Regular Expression"
                    >
                      <VSIcon name="regex" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isReplaceOpen && (
              <div className="replace-row-container">
                <div className="replace-input-group">
                  <div className="input-with-icons">
                    <input
                      type="text"
                      placeholder="Replace"
                      className="replace-input-main"
                      value={replaceQuery}
                      onChange={(event) => setReplaceQuery(event.target.value)}
                    />
                    {replaceQuery && (
                      <button className="clear-input-btn replace" onClick={() => setReplaceQuery('')} title="Clear">
                        <VSIcon name="close" size={14} />
                      </button>
                    )}
                    <div className="input-options-icons">
                      <button 
                        type="button" 
                        onClick={handleReplaceAll}
                        title="Replace All"
                      >
                        <VSIcon name="replace-all" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="search-results-container">
            {isSearching && <div className="searching-loader">Searching...</div>}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="search-results-tree">
                <div className="results-summary">
                  {searchResults.reduce((acc, curr) => acc + curr.matches.length, 0)} results in {searchResults.length} files
                </div>
                {searchResults.map((file) => (
                  <div key={file.path} className="search-file-group">
                    <div className="search-file-header" onClick={() => loadFileByPath(file.path)}>
                      <VSIcon name="chevron-down" size={14} />
                      <VSIcon name="VscFileCode" size={14} color="#61dafb" />
                      <span className="file-name">{file.name}</span>
                      <span className="file-path">{file.path}</span>
                      <span className="match-count-badge">{file.matches.length}</span>
                    </div>
                    <div className="search-file-matches">
                      {file.matches.map((match, idx) => (
                        <div 
                          key={`${file.path}-m-${idx}`} 
                          className="search-match-item" 
                          onClick={() => {
                            loadFileByPath(file.path);
                            window.dispatchEvent(new CustomEvent('cf:editor-scroll-to-line', { 
                              detail: { filePath: file.path, lineNumber: match.lineNumber } 
                            }));
                          }}
                        >
                          <span className="line-number">{match.lineNumber}</span>
                          <span className="match-preview">
                            {match.text}
                          </span>
                          {isReplaceOpen && (
                            <button 
                              className="replace-single-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplace(file.path, match.lineNumber, match.text, replaceQuery);
                              }}
                              title="Replace"
                            >
                              <VSIcon name="replace" size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && leftSearchQuery.trim() && searchResults.length === 0 && (
              <div className="left-search-empty">No results found. Review your settings or try a different query.</div>
            )}
          </div>
        </div>
      )}

      {activeLeftIcon === 'source-control' && (
        <div className="panel-content sc-panel">
          <div className="sc-sidebar-header">
            <span>SOURCE CONTROL</span>
            <VSIcon name="ellipsis" size={16} className="header-more" />
          </div>
          
          <div className="sc-section-container">
            <div className="sc-collapsible-header">
              <VSIcon name="chevron-down" size={14} />
              <span>CHANGES</span>
            </div>

            <div className="sc-commit-wrapper">
              <div className="sc-commit-input-box">
                <textarea 
                  placeholder={`Message (Ctrl+Enter to commit on "${gitInfo.branch}")`}
                  value={gitCommitMessage}
                  onChange={(e) => setGitCommitMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') handleGitCommit();
                  }}
                />
                <VSIcon name="sparkle" size={14} className="sparkle-icon" />
              </div>
              <div className="sc-commit-btn-split">
                <button className="btn-main" onClick={handleGitCommit}>
                  <VSIcon name="check" size={18} />
                  <span>Commit</span>
                </button>
                <button className="btn-arrow" onClick={(e) => { e.stopPropagation(); setCommitMenuOpen(!commitMenuOpen); }}>
                  <VSIcon name="chevron-down" size={14} />
                </button>
                
                {commitMenuOpen && (
                  <div className="sc-commit-dropdown">
                    <div className="dropdown-item" onClick={() => { handleGitCommit(); setCommitMenuOpen(false); }}>Commit</div>
                    <div className="dropdown-item" onClick={() => { handleGitAmend(); setCommitMenuOpen(false); }}>Commit (Amend)</div>
                    <div className="dropdown-item" onClick={() => { handleGitPush(); setCommitMenuOpen(false); }}>Commit & Push</div>
                    <div className="dropdown-item" onClick={() => { handleGitSync(); setCommitMenuOpen(false); }}>Commit & Sync</div>
                  </div>
                )}
              </div>
            </div>

            <div className="sc-changes-tree">
              <div className="sc-changes-header">
                <VSIcon name="chevron-down" size={14} />
                <span>Changes</span>
                <div className="sc-badge-circle">{Object.keys(gitMap).length}</div>
              </div>
              <div className="sc-file-list">
                {Object.entries(gitMap).map(([filePath, status]) => {
                  const icon = getFileIcon(filePath);
                  return (
                    <div key={filePath} className="sc-file-row" onClick={() => loadFileByPath(filePath)}>
                      <VSIcon name={icon.name} size={16} color={icon.color} />
                      <div className="file-info">
                        <span className="name">{filePath.split(/[\\/]/).pop()}</span>
                        <span className="path">{filePath.split(/[\\/]/).slice(0, -1).join('\\')}</span>
                      </div>
                      <div className="actions">
                        <button title="Open File" onClick={(e) => { e.stopPropagation(); loadFileByPath(filePath); }}>
                          <VSIcon name="go-to-file" size={16} />
                        </button>
                        <button title="Discard Changes" onClick={(e) => { e.stopPropagation(); handleGitDiscard(filePath); }}>
                          <VSIcon name="discard" size={16} />
                        </button>
                        <button title="Stage Changes" onClick={(e) => { e.stopPropagation(); handleGitAdd(filePath); }}>
                          <VSIcon name="VscAdd" size={16} />
                        </button>
                      </div>
                      <span className={`status status-${status}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div 
            className="sc-resizer-v" 
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingScGraph(true);
            }}
          />

          <div className="sc-graph-section" style={{ height: `${scGraphHeight}px` }}>
            <div className="sc-collapsible-header graph-header">
              <VSIcon name="chevron-down" size={14} />
              <span>GRAPH</span>
              <div className="graph-actions">
                <VSIcon name="git-branch" size={14} />
                <span className="action-label">Auto</span>
                <VSIcon name="VscTarget" size={14} />
                <VSIcon name="VscArrowDown" size={14} />
                <VSIcon name="VscArrowUp" size={14} />
                <VSIcon name="VscCloudUpload" size={14} />
                <VSIcon 
                  name="VscRefresh" 
                  size={14} 
                  className="clickable-icon"
                  onClick={() => {
                    refreshGitStatus();
                    refreshGitInfo();
                    refreshGitHistory();
                    showToast('Refreshing Git status...');
                  }}
                />
                <VSIcon name="ellipsis" size={14} />
              </div>
            </div>
            <div className="sc-history-items">
              {gitHistory.map((commit, idx) => (
                <div key={commit.hash} className="sc-history-row">
                  <div className="graph-col">
                    <div className={`node ${idx === 0 ? 'active' : ''}`}></div>
                    <div className="line"></div>
                  </div>
                  <div className="commit-details">
                    <div className="top-row">
                      <span className="subject">{commit.subject}</span>
                      <span className="author">{commit.author}</span>
                      {idx === 0 && (
                        <div className="branch-tag">
                          <VSIcon name="git-branch" size={10} />
                          <span>{gitInfo.branch || 'master'}</span>
                        </div>
                      )}
                      <VSIcon name="cloud" size={14} className="cloud-icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeLeftIcon === 'debug' && (
        <div className="panel-content">
          <div className="sidebar-header"><span>Run and Debug</span></div>
          <div className="debug-panel">
            <button type="button" className="action-btn" onClick={() => handleMenuAction('run.debug')}>
              Start Debugging
            </button>
            <button type="button" className="action-btn secondary" onClick={() => handleMenuAction('run.noDebug')}>
              Run Without Debugging
            </button>
          </div>
        </div>
      )}

      {activeLeftIcon === 'extensions' && (
        <div className="panel-content">
          <div className="sidebar-header"><span>Extensions</span></div>
          <div className="extensions-list">
            <div className="extension-item">AI Assistant (Built-in)</div>
            <div className="extension-item">Prettier Formatter (Suggested)</div>
            <div className="extension-item">ESLint (Suggested)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarPanel;
