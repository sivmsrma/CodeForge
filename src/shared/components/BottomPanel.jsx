import React from 'react';
import { VSIcon } from './VSIcons';
import TerminalComponent from '../../features/terminal/TerminalComponent';

const BottomPanel = ({
  bottomPanelOpen,
  setBottomPanelOpen,
  bottomPanelHeight,
  setIsResizingBottom,
  activeBottomTab,
  setActiveBottomTab,
  workspaceFiles
}) => {
  if (!bottomPanelOpen) {
    return (
      <button
        type="button"
        className="panel-restore bottom"
        onClick={() => setBottomPanelOpen(true)}
        title="Show Bottom Panel"
      >
        <VSIcon name="VscChevronUp" size={16} />
      </button>
    );
  }

  return (
    <div className="bottom-panel" style={{ height: `${bottomPanelHeight}px`, position: 'relative' }}>
      <div className="bottom-tabs">
        {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`bottom-tab ${activeBottomTab === tab ? 'active' : ''}`}
            onClick={() => setActiveBottomTab(tab)}
          >
            {tab === 'PROBLEMS' && <VSIcon name="VscError" size={14} />}
            {tab === 'OUTPUT' && <VSIcon name="VscOutput" size={14} />}
            {tab === 'DEBUG CONSOLE' && <VSIcon name="VscDebugConsole" size={14} />}
            {tab === 'TERMINAL' && <VSIcon name="VscTerminal" size={14} />}
            {tab === 'PORTS' && <VSIcon name="VscRemote" size={14} />}
            {tab}
          </button>
        ))}

        <button
          type="button"
          className="bottom-panel-close"
          onClick={() => setBottomPanelOpen(false)}
          title="Hide Bottom Panel"
        >
          <VSIcon name="VscChromeClose" size={14} />
        </button>
      </div>

      <div className="resize-handle horizontal" onMouseDown={() => setIsResizingBottom(true)} />

      <div className="bottom-content">
        {activeBottomTab === 'TERMINAL' && <TerminalComponent />}
        {activeBottomTab === 'PROBLEMS' && (
          <div className="problems-panel">
            <div className="no-problems">No problems detected</div>
          </div>
        )}
        {activeBottomTab === 'OUTPUT' && (
          <div className="output-panel">
            <div>[Terminal] Ready</div>
            <div>[Workspace] {workspaceFiles.length} files indexed</div>
          </div>
        )}
        {activeBottomTab === 'DEBUG CONSOLE' && (
          <div className="debug-console">
            <div>Debug console ready</div>
          </div>
        )}
        {activeBottomTab === 'PORTS' && (
          <div className="ports-panel">
            <div>No forwarded ports</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
