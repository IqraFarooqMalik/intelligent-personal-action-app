import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Clock, Zap, ChevronDown, ChevronUp, Play, Check, Edit3 } from 'lucide-react';
import { api } from '../../api/client';
import { Task, TaskStep } from '../../types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskListViewProps {
  onStartSession: (task: Task) => void;
  refreshTrigger: number;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onStartSession,
  refreshTrigger,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'RECOVERY' | 'COMPLETED'>('ALL');
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.listTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [refreshTrigger]);

  const handleToggleStep = async (taskId: number, stepId: number) => {
    try {
      await api.toggleStep(taskId, stepId);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            steps: t.steps.map((s) => (s.id === stepId ? { ...s, is_completed: !s.is_completed } : s)),
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.completeTask(taskId);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    if (t.status === 'COMPLETED') return false;
    if (filter === 'RECOVERY') return t.task_type === 'RECOVERY' || t.is_reusable;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'ALL', label: 'All Tasks' },
          { key: 'READY', label: 'Active Queue' },
          { key: 'RECOVERY', label: 'Recovery & Self-Care' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: filter === tab.key ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === tab.key ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No items in this view.</p>
        </div>
      ) : (
        filteredTasks.map((task) => {
          const isExpanded = expandedTask === task.id;
          return (
            <div
              key={task.id}
              className="glass-panel"
              style={{
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: task.status === 'COMPLETED' ? '#22c55e' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 0',
                    }}
                    title="Mark task done"
                  >
                    {task.status === 'COMPLETED' ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                        color: task.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)',
                        marginBottom: '6px',
                      }}
                    >
                      {task.title}
                    </h4>

                    {/* Metadata Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="pill" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                        <Clock size={11} /> {task.estimated_duration || 15}m
                      </span>
                      <span className={`pill pill-energy-${task.energy_level.toLowerCase()}`}>
                        <Zap size={11} /> {task.energy_level.toLowerCase()}
                      </span>
                      {task.cost_type === 'PAID' && (
                        <span className="pill pill-cost-paid">Paid</span>
                      )}
                      {task.is_reusable && (
                        <span className="pill pill-recovery">Reusable</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => onStartSession(task)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      title="Start working"
                    >
                      <Play size={14} /> Start
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTask(task)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    title="Edit task details"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Sub-steps Toggle if available */}
              {task.steps && task.steps.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{task.steps.length} actionable steps</span>
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                      {task.steps.map((step: TaskStep) => (
                        <div
                          key={step.id}
                          onClick={() => handleToggleStep(task.id, step.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            color: step.is_completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                            textDecoration: step.is_completed ? 'line-through' : 'none',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-highlight)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: step.is_completed ? 'var(--accent-primary)' : 'transparent',
                            }}
                          >
                            {step.is_completed && <Check size={12} color="#fff" />}
                          </div>
                          <span>{step.title}</span>
                          {step.is_minimum_useful && (
                            <span style={{ fontSize: '0.7rem', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '10px' }}>
                              First Step
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edit Details Modal */}
      <TaskDetailsModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => {
          loadTasks();
          setEditingTask(null);
        }}
      />
    </div>
  );
};
