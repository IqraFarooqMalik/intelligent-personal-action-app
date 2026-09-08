import { Task, TaskStep, StateInput, RecommendationResponse, ActiveSession } from '../types';

const API_BASE = '/api';

export const api = {
  // Quick Capture & Tasks
  async quickCapture(title: string, execution_context?: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/quick-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, execution_context }),
    });
    if (!res.ok) throw new Error('Failed to capture thought');
    return res.json();
  },

  async listTasks(status?: string, type?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('task_type', type);
    const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(id: number): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async toggleStep(taskId: number, stepId: number): Promise<TaskStep> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/steps/${stepId}/toggle`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle step');
    return res.json();
  },

  async completeTask(taskId: number): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  // Recommendations
  async getNextRecommendation(state: StateInput): Promise<RecommendationResponse> {
    const res = await fetch(`${API_BASE}/recommendations/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error('Failed to fetch recommendation');
    return res.json();
  },

  async recordFeedback(taskId: number, feedback: string, mode: string): Promise<void> {
    await fetch(`${API_BASE}/recommendations/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, feedback, current_mode: mode }),
    });
  },

  // Sessions & Return Bridge
  async getActiveSession(): Promise<ActiveSession | null> {
    const res = await fetch(`${API_BASE}/sessions/active`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch active session');
    return res.json();
  },

  async startSession(taskId: number, checkpointStep?: string, resumeNote?: string): Promise<ActiveSession> {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, checkpoint_step_title: checkpointStep, resume_note: resumeNote }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async pauseSession(resumeNote?: string, checkpoint?: string): Promise<ActiveSession> {
    const params = new URLSearchParams();
    if (resumeNote) params.append('resume_note', resumeNote);
    if (checkpoint) params.append('checkpoint_step', checkpoint);
    const res = await fetch(`${API_BASE}/sessions/pause?${params.toString()}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to pause session');
    return res.json();
  },

  async resumeSession(): Promise<ActiveSession> {
    const res = await fetch(`${API_BASE}/sessions/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume session');
    return res.json();
  },

  async completeSession(): Promise<ActiveSession> {
    const res = await fetch(`${API_BASE}/sessions/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete session');
    return res.json();
  },

  async handleImpulse(thought: string, context?: string, action: 'DO_NOW' | 'AFTER_BLOCK' | 'LATER' = 'DO_NOW'): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/impulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thought, execution_context: context, action }),
    });
    if (!res.ok) throw new Error('Failed to route impulse');
    return res.json();
  }
};
