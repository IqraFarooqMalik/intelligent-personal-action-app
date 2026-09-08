import React, { useState, useEffect } from 'react';
import { Play, SkipForward, Clock, Zap, Target, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { StateInput, RecommendationResponse, Level3, RecommendationMode, Task } from '../../types';

interface RecommendationViewProps {
  onStartSession: (task: Task, stepTitle?: string) => void;
  onOpenCapture: () => void;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  onStartSession,
  onOpenCapture,
}) => {
  const [state, setState] = useState<StateInput>({
    energy: 'MEDIUM',
    focus: 'MEDIUM',
    social_battery: 'NONE',
    available_time_minutes: 30,
    spending_allowed: true,
    current_location: 'HOME',
    mode: 'BEST_MATCH',
  });

  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRecommendation = async (customState?: StateInput) => {
    setLoading(true);
    try {
      const res = await api.getNextRecommendation(customState || state);
      setRecommendation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [state.mode, state.energy, state.available_time_minutes]);

  const handleNext = async () => {
    if (recommendation?.task) {
      await api.recordFeedback(recommendation.task.id, 'NOT_NOW', state.mode);
    }
    fetchRecommendation();
  };

  const handleModeChange = (mode: RecommendationMode) => {
    const updated = { ...state, mode };
    setState(updated);
  };

  const [naturalQuery, setNaturalQuery] = useState('');
  const [isParsingQuery, setIsParsingQuery] = useState(false);

  const handleNaturalQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim() || isParsingQuery) return;
    setIsParsingQuery(true);
    try {
      const parsed = await api.parseNaturalState(naturalQuery);
      setState(parsed);
      fetchRecommendation(parsed);
      setNaturalQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsingQuery(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* State Filter Bar (Minimal & Compact) */}
      <section className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Your Current Capacity
          </span>
          <button
            onClick={() => fetchRecommendation()}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="Refresh suggestion"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Natural Language State Query Input */}
        <form onSubmit={handleNaturalQuerySubmit} style={{ marginBottom: '14px', display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="How are you feeling? (e.g. Tired, 20m, need a break)"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!naturalQuery.trim() || isParsingQuery}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            {isParsingQuery ? 'Analyzing...' : 'Parse'}
          </button>
        </form>

        {/* Energy selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {(['LOW', 'MEDIUM', 'HIGH'] as Level3[]).map((level) => (
            <button
              key={level}
              onClick={() => setState({ ...state, energy: level })}
              className={`pill pill-energy-${level.toLowerCase()}`}
              style={{
                cursor: 'pointer',
                opacity: state.energy === level ? 1 : 0.45,
                borderWidth: state.energy === level ? '2px' : '1px',
                padding: '6px 14px',
              }}
            >
              <Zap size={13} /> {level.charAt(0) + level.slice(1).toLowerCase()} Energy
            </button>
          ))}
        </div>

        {/* Time available selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[10, 20, 30, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => setState({ ...state, available_time_minutes: mins })}
              style={{
                background: state.available_time_minutes === mins ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: state.available_time_minutes === mins ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                color: state.available_time_minutes === mins ? '#818cf8' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-pill)',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {mins} min
            </button>
          ))}
        </div>
      </section>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'BEST_MATCH', label: 'Best Match' },
          { key: 'QUICK_WIN', label: 'Quick Win' },
          { key: 'LOW_EFFORT', label: 'Low Effort' },
          { key: 'RECOVERY', label: 'Recovery' },
          { key: 'SURPRISE_ME', label: 'Surprise Me' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key as RecommendationMode)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: state.mode === m.key ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.04)',
              color: state.mode === m.key ? '#fff' : 'var(--text-muted)',
              border: state.mode === m.key ? 'none' : '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* The Single Recommendation Card */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Sparkles size={32} color="#818cf8" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Analyzing capacity and matching best action...</p>
        </div>
      ) : recommendation?.task ? (
        <div
          className="glass-panel"
          style={{
            padding: '28px 24px',
            border: '1px solid var(--border-glow)',
            boxShadow: 'var(--shadow-glow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient highlight line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--accent-gradient)',
            }}
          />

          {/* Reason Banner */}
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="#a855f7" />
            <span>{recommendation.reason}</span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            {recommendation.task.title}
          </h2>

          {/* Metadata Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span className="pill" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
              <Clock size={12} /> ~{recommendation.task.estimated_duration || 15} min
            </span>
            <span className={`pill pill-energy-${recommendation.task.energy_level.toLowerCase()}`}>
              <Zap size={12} /> {recommendation.task.energy_level.toLowerCase()} energy
            </span>
            <span className={`pill pill-cost-${recommendation.task.cost_type.toLowerCase()}`}>
              {recommendation.task.cost_type === 'FREE' ? 'Free' : `Paid (~€${recommendation.task.estimated_cost})`}
            </span>
            {recommendation.task.is_reusable && (
              <span className="pill pill-recovery">Reusable</span>
            )}
          </div>

          {/* Minimum Useful Starting Action / Suggested Step */}
          {recommendation.suggested_step && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-highlight)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Target size={14} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Small Starting Step (Low Friction)
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {recommendation.suggested_step.title}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onStartSession(recommendation.task!, recommendation.suggested_step?.title)}
              className="btn btn-primary"
              style={{ flex: '1 1 180px', padding: '12px 20px' }}
            >
              <Play size={18} fill="#fff" /> Start Doing This
            </button>

            <button
              onClick={handleNext}
              className="btn btn-secondary"
              style={{ flex: '0 1 auto', padding: '12px 18px' }}
              title="Show another match"
            >
              <SkipForward size={18} /> Another One
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <CheckCircle size={36} color="#34d399" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your Action Inbox is Clear!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            No tasks match your current criteria. Capture any impulse or thought to start.
          </p>
          <button onClick={onOpenCapture} className="btn btn-primary">
            + Quick Capture a Thought
          </button>
        </div>
      )}
    </div>
  );
};
