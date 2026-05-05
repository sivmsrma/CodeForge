import React from 'react';
import { VSIcon } from './VSIcons';

const ActivityBar = ({ 
  activeLeftIcon, 
  setActiveLeftIcon, 
  activityBarVisible, 
  sourceControlCount, 
  sourceControlTotal,
  setSettingsModalOpen 
}) => {
  if (!activityBarVisible) return null;

  const leftTabs = [
    { id: 'explorer', label: 'Explorer', icon: 'explorer' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'source-control', label: 'Source Control', icon: 'source-control' },
    { id: 'debug', label: 'Run and Debug', icon: 'debug' },
    { id: 'extensions', label: 'Extensions', icon: 'extensions' }
  ];

  return (
    <div className="sidebar-icons">
      {leftTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`sidebar-icon ${activeLeftIcon === tab.id ? 'active' : ''}`}
          onClick={() => setActiveLeftIcon(tab.id)}
          title={tab.label}
        >
          <VSIcon name={tab.icon} size={24} />
          {tab.id === 'source-control' && sourceControlTotal > 0 && (
            <span className="activity-badge">{sourceControlCount}</span>
          )}
        </button>
      ))}

      <div className="sidebar-spacer" />

      <button type="button" className="sidebar-icon" title="Account">
        <VSIcon name="account" size={24} />
      </button>
      <button
        type="button"
        className="sidebar-icon"
        title="Settings"
        onClick={() => setSettingsModalOpen(true)}
      >
        <VSIcon name="settings" size={24} />
      </button>
    </div>
  );
};

export default ActivityBar;
