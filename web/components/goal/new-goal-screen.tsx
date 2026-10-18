"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";
import type { Goal } from "@/lib/types";
import { AgentAvatar, Button } from "@/components/ui";

const EXAMPLES = [
  "Yılbaşı yoğunluğu için Ankara aktarma merkezinde gece vardiyası kapasitesini %30 artır",
  "Kurumsal müşterilere yeni iade sürecini duyuran bir lansman hazırla",
  "Son mil teslimatlarda müşteri şikayetlerini çeyrek sonuna kadar %20 azalt",
];

const STATUS_LABEL: Record<Goal["status"], string> = {
  planning: "Planlanıyor",
  planned: "Onayını bekliyor",
  accepted: "Projeye dönüştü",
  failed: "Başarısız",
};

export function NewGoalScreen() {
  const router = useRouter();
  const { data } = useApi<{ goals: Goal[] }>("/goals");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 10) {
      setError("Hedefi en az bir cümleyle anlat.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ goal: Goal }>("/goals", {
        method: "POST",
        body: { goal: { title: title.trim(), context: context.trim() || null, deadline: deadline || null } },
      });
      router.push(`/goals/${res.goal.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Hedef gönderilemedi");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="flex items-center gap-3">
        <AgentAvatar size={36} />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Hedef ver, JokerAI yürütsün</h1>
          <p className="text-sm text-zinc-500">
            Ajan hedefi görevlere böler, ekibin yeteneğine ve iş yüküne göre atar, kendi yapabileceği işleri hemen
            yürütür. Sen yalnızca onaylarsın.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="goal-title">
            Hedef
          </label>
          <textarea
            id="goal-title"
            className="textarea min-h-24"
            placeholder="Örn. Q1'de İzmir deposunda sipariş hazırlama süresini %25 kısalt"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setTitle(example)}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-lime-400 hover:bg-lime-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="goal-context">
            Bağlam <span className="font-normal text-zinc-400">(isteğe bağlı)</span>
          </label>
          <textarea
            id="goal-context"
            className="textarea min-h-20"
            placeholder="Bütçe, kısıtlar, paydaşlar, mevcut durum..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={2000}
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="goal-deadline">
              Son tarih <span className="font-normal text-zinc-400">(isteğe bağlı)</span>
            </label>
            <input
              id="goal-deadline"
              type="date"
              className="input w-48"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <Button type="submit" variant="agent" disabled={busy}>
            <Sparkles size={16} />
            {busy ? "Gönderiliyor..." : "Planı çıkar"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {data && data.goals.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Önceki hedeflerin</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {data.goals.map((goal) => (
              <li key={goal.id}>
                <Link
                  href={goal.project_id ? `/projects/${goal.project_id}` : `/goals/${goal.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
                >
                  <span className="truncate text-sm text-zinc-800">{goal.title}</span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {STATUS_LABEL[goal.status]} · {formatDateTime(goal.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
