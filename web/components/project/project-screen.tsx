"use client";

import { useState } from "react";
import { KanbanSquare, List, Sparkles } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/hooks";
import type { ProjectDetail } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Avatar, ProgressBar, Spinner, cx } from "../ui";
import { ListView } from "./list-view";
import { BoardView } from "./board-view";
import { TaskDrawer } from "../task/task-drawer";
import { MembersButton } from "./members-button";

export function ProjectScreen({ id }: { id: number }) {
  const key = `/projects/${id}`;
  const hasAgentWork = (p?: ProjectDetail) =>
    p?.tasks.some((t) => t.agent_state === "queued" || t.agent_state === "working") ?? false;
  const { data, error, mutate } = useApi<{ project: ProjectDetail }>(key, {
    refreshInterval: (latest) => (hasAgentWork(latest?.project) ? 2500 : 15000),
  });
  const [view, setView] = useState<"list" | "board">("list");
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  if (error) return <div className="p-8 text-sm text-red-600">{error.message}</div>;
  if (!data) {
    return (
      <div className="p-8">
        <Spinner label="Proje yükleniyor..." />
      </div>
    );
  }

  const project = data.project;
  const refresh = () => void mutate();

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 pb-0 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ backgroundColor: project.color }} />
              <h1 className="truncate text-xl font-semibold" title={project.name}>{project.name}</h1>
            </div>
            {project.goal && (
              <Link
                href={`/goals/${project.goal.id}`}
                className="mt-1 flex max-w-full items-center gap-1 text-xs text-lime-700 hover:underline"
                title={project.goal.title}
              >
                <Sparkles size={12} className="shrink-0" />
                <span className="truncate">Hedeften kuruldu: {project.goal.title}</span>
              </Link>
            )}
            {project.description && (
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-zinc-500" title={project.description}>
                {project.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-44">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>İlerleme</span>
                <span>
                  {project.progress.done}/{project.progress.total} · %{project.progress.percent}
                </span>
              </div>
              <ProgressBar percent={project.progress.percent} />
            </div>
            {project.due_on && <div className="text-xs text-zinc-500">Bitiş: {formatDate(project.due_on)}</div>}
            <div className="flex -space-x-1.5">
              {project.members.slice(0, 5).map((m) => (
                <span key={m.id} className="rounded-full ring-2 ring-white">
                  <Avatar user={m} size={26} />
                </span>
              ))}
            </div>
            <MembersButton project={project} onChange={refresh} />
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {(
            [
              ["list", "Liste", List],
              ["board", "Pano", KanbanSquare],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={cx(
                "flex items-center gap-1.5 border-b-2 px-3 pb-2 text-sm",
                view === value ? "border-lime-500 font-medium text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800",
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {view === "list" ? (
          <ListView project={project} onOpen={setOpenTaskId} onChange={refresh} />
        ) : (
          <BoardView project={project} onOpen={setOpenTaskId} onProject={(p) => mutate({ project: p }, false)} onChange={refresh} />
        )}
      </div>

      {openTaskId && (
        <TaskDrawer
          taskId={openTaskId}
          members={project.members}
          sections={project.sections}
          onClose={() => setOpenTaskId(null)}
          onOpen={setOpenTaskId}
          onChange={refresh}
        />
      )}
    </div>
  );
}
