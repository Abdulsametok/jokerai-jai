"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Link2, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Priority, ProjectDetail, Section, TaskDetail, User } from "@/lib/types";
import { AGENT_KIND_LABEL, PRIORITY_LABEL, formatDateTime } from "@/lib/format";
import { Button, CheckCircle, Spinner, cx } from "../ui";
import { CommentComposer } from "./comment-composer";
import { ActivityFeed } from "./activity-feed";
import { AgentPanel } from "./agent-panel";

export function TaskDrawer({
  taskId,
  members: membersProp,
  sections: sectionsProp,
  onClose,
  onOpen,
  onChange,
}: {
  taskId: number;
  members?: User[];
  sections?: Section[];
  onClose: () => void;
  onOpen: (id: number) => void;
  onChange: () => void;
}) {
  const key = `/tasks/${taskId}`;
  const busyAgent = (t?: TaskDetail) => t?.agent_state === "queued" || t?.agent_state === "working";
  const { data, error, mutate } = useApi<{ task: TaskDetail }>(key, {
    refreshInterval: (latest) => (busyAgent(latest?.task) ? 2000 : 20000),
  });
  const task = data?.task;
  const { data: projectData } = useApi<{ project: ProjectDetail }>(
    !membersProp && task ? `/projects/${task.project.id}` : null,
  );
  const members = membersProp ?? projectData?.project.members ?? [];
  const sections = sectionsProp ?? projectData?.project.sections ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function update(fields: Record<string, unknown>) {
    const res = await api<{ task: TaskDetail }>(key, { method: "PATCH", body: { task: fields } });
    await mutate(res, false);
    onChange();
  }

  async function remove() {
    if (!confirm("Bu görev silinsin mi?")) return;
    await api(key, { method: "DELETE" });
    onChange();
    onClose();
  }

  const reload = async () => {
    await mutate();
    onChange();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[600px] flex-col border-l border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3">
          {task && (
            <Button
              variant={task.completed ? "secondary" : "primary"}
              size="sm"
              onClick={() => update({ completed: !task.completed })}
            >
              {task.completed ? "Yeniden aç" : "Tamamlandı olarak işaretle"}
            </Button>
          )}
          <div className="flex-1" />
          {task && (
            <button onClick={remove} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100" aria-label="Görevi sil">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-5 text-sm text-red-600">{error.message}</div>}
        {!task && !error && (
          <div className="p-5">
            <Spinner label="Görev yükleniyor..." />
          </div>
        )}

        {task && (
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            {task.parent && (
              <button onClick={() => onOpen(task.parent!.id)} className="text-xs text-zinc-500 hover:underline">
                ← {task.parent.title}
              </button>
            )}
            <TitleField key={`t-${task.id}`} value={task.title} onSave={(title) => update({ title })} />

            <div className="grid grid-cols-[110px_1fr] items-center gap-x-3 gap-y-2.5 text-sm">
              <span className="text-zinc-500">Atanan</span>
              <select
                className="select max-w-64"
                value={task.assignee?.id ?? ""}
                onChange={(e) => update({ assignee_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Atanmamış</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <span className="text-zinc-500">Son tarih</span>
              <input
                type="date"
                className="select max-w-44"
                value={task.due_on ?? ""}
                onChange={(e) => update({ due_on: e.target.value || null })}
              />

              <span className="text-zinc-500">Öncelik</span>
              <select
                className="select max-w-44"
                value={task.priority}
                onChange={(e) => update({ priority: e.target.value as Priority })}
              >
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>

              {!task.parent_id && (
                <>
                  <span className="text-zinc-500">Bölüm</span>
                  <select
                    className="select max-w-44"
                    value={task.section_id ?? ""}
                    onChange={async (e) => {
                      await api(`/tasks/${task.id}/move`, {
                        method: "POST",
                        body: { section_id: Number(e.target.value), position: 0 },
                      });
                      await reload();
                    }}
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {task.depends_on && (
                <>
                  <span className="text-zinc-500">Bağımlı olduğu</span>
                  <button
                    onClick={() => onOpen(task.depends_on!.id)}
                    className="flex items-center gap-1.5 text-left text-zinc-700 hover:underline"
                  >
                    <Link2 size={13} />
                    <span className={cx(task.depends_on.completed && "line-through text-zinc-400")}>
                      {task.depends_on.title}
                    </span>
                  </button>
                </>
              )}

              <span className="text-zinc-500">Ajan</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-zinc-700">
                  <input
                    type="checkbox"
                    checked={task.agent_executable}
                    onChange={(e) =>
                      update({ agent_executable: e.target.checked, agent_kind: task.agent_kind ?? "draft" })
                    }
                  />
                  JokerAI bu görevi yürütebilir
                </label>
                {task.agent_executable && (
                  <select
                    className="select"
                    value={task.agent_kind ?? "draft"}
                    onChange={(e) => update({ agent_kind: e.target.value })}
                  >
                    {Object.entries(AGENT_KIND_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <DescriptionField
              key={`d-${task.id}`}
              value={task.description ?? ""}
              onSave={(description) => update({ description })}
            />

            <AgentPanel task={task} onChange={reload} />

            <Subtasks task={task} onOpen={onOpen} onChange={reload} />

            <section>
              <h3 className="mb-2 text-sm font-semibold">Yorumlar</h3>
              <ul className="space-y-3">
                {task.comments.map((c) => (
                  <li key={c.id} className="flex gap-2.5 text-sm">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: c.by_agent ? "#18181b" : c.author?.avatar_color }}
                    >
                      {c.by_agent ? "J" : c.author?.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500">
                        <span className="font-medium text-zinc-800">{c.by_agent ? "JokerAI" : c.author?.name}</span>{" "}
                        · {formatDateTime(c.created_at)}
                      </div>
                      <p className="whitespace-pre-wrap break-words">{highlightMentions(c.body)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <CommentComposer taskId={task.id} onPosted={reload} />
            </section>

            <ActivityFeed activities={task.activities} />
          </div>
        )}
      </aside>
    </div>
  );
}

function highlightMentions(body: string) {
  return body.split(/(@[A-ZÇĞİÖŞÜ][\wçğıöşü]+(?: [A-ZÇĞİÖŞÜ][\wçğıöşü]+)?)/u).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="rounded bg-lime-100 px-0.5 text-lime-800">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function TitleField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [title, setTitle] = useState(value);
  return (
    <input
      className="w-full rounded-md border border-transparent px-1 py-1 text-xl font-semibold outline-none hover:border-zinc-200 focus:border-lime-500"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => title.trim() && title !== value && onSave(title.trim())}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

function DescriptionField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <section>
      <h3 className="mb-1.5 text-sm font-semibold">Açıklama</h3>
      <textarea
        className="textarea min-h-20"
        placeholder="Bu görev ne hakkında?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== value && onSave(text)}
      />
    </section>
  );
}

function Subtasks({ task, onOpen, onChange }: { task: TaskDetail; onOpen: (id: number) => void; onChange: () => void }) {
  const [title, setTitle] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api(`/projects/${task.project.id}/tasks`, { method: "POST", body: { task: { title, parent_id: task.id } } });
    setTitle("");
    onChange();
  }

  if (task.parent_id) return null;

  return (
    <section>
      <h3 className="mb-1.5 text-sm font-semibold">
        Alt görevler{" "}
        {task.subtasks.length > 0 && (
          <span className="font-normal text-zinc-400">
            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
          </span>
        )}
      </h3>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {task.subtasks.map((s) => (
          <li
            key={s.id}
            onClick={() => onOpen(s.id)}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            <CheckCircle
              checked={s.completed}
              onToggle={async () => {
                await api(`/tasks/${s.id}`, { method: "PATCH", body: { task: { completed: !s.completed } } });
                onChange();
              }}
            />
            <span className={cx("flex-1", s.completed && "text-zinc-400 line-through")}>{s.title}</span>
            {s.assignee && <span className="text-xs text-zinc-500">{s.assignee.name}</span>}
          </li>
        ))}
        <li>
          <form onSubmit={add} className="flex items-center gap-2 px-3 py-1.5">
            <Plus size={14} className="text-zinc-400" />
            <input
              className="h-7 flex-1 text-sm outline-none placeholder:text-zinc-400"
              placeholder="Alt görev ekle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
        </li>
      </ul>
    </section>
  );
}
