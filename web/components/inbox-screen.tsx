"use client";

import { useState } from "react";
import { AtSign, Bot, CheckCircle2, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Notification } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useSession } from "./session";
import { Avatar, AgentAvatar, Button, EmptyState, Spinner, cx } from "./ui";
import { TaskDrawer } from "./task/task-drawer";

const ICONS: Record<string, typeof AtSign> = {
  assigned: UserPlus,
  mentioned: AtSign,
  commented: MessageSquare,
  completed: CheckCircle2,
  approval_requested: Bot,
  agent_done: Bot,
  next_step: Sparkles,
};

export function InboxScreen() {
  const { refresh } = useSession();
  const { data, error, mutate } = useApi<{ notifications: Notification[]; unread: number }>("/notifications", {
    refreshInterval: 15000,
  });
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  async function open(n: Notification) {
    if (!n.read) {
      await api(`/notifications/${n.id}/read`, { method: "POST" });
      void mutate();
      refresh();
    }
    if (n.task) setOpenTaskId(n.task.id);
  }

  async function readAll() {
    await api("/notifications/read_all", { method: "POST" });
    void mutate();
    refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gelen kutusu</h1>
        {!!data?.unread && (
          <Button variant="secondary" size="sm" onClick={readAll}>
            Tümünü okundu yap ({data.unread})
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!data && !error && <Spinner label="Bildirimler yükleniyor..." />}
      {data && data.notifications.length === 0 && <EmptyState title="Yeni bildirim yok" />}
      {data && data.notifications.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {data.notifications.map((n) => {
            const Icon = ICONS[n.kind] ?? MessageSquare;
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={cx("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50", !n.read && "bg-lime-50/50")}
                >
                  {n.actor ? <Avatar user={n.actor} size={30} /> : <AgentAvatar size={30} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Icon size={14} className="shrink-0 text-zinc-400" />
                      <span className={cx(!n.read && "font-medium")}>{n.message}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-400">
                      {n.project?.name} · {formatDateTime(n.created_at)}
                    </div>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {openTaskId && (
        <TaskDrawer
          taskId={openTaskId}
          onClose={() => setOpenTaskId(null)}
          onOpen={setOpenTaskId}
          onChange={() => void mutate()}
        />
      )}
    </div>
  );
}
