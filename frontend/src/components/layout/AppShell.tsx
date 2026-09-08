import { Compass, CheckSquare, Heart, Clock, Plus, Zap, DollarSign } from 'lucide-react';
import { ActiveSession } from '../../types';

interface AppShellProps {
  activeTab: 'recommend' | 'tasks' | 'recovery' | 'budget' | 'session';
  setActiveTab: (tab: 'recommend' | 'tasks' | 'recovery' | 'budget' | 'session') => void;
  onOpenCapture: () => void;
  activeSession: ActiveSession | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  onOpenCapture,
  activeSession,
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          background: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            Action
          </span>
        </div>

        {/* Quick Action / Session Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeSession && (
            <button
              onClick={() => setActiveTab('session')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 12px',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              In Session
            </button>
          )}

          {/* Desktop Capture Button */}
          <button
            onClick={onOpenCapture}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
            }}
            id="desktop-capture-btn"
          >
            <Plus size={16} /> Quick Capture <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>Ctrl+K</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '16px 20px' }}>
        {children}
      </main>

      {/* Mobile Floating Action Button */}
      <button
        className="fab-capture"
        onClick={onOpenCapture}
        aria-label="Quick capture thought"
        title="Quick Capture (+)"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          <Compass size={20} />
          <span>Recommend</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={20} />
          <span>Library</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === 'recovery' ? 'active' : ''}`}
          onClick={() => setActiveTab('recovery')}
        >
          <Heart size={20} />
          <span>Recovery</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <DollarSign size={20} />
          <span>Budget</span>
        </button>

        <button
          className={`bottom-nav-item ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          <Clock size={20} />
          <span>Session</span>
        </button>
      </nav>
    </div>
  );
};
