import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Task } from '../../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCaptured: (task: Task) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onTaskCaptured,
}) => {
  const [thought, setThought] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentCapture, setRecentCapture] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setThought('');
      setContext('');
      setShowContext(false);
      setRecentCapture(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const task = await api.quickCapture(thought, context || undefined);
      setRecentCapture(task);
      onTaskCaptured(task);
      // Automatically close after a brief feedback moment
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Quick Capture</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Thought Input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              ref={inputRef}
              type="text"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="What's on your mind? (e.g. Buy running shoes, Clean kitchen)"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '1.05rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          {/* Optional "How do you want to do it?" toggle */}
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0',
              }}
            >
              {showContext ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>Optional: How do you want to do it?</span>
            </button>

            {showContext && (
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Research online first vs already decided and buy immediately..."
                rows={2}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>

          {/* Submission Feedback or Button */}
          {recentCapture ? (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Captured! Estimated ~{recentCapture.estimated_duration || 15}m · {recentCapture.energy_level.toLowerCase()} energy</span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="submit"
                disabled={!thought.trim() || isSubmitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  opacity: thought.trim() ? 1 : 0.6,
                  cursor: thought.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Inactive analyzing...
                  </>
                ) : (
                  <>
                    Capture Thought <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
