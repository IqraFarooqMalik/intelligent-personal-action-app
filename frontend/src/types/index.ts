export type TaskStatus = 
  | 'INBOX' 
  | 'UNDERSTOOD' 
  | 'READY' 
  | 'IN_PROGRESS' 
  | 'WAITING' 
  | 'SOMEDAY' 
  | 'POSTPONED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type TaskType = 
  | 'ONE_TIME' 
  | 'PURCHASE' 
  | 'ERRAND' 
  | 'WORK' 
  | 'REUSABLE' 
  | 'ROUTINE' 
  | 'RECOVERY' 
  | 'COMFORT' 
  | 'LEISURE' 
  | 'SOMEDAY';

export type Level3 = 'LOW' | 'MEDIUM' | 'HIGH';
export type CostType = 'FREE' | 'PAID';
export type LocationRequirement = 'ANY' | 'HOME' | 'OFFICE' | 'OUTSIDE' | 'SPECIFIC_STORE';
export type DeviceRequirement = 'NONE' | 'PHONE' | 'LAPTOP' | 'ANY';

export interface TaskStep {
  id: number;
  task_id: number;
  title: string;
  order: number;
  is_completed: boolean;
  estimated_duration: number;
  is_minimum_useful: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  execution_context?: string | null;
  status: TaskStatus;
  task_type: TaskType;
  estimated_duration?: number | null;
  energy_level: Level3;
  focus_level: Level3;
  social_level: 'NONE' | Level3;
  activation_difficulty: Level3;
  cost_type: CostType;
  estimated_cost: number;
  location_requirement: LocationRequirement;
  device_requirement: DeviceRequirement;
  is_reusable: boolean;
  splittable: boolean;
  notes?: string | null;
  good_for?: string[];
  steps: TaskStep[];
  created_at: string;
}

export type RecommendationMode = 'BEST_MATCH' | 'SURPRISE_ME' | 'QUICK_WIN' | 'LOW_EFFORT' | 'RECOVERY';

export interface StateInput {
  energy: Level3;
  focus: Level3;
  social_battery: 'NONE' | Level3;
  available_time_minutes: number;
  spending_allowed: boolean;
  current_location: LocationRequirement;
  mode: RecommendationMode;
}

export interface RecommendationResponse {
  task: Task | null;
  reason: string;
  suggested_step?: TaskStep | null;
  score: number;
  alternative_count: number;
}

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface ActiveSession {
  id: number;
  task_id: number;
  status: SessionStatus;
  started_at: string;
  paused_at?: string | null;
  checkpoint_step_title?: string | null;
  resume_note?: string | null;
  task?: Task | null;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  task_id?: number | null;
  created_at: string;
}

export interface BudgetSummary {
  monthly_budget: number;
  currency: string;
  spent_this_month: number;
  remaining_budget: number;
  planned_purchases_total: number;
  recent_expenses: Expense[];
}
