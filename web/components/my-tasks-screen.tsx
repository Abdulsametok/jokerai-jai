"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { useApi } from "@/lib/hooks";
import type { MyTasks, Task } from "@/lib/types";
import { useSession } from "./session";
import { EmptyState, Spinner } from "./ui";
import { TaskRow } from "./project/task-row";
import { toggleTask } from "./project/list-view";
import { TaskDrawer } from "./task/task-drawer";

const GROUPS: [keyof MyTasks["groups"], string][] = [
  ["overdue", "Gecikmiş"],
  ["today", "Bugün"],
  ["this_week", "Bu hafta"],
  ["later", "Daha sonra"],
  ["no_date", "Tarihsiz"],
];

export function MyTasksScreen() {
  const { me, refresh } = useSession();
  const { data, error, mutate } = useApi<MyTasks>("/my_tasks", { refreshInterval: 15000 });
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  const reload = () => {
    void mutate();
    refresh();
  };

  const onToggle = async (task: Task) => {
    await toggleTask(task);
    reload();
  };

  const openCount = data ? Object.values(data.groups).reduce((n, list) => n + list.length, 0) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-zinc-500">{greeting},</p>
          <h1 className="text-2xl font-semibold">{me.name.split(" ")[0]}, bugün neler var?</h1>
        </div>
        {data && <div className="text-sm text-zinc-500">{openCount} açık görev</div>}
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!data && !error && <Spinner label="Görevler yükleniyor..." />}

      {data && data.awaiting_my_review.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-xl border border-amber-300 bg-amber-50/60">
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <Bot size={16} className="text-zinc-900" />
            <span className="font-semibold">JokerAI işi bitirdi, sadece onayın gerekiyor</span>
            <span className="rounded-full bg-amber-200 px-2 text-xs font-semibold">{data.awaiting_my_review.length}</span>
          </div>
          <div className="bg-white">
            {data.awaiting_my_review.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setOpenTaskId} onToggle={onToggle} showProject />
            ))}
          </div>
        </section>
      )}

      {data && openCount === 0 && data.awaiting_my_review.length === 0 && (
        <EmptyState title="Sana atanmış açık görev yok">
          <Link href="/goals/new" className="inline-flex items-center gap-1 text-lime-700 hover:underline">
            <Sparkles size={14} /> Bir hedef ver, ajan planlasın
          </Link>
        </EmptyState>
      )}

      {data &&
        GROUPS.map(([key, label]) =>
          data.groups[key].length === 0 ? null : (
            <section key={key} className="mb-6">
              <h2 className={`mb-1 px-1 text-sm font-semibold ${key === "overdue" ? "text-red-600" : "text-zinc-800"}`}>
                {label} <span className="font-normal text-zinc-400">{data.groups[key].length}</span>
              </h2>
              <div className="rounded-xl border border-zinc-200 bg-white">
                {data.groups[key].map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={setOpenTaskId} onToggle={onToggle} showProject />
                ))}
              </div>
            </section>
          ),
        )}

      {data && data.recently_completed.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-1 px-1 text-sm font-semibold text-zinc-500">Son tamamlananlar</h2>
          <div className="rounded-xl border border-zinc-200 bg-white opacity-80">
            {data.recently_completed.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setOpenTaskId} onToggle={onToggle} showProject />
            ))}
          </div>
        </section>
      )}

      {openTaskId && (
        <TaskDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} onOpen={setOpenTaskId} onChange={reload} />
      )}
    </div>
  );
}
