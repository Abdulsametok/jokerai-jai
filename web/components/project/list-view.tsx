"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { ProjectDetail, Section, Task } from "@/lib/types";
import { TaskRow } from "./task-row";

export async function toggleTask(task: Task) {
  await api(`/tasks/${task.id}`, { method: "PATCH", body: { task: { completed: !task.completed } } });
}

export function ListView({
  project,
  onOpen,
  onChange,
}: {
  project: ProjectDetail;
  onOpen: (id: number) => void;
  onChange: () => void;
}) {
  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_48px_64px_56px] gap-3 lg:grid-cols-[minmax(0,1fr)_150px_90px_80px] border-b border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-500">
        <span>Görev adı</span>
        <span>Atanan</span>
        <span>Son tarih</span>
        <span>Öncelik</span>
      </div>
      {project.sections.map((section) => (
        <SectionBlock
          key={section.id}
          project={project}
          section={section}
          tasks={project.tasks.filter((t) => t.section_id === section.id)}
          onOpen={onOpen}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  project,
  section,
  tasks,
  onOpen,
  onChange,
}: {
  project: ProjectDetail;
  section: Section;
  tasks: Task[];
  onOpen: (id: number) => void;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api(`/projects/${project.id}/tasks`, { method: "POST", body: { task: { title, section_id: section.id } } });
    setTitle("");
    onChange();
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 pb-1 pt-5 text-sm font-semibold text-zinc-800"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {section.name}
        <span className="font-normal text-zinc-400">{tasks.length}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={onOpen}
              onToggle={async (t) => {
                await toggleTask(t);
                onChange();
              }}
            />
          ))}
          {adding ? (
            <form onSubmit={add} className="px-4 py-1.5">
              <input
                autoFocus
                className="input h-8"
                placeholder="Görev adı yazıp Enter'a bas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => !title && setAdding(false)}
                onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              />
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-800"
            >
              <Plus size={14} /> Görev ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
