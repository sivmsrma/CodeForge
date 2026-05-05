import React from 'react';

const SettingsModal = ({
  settingsModalOpen,
  setSettingsModalOpen,
  uiSettings,
  setUiSettings,
  autoSaveEnabled,
  setAutoSaveEnabled
}) => {
  if (!settingsModalOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={() => setSettingsModalOpen(false)}>
      <div className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="settings-modal-title">Editor Settings</div>

        <div className="settings-row">
          <span>Word Wrap</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={uiSettings.wordWrap}
              onChange={(event) => setUiSettings((prev) => ({ ...prev, wordWrap: event.target.checked }))}
            />
            <span className="settings-switch-ui" />
          </label>
        </div>

        <div className="settings-row">
          <span>Auto Save</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(event) => setAutoSaveEnabled(event.target.checked)}
            />
            <span className="settings-switch-ui" />
          </label>
        </div>

        <div className="settings-row">
          <span>Editor Font Size</span>
          <input
            className="settings-number"
            type="number"
            min="10"
            max="26"
            value={uiSettings.fontSize}
            onChange={(event) => setUiSettings((prev) => ({ ...prev, fontSize: Number(event.target.value) || 14 }))}
          />
        </div>

        <div className="settings-modal-actions">
          <button type="button" className="settings-modal-btn" onClick={() => setSettingsModalOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
