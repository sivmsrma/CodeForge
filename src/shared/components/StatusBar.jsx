import React from 'react';
import { VSIcon } from './VSIcons';

const StatusBar = ({ 
  statusBarVisible, 
  gitInfo, 
  sourceControlTotal, 
  terminalMeta, 
  setActiveLeftIcon 
}) => {
  if (!statusBarVisible) return null;

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <button
          type="button"
          className="status-item status-btn"
          onClick={() => setActiveLeftIcon('source-control')}
        >
          <VSIcon name="source-control" size={14} color="#ffffff" />
          <span>{gitInfo.branch || 'main'}{gitInfo.isDirty ? '*' : ''}</span>
        </button>
        <div className="status-item"><span>{sourceControlTotal} changes</span></div>
        <div className="status-item"><span>{terminalMeta.count} terminal(s)</span></div>
        <div className="status-item"><span>{terminalMeta.activeName}</span></div>
      </div>

      <div className="status-bar-right">
        <div className="status-item"><span>UTF-8</span></div>
        <div className="status-item"><span>JavaScript React</span></div>
        <div className="status-item"><span>Spaces: 2</span></div>
        <div className="status-item"><span>Ln 1, Col 1</span></div>
      </div>
    </div>
  );
};

export default StatusBar;
