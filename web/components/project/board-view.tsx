"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bot, GitBranch, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { ProjectDetail, Section, Task } from "@/lib/types";
import { dueTone, relativeDue } from "@/lib/format";
import { Avatar, CheckCircle, PriorityBadge, cx } from "../ui";
import { AgentStateBadge } from "../task/agent-state-badge";
import { toggleTask } from "./list-view";

type Columns = Record<string, number[]>;

const colKey = (id: number) => `section-${id}`;
const isColumn = (id: string | number) => String(id).startsWith("section-");

function buildColumns(project: ProjectDetail): Columns {
  const columns: Columns = {};
  for (const s of project.sections) columns[colKey(s.id)] = [];
  for (const t of [...project.tasks].sort((a, b) => a.position - b.position)) {
    if (t.section_id) columns[colKey(t.section_id)]?.push(t.id);
  }
  return columns;
}

export function BoardView({
  project,
  onOpen,
  onProject,
  onChange,
}: {
  project: ProjectDetail;
  onOpen: (id: number) => void;
  onProject: (p: ProjectDetail) => void;
  onChange: () => void;
}) {
  const [columns, setColumns] = useState<Columns>(() => buildColumns(project));
  const [activeId, setActiveId] = useState<number | null>(null);
  const tasksById = useMemo(() => new Map(project.tasks.map((t) => [t.id, t])), [project.tasks]);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Tall columns make corner-based detection pick neighbouring columns, so the
  // column under the pointer wins, then the nearest card inside it.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
    const card = hits.find((hit) => !isColumn(hit.id));
    if (card) return [card];
    const column = hits.find((hit) => isColumn(hit.id));
    if (!column) return closestCenter(args);
    const ids = columns[String(column.id)] ?? [];
    const inner = closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => ids.includes(Number(c.id))),
    });
    return inner.length > 0 ? [inner[0]] : [column];
  };

  const [syncedProject, setSyncedProject] = useState(project);
  if (activeId === null && syncedProject !== project) {
    setSyncedProject(project);
    setColumns(buildColumns(project));
  }

  const findColumn = (id: string | number): string | undefined => {
    if (isColumn(id)) return String(id);
    return Object.keys(columns).find((key) => columns[key].includes(Number(id)));
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findColumn(active.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const fromItems = prev[from].filter((id) => id !== Number(active.id));
      const toItems = [...prev[to]];
      const overIndex = toItems.indexOf(Number(over.id));
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, Number(active.id));
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const taskId = Number(active.id);
    setActiveId(null);
    if (!over) return;
    const column = findColumn(over.id) ?? findColumn(active.id);
    if (!column) return;

    let items = columns[column];
    const oldIndex = items.indexOf(taskId);
    const overIndex = items.indexOf(Number(over.id));
    if (oldIndex >= 0 && overIndex >= 0 && oldIndex !== overIndex) {
      items = arrayMove(items, oldIndex, overIndex);
      setColumns((prev) => ({ ...prev, [column]: items }));
    }
    const sectionId = Number(column.replace("section-", ""));
    const position = items.indexOf(taskId);
    const task = tasksById.get(taskId);
    if (task && task.section_id === sectionId && task.position === position) return;

    try {
      const { project: updated } = await api<{ project: ProjectDetail }>(`/tasks/${taskId}/move`, {
        method: "POST",
        body: { section_id: sectionId, position },
      });
      onProject(updated);
    } catch {
      onChange();
    }
  }

  const activeTask = activeId ? tasksById.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-5">
        {project.sections.map((section) => (
          <Column
            key={section.id}
            project={project}
            section={section}
            taskIds={columns[colKey(section.id)] ?? []}
            tasksById={tasksById}
            onOpen={onOpen}
            onChange={onChange}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <Card task={activeTask} dragging />}</DragOverlay>
    </DndContext>
  );
}

function Column({
  project,
  section,
  taskIds,
  tasksById,
  onOpen,
  onChange,
}: {
  project: ProjectDetail;
  section: Section;
  taskIds: number[];
  tasksById: Map<number, Task>;
  onOpen: (id: number) => void;
  onChange: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey(section.id) });
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api(`/projects/${project.id}/tasks`, { method: "POST", body: { task: { title, section_id: section.id } } });
    setTitle("");
    onChange();
  }

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="text-sm font-semibold text-zinc-800">
          {section.name} <span className="ml-1 font-normal text-zinc-400">{taskIds.length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="rounded p-1 text-zinc-500 hover:bg-zinc-200" aria-label="Görev ekle">
          <Plus size={14} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cx("flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-2 transition-colors", isOver ? "bg-lime-50" : "bg-zinc-100/70")}
      >
        {adding && (
          <form onSubmit={add}>
            <input
              autoFocus
              className="input h-9"
              placeholder="Görev adı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !title && setAdding(false)}
            />
          </form>
        )}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            return task ? <SortableCard key={id} task={task} onOpen={onOpen} onChange={onChange} /> : null;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({ task, onOpen, onChange }: { task: Task; onOpen: (id: number) => void; onChange: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
    >
      <Card
        task={task}
        onToggle={async () => {
          await toggleTask(task);
          onChange();
        }}
      />
    </div>
  );
}

function Card({ task, dragging, onToggle }: { task: Task; dragging?: boolean; onToggle?: () => void }) {
  return (
    <div
      className={cx(
        "cursor-grab rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-zinc-300",
        dragging && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        <CheckCircle checked={task.completed} onToggle={onToggle} />
        <span className={cx("flex-1 leading-snug", task.completed && "text-zinc-400 line-through")}>{task.title}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.agent_executable && task.agent_state === "idle" && (
          <span className="flex items-center gap-0.5 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-lime-400">
            <Bot size={11} /> ajan
          </span>
        )}
        <AgentStateBadge state={task.agent_state} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className={dueTone(task.due_on, task.completed)}>{relativeDue(task.due_on)}</span>
          {task.subtask_count > 0 && (
            <span className="flex items-center gap-0.5 text-zinc-400">
              <GitBranch size={11} /> {task.subtask_done}/{task.subtask_count}
            </span>
          )}
        </div>
        <Avatar user={task.assignee} size={22} />
      </div>
    </div>
  );
}
