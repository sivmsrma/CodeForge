import React from 'react';
import { VSIcon } from './VSIcons';
import EditorPanel from '../../features/editor/EditorPanel';

const EditorArea = ({ 
  openFiles, 
  activeFilePath, 
  setActiveFilePath, 
  closeFile, 
  editorCode, 
  setEditorCode, 
  setIsDirty, 
  setOpenFiles, 
  uiSettings,
  getFileIcon
}) => {
  return (
    <div className="editor-container">
      {openFiles.length > 0 && (
        <div className="editor-tabs">
          {openFiles.map((file) => (
            <div 
              key={file.path} 
              className={`tab ${activeFilePath === file.path ? 'active' : ''}`}
              onClick={() => setActiveFilePath(file.path)}
            >
              <VSIcon {...getFileIcon(file.path)} size={14} />
              <span className="tab-name">{file.name}{file.isDirty ? ' *' : ''}</span>
              <span 
                className="tab-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
              >
                <VSIcon name="VscClose" size={14} />
              </span>
            </div>
          ))}
        </div>
      )}
      <EditorPanel
        activeFile={activeFilePath ? activeFilePath.split(/[\\/]/).pop() : 'untitled.txt'}
        code={editorCode}
        onCodeChange={(value) => {
          setEditorCode(value || '');
          setIsDirty(true);
          // Update isDirty in openFiles too
          setOpenFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, isDirty: true } : f));
        }}
        settings={uiSettings}
      />
    </div>
  );
};

export default EditorArea;
