import React, { useState, useEffect } from 'react';
import { Heart, Play, Sparkles, Clock, Zap, CheckCircle2, MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Task } from '../../types';

interface RecoveryViewProps {
  onStartSession: (task: Task) => void;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({ onStartSession }) => {
  const [activities, setActivities] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackTask, setFeedbackTask] = useState<Task | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getRecoveryActivities();
      setActivities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleFeedback = async (helped: string) => {
    if (!feedbackTask) return;
    try {
      await api.recordRecoveryFeedback(feedbackTask.id, helped);
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setFeedbackTask(null);
        setFeedbackSubmitted(false);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Heart size={22} color="#10b981" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Recovery & Comfort Hub</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Rest is not failure. Restorative activities to reset when you are tired or overwhelmed.
        </p>
      </div>

      {/* Quick Reset Suggestion */}
      <section
        className="glass-panel"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} color="#34d399" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
            Low Activation Reset
          </span>
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
          Take 3 Deep Breaths & Drink Water
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          The fastest 2-minute physiological reset to break mental fatigue before deciding on your next action.
        </p>
        <button
          onClick={() =>
            onStartSession({
              id: 9999,
              user_id: 1,
              title: '2-minute hydration & breath reset',
              status: 'READY',
              task_type: 'RECOVERY',
              estimated_duration: 2,
              energy_level: 'LOW',
              focus_level: 'LOW',
              social_level: 'NONE',
              activation_difficulty: 'LOW',
              cost_type: 'FREE',
              estimated_cost: 0,
              location_requirement: 'ANY',
              device_requirement: 'NONE',
              is_reusable: true,
              splittable: false,
              steps: [],
              created_at: new Date().toISOString(),
            })
          }
          className="btn btn-recovery"
          style={{ width: '100%' }}
        >
          <Play size={16} fill="#34d399" /> Start 2-Minute Reset
        </button>
      </section>

      {/* Recovery Library */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Your Self-Care Library</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>Loading recovery items...</p>
        ) : activities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No recovery activities saved yet.</p>
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="glass-panel"
              style={{
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{act.title}</h4>
                </div>
                {act.execution_context && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {act.execution_context}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="pill" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                    <Clock size={11} /> {act.estimated_duration || 10}m
                  </span>
                  <span className="pill pill-recovery">
                    <Heart size={11} /> Restorative
                  </span>
                  {act.good_for && act.good_for.map((tag, i) => (
                    <span key={i} className="pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                      good for: {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => onStartSession(act)}
                  className="btn btn-recovery"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <Play size={14} fill="#34d399" /> Start
                </button>
                <button
                  onClick={() => setFeedbackTask(act)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Rate impact
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Recovery Reflection Dialog */}
      {feedbackTask && (
        <div className="bottom-sheet-overlay" onClick={() => setFeedbackTask(null)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
              How did "{feedbackTask.title}" help?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              The app learns which activities actually restore your energy so it can recommend them at the right time.
            </p>

            {feedbackSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', padding: '16px', justifyContent: 'center' }}>
                <CheckCircle2 size={20} /> Thank you! Learned for future recommendations.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <button onClick={() => handleFeedback('YES')} className="btn btn-recovery">
                  Helped a lot
                </button>
                <button onClick={() => handleFeedback('A_LITTLE')} className="btn btn-secondary">
                  A little bit
                </button>
                <button onClick={() => handleFeedback('NO')} className="btn btn-secondary">
                  Not really
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
