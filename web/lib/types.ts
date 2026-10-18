export type User = {
  id: number;
  name: string;
  email: string;
  title: string | null;
  initials: string;
  avatar_color: string;
  team: string | null;
};

export type Me = User & { unread_notifications: number };

export type Role = "owner" | "admin" | "member";
export type Priority = "low" | "medium" | "high" | "urgent";
export type AgentState = "idle" | "queued" | "working" | "awaiting_review" | "approved" | "failed";

export type Progress = { total: number; done: number; percent: number };

export type ProjectSummary = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  due_on: string | null;
  owner: User;
  role: Role | null;
  progress: Progress;
  member_count: number;
  from_goal: boolean;
  updated_at: string;
};

export type Section = { id: number; name: string; kind: string; position: number };

export type Task = {
  id: number;
  project_id: number;
  section_id: number | null;
  parent_id: number | null;
  depends_on_id: number | null;
  title: string;
  description: string | null;
  due_on: string | null;
  priority: Priority;
  position: number;
  completed: boolean;
  completed_at: string | null;
  assignee: User | null;
  subtask_count: number;
  subtask_done: number;
  agent_executable: boolean;
  agent_kind: string | null;
  agent_state: AgentState;
  latest_artifact_status: string | null;
  created_at: string;
  project?: { id: number; name: string; color: string };
};

export type ProjectDetail = ProjectSummary & {
  goal: { id: number; title: string } | null;
  members: (User & { role: Role })[];
  sections: Section[];
  tasks: Task[];
};

export type Comment = {
  id: number;
  task_id: number;
  body: string;
  by_agent: boolean;
  author: User | null;
  created_at: string;
};

export type Activity = {
  id: number;
  action: string;
  data: Record<string, unknown>;
  actor: User | null;
  by_agent: boolean;
  task_id: number | null;
  created_at: string;
};

export type Artifact = {
  id: number;
  task_id: number;
  version: number;
  kind: string;
  title: string;
  content: string;
  status: "pending_review" | "approved" | "rejected" | "superseded";
  feedback: string | null;
  reviewed_by: User | null;
  reviewed_at: string | null;
  created_at: string;
};

export type TaskDetail = Task & {
  project: { id: number; name: string; color: string };
  can_review: boolean;
  parent: { id: number; title: string } | null;
  depends_on: { id: number; title: string; completed: boolean } | null;
  creator: User | null;
  subtasks: Task[];
  comments: Comment[];
  artifacts: Artifact[];
  activities: Activity[];
};

export type Notification = {
  id: number;
  kind: string;
  message: string;
  read: boolean;
  actor: User | null;
  task: { id: number; title: string } | null;
  project: { id: number; name: string } | null;
  created_at: string;
};

export type MyTasks = {
  groups: Record<"overdue" | "today" | "this_week" | "later" | "no_date", Task[]>;
  recently_completed: Task[];
  awaiting_my_review: Task[];
};

export type PlanTask = {
  ref: string;
  title: string;
  description: string;
  assignee_id: number | null;
  assignee_name?: string | null;
  due_in_days: number;
  priority: Priority;
  depends_on: string | null;
  agent_executable: boolean;
  agent_kind: string | null;
  subtasks: string[];
};

export type GoalPlan = {
  project_name?: string;
  summary?: string;
  tasks?: PlanTask[];
  risks?: string[];
};

export type Goal = {
  id: number;
  title: string;
  context: string | null;
  deadline: string | null;
  status: "planning" | "planned" | "accepted" | "failed";
  plan: GoalPlan;
  error: string | null;
  project_id: number | null;
  created_at: string;
};
