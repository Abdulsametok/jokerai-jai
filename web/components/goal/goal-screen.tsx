"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Bot, Link2, RefreshCw, Sparkles, User as UserIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { AGENT_KIND_LABEL, formatDate } from "@/lib/format";
import type { Goal, PlanTask, User } from "@/lib/types";
import { AgentAvatar, Button, PriorityBadge, Spinner, cx } from "@/components/ui";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d.toISOString());
}

export function GoalScreen({ id }: { id: number }) {
  const { data, error, mutate } = useApi<{ goal: Goal }>(`/goals/${id}`, {
    refreshInterval: (latest) => (latest?.goal.status === "planning" ? 2000 : 0),
  });

  if (error) return <div className="p-8 text-sm text-red-600">Hedef bulunamadı.</div>;
  if (!data) return <div className="p-8"><Spinner label="Yükleniyor..." /></div>;

  const { goal } = data;
  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Hedef</div>
      <h1 className="text-2xl font-semibold text-zinc-900">{goal.title}</h1>
      {goal.deadline && <p className="mt-1 text-sm text-zinc-500">Son tarih: {formatDate(goal.deadline)}</p>}

      <div className="mt-8">
        {goal.status === "planning" && <Planning />}
        {goal.status === "failed" && <Failed goal={goal} onRetry={() => mutate()} />}
        {goal.status === "planned" && <PlanReview goal={goal} onReplan={() => mutate()} />}
        {goal.status === "accepted" && goal.project_id && (
          <div className="rounded-xl border border-lime-300 bg-lime-50 p-6">
            <p className="text-sm text-zinc-700">Bu hedef projeye dönüştürüldü; ajan görevleri yürütüyor.</p>
            <Link href={`/projects/${goal.project_id}`} className="mt-3 inline-block text-sm font-medium text-zinc-900 underline">
              Projeye git
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Planning() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6">
      <AgentAvatar size={36} />
      <div className="space-y-2">
        <Spinner label="JokerAI hedefi analiz ediyor..." />
        <ul className="list-disc pl-5 text-sm text-zinc-500">
          <li>Hedefi teslim edilebilir görevlere bölüyor</li>
          <li>Ekibin yeteneklerine ve açık iş yüküne bakarak atama öneriyor</li>
          <li>Kendi yürütebileceği işleri (analiz, taslak, içerik, entegrasyon) işaretliyor</li>
        </ul>
      </div>
    </div>
  );
}

function Failed({ goal, onRetry }: { goal: Goal; onRetry: () => void }) {
  const [busy, setBusy] = useState(false);
  async function retry() {
    setBusy(true);
    await api(`/goals/${goal.id}/replan`, { method: "POST", body: {} });
    onRetry();
    setBusy(false);
  }
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-red-700">
        <AlertTriangle size={16} /> Plan çıkarılamadı
      </div>
      {goal.error && <p className="mt-1 text-sm text-red-600">{goal.error}</p>}
      <Button className="mt-4" variant="secondary" onClick={retry} disabled={busy}>
        <RefreshCw size={14} /> Tekrar dene
      </Button>
    </div>
  );
}

function PlanReview({ goal, onReplan }: { goal: Goal; onReplan: () => void }) {
  const router = useRouter();
  const { data: users } = useApi<{ users: User[] }>("/users");
  const tasks = goal.plan.tasks ?? [];
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"accept" | "replan" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const included = tasks.filter((t) => !excluded.has(t.ref));
  const agentCount = included.filter((t) => t.agent_executable).length;

  function toggle(ref: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

  async function accept() {
    setBusy("accept");
    setError(null);
    try {
      const res = await api<{ project_id: number }>(`/goals/${goal.id}/accept`, {
        method: "POST",
        body: { excluded_refs: [...excluded], assignee_overrides: overrides },
      });
      router.push(`/projects/${res.project_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Plan kabul edilemedi");
      setBusy(null);
    }
  }

  async function replan() {
    setBusy("replan");
    await api(`/goals/${goal.id}/replan`, {
      method: "POST",
      body: { context: [goal.context, feedback].filter(Boolean).join("\n") },
    });
    setFeedback("");
    onReplan();
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <AgentAvatar size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Önerilen proje</div>
          <div className="text-lg font-semibold text-zinc-900">{goal.plan.project_name}</div>
          {goal.plan.summary && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{goal.plan.summary}</p>}
          {goal.plan.risks && goal.plan.risks.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-amber-700">Riskler</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                {goal.plan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            {included.length} görev · {agentCount} tanesini JokerAI kendisi yürütecek
          </h2>
          <span className="text-xs text-zinc-400">İstemediğin görevin işaretini kaldır, atamaları değiştir</span>
        </div>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <PlanTaskRow
              key={task.ref}
              task={task}
              tasks={tasks}
              users={users?.users ?? []}
              included={!excluded.has(task.ref)}
              assignee={overrides[task.ref] ?? (task.assignee_id ? String(task.assignee_id) : "")}
              onToggle={() => toggle(task.ref)}
              onAssign={(value) => setOverrides((prev) => ({ ...prev, [task.ref]: value }))}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            className="input flex-1"
            placeholder="Plan uymadı mı? Ek bağlam yaz, yeniden planlasın"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Button variant="secondary" onClick={replan} disabled={busy !== null}>
            <RefreshCw size={14} /> Yeniden planla
          </Button>
        </div>
        <Button variant="agent" onClick={accept} disabled={busy !== null || included.length === 0}>
          <Sparkles size={16} />
          {busy === "accept" ? "Proje kuruluyor..." : "Onayla, projeyi kur ve başlat"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PlanTaskRow({
  task,
  tasks,
  users,
  included,
  assignee,
  onToggle,
  onAssign,
}: {
  task: PlanTask;
  tasks: PlanTask[];
  users: User[];
  included: boolean;
  assignee: string;
  onToggle: () => void;
  onAssign: (value: string) => void;
}) {
  const dependency = tasks.find((t) => t.ref === task.depends_on);
  return (
    <li
      className={cx(
        "rounded-xl border bg-white p-4 transition-opacity",
        included ? "border-zinc-200" : "border-dashed border-zinc-200 opacity-50",
      )}
    >
      <div className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-lime-600" checked={included} onChange={onToggle} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-900">{task.title}</span>
            <PriorityBadge priority={task.priority} />
            {task.agent_executable ? (
              <span className="inline-flex items-center gap-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-medium text-lime-400">
                <Bot size={12} /> JokerAI yürütür{task.agent_kind ? ` · ${AGENT_KIND_LABEL[task.agent_kind] ?? task.agent_kind}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                <UserIcon size={12} /> İnsan görevi
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600">{task.description}</p>
          {task.subtasks.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-zinc-500">
              {task.subtasks.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span>Bitiş: {addDays(task.due_in_days)}</span>
            {dependency && (
              <span className="inline-flex items-center gap-1">
                <Link2 size={12} /> Önce: {dependency.title}
              </span>
            )}
            <label className="inline-flex items-center gap-1">
              Sorumlu:
              <select
                className="select h-7 py-0 text-xs"
                value={assignee}
                onChange={(e) => onAssign(e.target.value)}
                disabled={!included}
              >
                <option value="">Atanmamış</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </li>
  );
}
