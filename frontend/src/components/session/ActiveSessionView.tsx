import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, CornerDownLeft, Coffee, Sparkles, Send } from 'lucide-react';
import { api } from '../../api/client';
import { ActiveSession } from '../../types';

interface ActiveSessionViewProps {
  session: ActiveSession | null;
  onSessionUpdated: (session: ActiveSession | null) => void;
  onOpenCapture: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  session,
  onSessionUpdated,
  onOpenCapture,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [impulseText, setImpulseText] = useState('');
  const [showBreakInput, setShowBreakInput] = useState(false);
  const [breakNote, setBreakNote] = useState('');

  // Timer counter
  useEffect(() => {
    let interval: any = null;
    if (session && session.status === 'ACTIVE') {
      const start = new Date(session.started_at).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    try {
      const updated = await api.pauseSession(breakNote || 'Taking a short break');
      onSessionUpdated(updated);
      setShowBreakInput(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      const updated = await api.resumeSession();
      onSessionUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeSession();
      onSessionUpdated(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImpulseSubmit = async (action: 'DO_NOW' | 'AFTER_BLOCK' | 'LATER') => {
    if (!impulseText.trim()) return;
    try {
      await api.handleImpulse(impulseText, undefined, action);
      setImpulseText('');
      // Refresh session if action was DO_NOW
      const updated = await api.getActiveSession();
      onSessionUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) {
    return (
      <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Coffee size={40} color="#818cf8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Active Session</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Select a task from Recommend or your Library to enter focused action.
        </p>
        <button onClick={onOpenCapture} className="btn btn-primary">
          + Quick Capture a Thought
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Session Main Card */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 24px',
          border: session.status === 'PAUSED' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border-glow)',
          boxShadow: session.status === 'PAUSED' ? 'none' : 'var(--shadow-glow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: session.status === 'PAUSED' ? '#fbbf24' : '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: session.status === 'PAUSED' ? '#fbbf24' : '#22c55e',
              }}
            />
            {session.status === 'PAUSED' ? 'Session Paused' : 'Active Session'}
          </span>

          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.02em' }}>
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Task Title */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
          {session.task?.title || 'Current Working Task'}
        </h2>

        {/* Checkpoint / Next Step Bridge */}
        {session.checkpoint_step_title && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Next Action Step
            </div>
            <p style={{ fontSize: '0.95rem' }}>{session.checkpoint_step_title}</p>
          </div>
        )}

        {/* Return-to-Task Bridge Message if Paused */}
        {session.status === 'PAUSED' && session.resume_note && (
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
              <CornerDownLeft size={14} /> Return Bridge Checkpoint
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{session.resume_note}</p>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {session.status === 'PAUSED' ? (
            <button onClick={handleResume} className="btn btn-primary" style={{ flex: '1 1 140px' }}>
              <Play size={18} fill="#fff" /> Resume Task
            </button>
          ) : (
            <button
              onClick={() => setShowBreakInput(!showBreakInput)}
              className="btn btn-secondary"
              style={{ flex: '1 1 140px' }}
            >
              <Pause size={18} /> Intentional Break
            </button>
          )}

          <button onClick={handleComplete} className="btn btn-recovery" style={{ flex: '1 1 140px' }}>
            <CheckCircle2 size={18} /> Complete Task
          </button>
        </div>

        {/* Optional Break Note Input */}
        {showBreakInput && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="What are you doing during this break? (e.g. Snack, Stretch)"
              value={breakNote}
              onChange={(e) => setBreakNote(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
            <button onClick={handlePause} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Pause
            </button>
          </div>
        )}
      </div>

      {/* Runtime Impulse Capture (Core USP) */}
      <section className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={16} color="#818cf8" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Had an Impulse While Working?</h4>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Don't lose focus or forget it. Capture it immediately and choose what to do.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="e.g. Get a snack from the store, Reply to email"
            value={impulseText}
            onChange={(e) => setImpulseText(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {impulseText.trim() && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleImpulseSubmit('DO_NOW')}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Do Now (Pause Current)
            </button>
            <button
              onClick={() => handleImpulseSubmit('AFTER_BLOCK')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              After This Block
            </button>
            <button
              onClick={() => handleImpulseSubmit('LATER')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Save for Later
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
