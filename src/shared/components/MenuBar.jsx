import React from 'react';
import { VSIcon } from './VSIcons';

const MenuBar = ({
  activeMenu,
  menuPosition,
  getMenuCheckState,
  activeSubMenu,
  setActiveSubMenu,
  subMenuPos,
  setSubMenuPos,
  handleMenuAction,
  setActiveMenuId,
  recentFiles,
  loadFileByPath
}) => {
  if (!activeMenu) return null;

  return (
    <>
      <div className="menu-dropdown" style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}>
        <div className="menu-content" onClick={(event) => event.stopPropagation()}>
          {activeMenu.items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={`${activeMenu.id}-sep-${index}`} className="menu-divider" />;
            }

            const hasSub = item.submenu || item.hasSubmenu;
            const checked = item.checkable ? getMenuCheckState(item.id) : false;

            return (
              <div key={item.id} className="menu-item-wrapper" 
                onMouseEnter={(e) => {
                  if (hasSub) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSubMenuPos({ left: rect.right, top: rect.top });
                    setActiveSubMenu(item.id);
                  } else {
                    setActiveSubMenu(null);
                  }
                }}
              >
                <button
                  type="button"
                  className={`menu-item ${item.disabled ? 'disabled' : ''} ${activeSubMenu === item.id ? 'active' : ''}`}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!hasSub) {
                      handleMenuAction(item.id);
                      setActiveMenuId(null);
                      setActiveSubMenu(null);
                    }
                  }}
                >
                  <div className="menu-item-left">
                    {item.checkable && (
                      <div className="menu-check">
                        {checked && <VSIcon name="check" size={14} />}
                      </div>
                    )}
                    <span>{item.label}</span>
                  </div>
                  <div className="menu-item-right">
                    {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                    {hasSub && <VSIcon name="chevron-right" size={14} />}
                  </div>
                </button>

                {activeSubMenu === item.id && hasSub && (
                  <div className="menu-dropdown submenu" style={{ left: `${subMenuPos.left}px`, top: `${subMenuPos.top}px` }}>
                    <div className="menu-content">
                      {item.id === 'file.openRecent' ? (
                        <>
                          <div className="menu-item disabled">Reopen Closed Editor <span className="menu-shortcut">Ctrl+Shift+T</span></div>
                          <div className="menu-divider" />
                          {recentFiles.map(path => (
                            <button key={path} className="menu-item" onClick={() => { loadFileByPath(path); setActiveMenuId(null); setActiveSubMenu(null); }}>
                              {path}
                            </button>
                          ))}
                        </>
                      ) : item.submenu ? (
                        item.submenu.map((subItem, subIdx) => {
                          if (subItem.type === 'separator') {
                            return <div key={`${item.id}-sep-${subIdx}`} className="menu-divider" />;
                          }
                          const subChecked = subItem.checkable ? getMenuCheckState(subItem.id) : false;
                          return (
                            <button
                              key={subItem.id}
                              type="button"
                              className={`menu-item ${subItem.disabled ? 'disabled' : ''}`}
                              disabled={subItem.disabled}
                              onClick={() => {
                                handleMenuAction(subItem.id);
                                setActiveMenuId(null);
                                setActiveSubMenu(null);
                              }}
                            >
                              <div className="menu-item-left">
                                {subItem.checkable && (
                                  <div className="menu-check">
                                    {subChecked && <VSIcon name="check" size={14} />}
                                  </div>
                                )}
                                <span>{subItem.label}</span>
                              </div>
                              <div className="menu-item-right">
                                {subItem.shortcut && <span className="menu-shortcut">{subItem.shortcut}</span>}
                                {subItem.hasSubmenu && <VSIcon name="chevron-right" size={14} />}
                              </div>
                            </button>
                          );
                        })
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="menu-overlay" onClick={() => setActiveMenuId(null)} />
    </>
  );
};

export default MenuBar;
