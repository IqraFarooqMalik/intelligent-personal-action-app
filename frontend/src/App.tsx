import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal';
import { RecommendationView } from './components/recommend/RecommendationView';
import { TaskListView } from './components/tasks/TaskListView';
import { ActiveSessionView } from './components/session/ActiveSessionView';
import { RecoveryView } from './components/recovery/RecoveryView';
import { BudgetView } from './components/budget/BudgetView';
import { api } from './api/client';
import { Task, ActiveSession } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'tasks' | 'recovery' | 'budget' | 'session'>('recommend');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Poll or check active session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await api.getActiveSession();
        setActiveSession(session);
      } catch (err) {
        // No active session
      }
    };
    checkSession();
  }, [refreshTrigger]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleTaskCaptured = (_task: Task) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStartSession = async (task: Task, stepTitle?: string) => {
    try {
      const session = await api.startSession(task.id, stepTitle, `Started from ${task.title}`);
      setActiveSession(session);
      setActiveTab('session');
    } catch (err) {
      console.error('Failed to start session', err);
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenCapture={() => setIsCaptureOpen(true)}
      activeSession={activeSession}
    >
      {activeTab === 'recommend' && (
        <RecommendationView
          onStartSession={handleStartSession}
          onOpenCapture={() => setIsCaptureOpen(true)}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskListView
          onStartSession={handleStartSession}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'recovery' && (
        <RecoveryView
          onStartSession={handleStartSession}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetView />
      )}

      {activeTab === 'session' && (
        <ActiveSessionView
          session={activeSession}
          onSessionUpdated={(s) => {
            setActiveSession(s);
            setRefreshTrigger((prev) => prev + 1);
          }}
          onOpenCapture={() => setIsCaptureOpen(true)}
        />
      )}

      <QuickCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onTaskCaptured={handleTaskCaptured}
      />
    </AppShell>
  );
}

export default App;
