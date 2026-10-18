"use client";

import { useApi } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";
import { Spinner, cx } from "@/components/ui";

type Usage = {
  totals: {
    runs: number;
    failed: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    avg_duration_ms: number;
    approved_outputs: number;
    cost_per_approved_output: number | null;
    estimated_minutes_saved: number;
  };
  by_kind: { kind: string; runs: number; tokens_in: number; tokens_out: number; cost_usd: number }[];
  models: string[];
  recent: {
    id: number;
    kind: string;
    model: string;
    status: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    duration_ms: number;
    task: string | null;
    goal: string | null;
    created_at: string;
  }[];
};

const KIND_LABEL: Record<string, string> = {
  plan: "Hedef planlama",
  execute: "Görev yürütme",
  revise: "Revizyon",
  next_step: "Sonraki adım brifi",
  status_update: "Durum özeti",
};

const usd = (v: number) => `$${v.toFixed(v < 0.01 ? 5 : 4)}`;
const num = (v: number) => v.toLocaleString("tr-TR");

export function AiUsageScreen() {
  const { data } = useApi<Usage>("/ai/usage", { refreshInterval: 15000 });
  if (!data) return <div className="p-8"><Spinner label="Yükleniyor..." /></div>;

  const { totals } = data;
  const hours = (totals.estimated_minutes_saved / 60).toFixed(1);
  const cards = [
    { label: "Toplam maliyet", value: usd(totals.cost_usd), hint: data.models.join(", ") || "henüz çağrı yok" },
    { label: "Onaylanan ajan çıktısı", value: num(totals.approved_outputs), hint: totals.cost_per_approved_output !== null ? `${usd(totals.cost_per_approved_output)} / çıktı` : "-" },
    { label: "Tahmini kazanılan süre", value: `${hours} saat`, hint: "çıktı türüne göre insan eşdeğeri" },
    { label: "LLM çağrısı", value: num(totals.runs), hint: `${totals.failed} hata · ort. ${(totals.avg_duration_ms / 1000).toFixed(1)} sn` },
    { label: "Token (girdi / çıktı)", value: `${num(totals.tokens_in)} / ${num(totals.tokens_out)}`, hint: "agent_runs tablosundan" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">AI maliyeti ve etkisi</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Her LLM çağrısı token, maliyet ve süre ile kaydedilir. Anahtarlar yalnızca sunucuda durur.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs text-zinc-500">{card.label}</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">{card.value}</div>
            <div className="mt-1 truncate text-[11px] text-zinc-400">{card.hint}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-zinc-700">İş türüne göre</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tür</th>
              <th className="px-4 py-2 font-medium">Çağrı</th>
              <th className="px-4 py-2 font-medium">Token girdi</th>
              <th className="px-4 py-2 font-medium">Token çıktı</th>
              <th className="px-4 py-2 font-medium">Maliyet</th>
            </tr>
          </thead>
          <tbody>
            {data.by_kind.map((row) => (
              <tr key={row.kind} className="border-t border-zinc-100">
                <td className="px-4 py-2">{KIND_LABEL[row.kind] ?? row.kind}</td>
                <td className="px-4 py-2">{num(row.runs)}</td>
                <td className="px-4 py-2">{num(row.tokens_in)}</td>
                <td className="px-4 py-2">{num(row.tokens_out)}</td>
                <td className="px-4 py-2">{usd(row.cost_usd)}</td>
              </tr>
            ))}
            {data.by_kind.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">Henüz ajan çağrısı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-zinc-700">Son çağrılar</h2>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white text-sm">
        {data.recent.map((run) => (
          <li key={run.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-zinc-800">
                {KIND_LABEL[run.kind] ?? run.kind}: {run.task ?? run.goal ?? "-"}
              </div>
              <div className="text-xs text-zinc-400">
                {formatDateTime(run.created_at)} · {run.model} · {(run.duration_ms / 1000).toFixed(1)} sn
              </div>
            </div>
            <div className="shrink-0 text-right text-xs">
              <div className={cx(run.status === "ok" ? "text-zinc-700" : "text-red-600")}>
                {run.status === "ok" ? usd(run.cost_usd) : "hata"}
              </div>
              <div className="text-zinc-400">{num(run.tokens_in + run.tokens_out)} token</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
