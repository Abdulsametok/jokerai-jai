"use client";

import { Bot, GitBranch, Link2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { dueTone, relativeDue } from "@/lib/format";
import { Avatar, CheckCircle, PriorityBadge, cx } from "../ui";
import { AgentStateBadge } from "../task/agent-state-badge";

export function TaskRow({
  task,
  onOpen,
  onToggle,
  showProject = false,
}: {
  task: Task;
  onOpen: (id: number) => void;
  onToggle: (task: Task) => void;
  showProject?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={task.title}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onOpen(task.id);
      }}
      className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_48px_64px_56px] items-center gap-3 border-b border-zinc-100 px-4 py-2 text-sm hover:bg-zinc-50 lg:grid-cols-[minmax(0,1fr)_150px_90px_80px]"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <CheckCircle checked={task.completed} onToggle={() => onToggle(task)} />
        <span className={cx("min-w-0 truncate", task.completed && "text-zinc-400 line-through")}>{task.title}</span>
        {task.subtask_count > 0 && (
          <span className="flex shrink-0 items-center gap-0.5 text-xs text-zinc-400">
            <GitBranch size={12} /> {task.subtask_done}/{task.subtask_count}
          </span>
        )}
        {task.depends_on_id && <Link2 size={12} className="shrink-0 text-zinc-400" aria-label="Bağımlılığı var" />}
        {task.agent_executable && task.agent_state === "idle" && (
          <span className="flex shrink-0 items-center gap-0.5 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-lime-400">
            <Bot size={11} /> <span className="hidden xl:inline">ajan yapabilir</span>
          </span>
        )}
        <AgentStateBadge state={task.agent_state} />
        {showProject && task.project && (
          <span className="ml-auto hidden min-w-0 max-w-[40%] items-center gap-1 text-xs text-zinc-500 md:flex">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: task.project.color }} />
            <span className="truncate">{task.project.name}</span>
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-600">
        <Avatar user={task.assignee} size={22} />
        <span className="hidden truncate lg:inline">{task.assignee?.name ?? "Atanmamış"}</span>
      </div>
      <div className={cx("truncate text-xs", dueTone(task.due_on, task.completed))}>{relativeDue(task.due_on)}</div>
      <div>
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}
