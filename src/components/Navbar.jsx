import { Home as HomeIcon, Scissors, Minimize2, X, Moon, RefreshCw, Maximize, Droplet } from 'lucide-react';

export default function Navbar({ tabs, activeTab, setActiveTab, closeTab }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home': return <HomeIcon size={16} />;
      case 'scissors': return <Scissors size={16} />;
      case 'minimize': return <Minimize2 size={16} />;
      case 'refresh': return <RefreshCw size={16} />;
      case 'maximize': return <Maximize size={16} />;
      case 'droplet': return <Droplet size={16} />;
      default: return <HomeIcon size={16} />;
    }
  };

  return (
    <nav style={styles.nav}>
      {/* 1. Logo (Right Side - RTL) */}
      <div style={styles.logoContainer}>
        <div style={styles.logo}>
          المنارة
          <span style={styles.logoSub}>منصة الأدوات الاحترافية</span>
        </div>
      </div>

      {/* 2. Tabs (Center/Flexible) */}
      <div style={styles.tabsWrapper}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`chrome-tab ${isActive ? 'active' : ''}`}
            >
              <div style={styles.tabIcon}>{getIcon(tab.iconName)}</div>
              <div style={styles.tabTitle}>{tab.title}</div>
              
              {tab.id !== 'home' && (
                <div 
                  className="tab-close-btn"
                  onClick={(e) => closeTab(tab.id, e)}
                >
                  <X size={14} />
                </div>
              )}
              
                  {/* Decorative elements for active tab */}
                  {isActive && (
                    <>
                      <div className="tab-decor-left"></div>
                      <div className="tab-decor-right"></div>
                      <div 
                        className="tab-active-glow"
                        style={{
                          background: `linear-gradient(90deg, transparent, var(${
                            tab.id === 'image-compressor' ? '--c2' : 
                            tab.id === 'image-converter' ? '--c3' : 
                            tab.id === 'image-resizer' ? '--c4' : 
                            tab.id === 'watermark-adder' ? '--c5' :
                            '--c1'
                          }), transparent)`
                        }}
                      ></div>
                    </>
                  )}
            </div>
          );
        })}
      </div>

      {/* 3. Actions (Left Side) */}
      <div style={styles.actionsContainer}>
      </div>

      <style>{`
        .chrome-tab {
          position: relative;
          display: flex;
          align-items: center;
          height: 40px;
          min-width: 140px;
          max-width: 220px;
          padding: 0 16px;
          cursor: pointer;
          border-radius: 12px 12px 0 0;
          background: rgba(255,255,255,0.02);
          color: var(--text-dim);
          transition: 0.2s;
          user-select: none;
          z-index: 1;
        }
        
        .chrome-tab:hover:not(.active) {
          background: rgba(255,255,255,0.06);
          color: white;
        }

        .chrome-tab.active {
          background: var(--bg);
          color: white;
          z-index: 2;
        }

        /* Connecting curves for the active tab */
        .tab-decor-left, .tab-decor-right {
          position: absolute;
          bottom: 0;
          width: 12px;
          height: 12px;
        }
        .tab-decor-left {
          right: -12px; /* RTL */
          box-shadow: -6px 6px 0 0 var(--bg);
          border-bottom-left-radius: 12px;
        }
        .tab-decor-right {
          left: -12px; /* RTL */
          box-shadow: 6px 6px 0 0 var(--bg);
          border-bottom-right-radius: 12px;
        }

        .tab-active-glow {
          position: absolute;
          top: 0;
          left: 10px;
          right: 10px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--c1), transparent);
          opacity: 0.8;
          border-radius: 5px;
        }

        .tab-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 8px; /* RTL */
          color: var(--text-dim);
          transition: 0.2s;
        }
        .chrome-tab.active .tab-close-btn {
          color: #ccc;
        }
        .tab-close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
      `}</style>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'flex-end', /* Align items to bottom so tabs sit on the border */
    padding: '8px 20px 0',
    borderBottom: '1px solid var(--border)',
    background: '#040409', /* Darker than bg to simulate browser frame */
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoContainer: {
    marginLeft: '30px', /* RTL */
    paddingBottom: '8px',
    cursor: 'pointer'
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, var(--c1), var(--c7))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '1px',
    lineHeight: '1.2'
  },
  logoSub: {
    fontSize: '0.65rem',
    fontWeight: 400,
    color: 'var(--text-dim)',
    display: 'block',
    WebkitTextFillColor: 'var(--text-dim)',
    letterSpacing: 'normal'
  },
  tabsWrapper: {
    display: 'flex',
    gap: '4px',
    flex: 1,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  tabIcon: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '8px',
    color: 'inherit'
  },
  tabTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1
  },
  actionsContainer: {
    paddingBottom: '12px',
  },
  navBadge: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s'
  }
};
