import type { AgentState } from "@/lib/types";

const STYLES: Partial<Record<AgentState, [string, string]>> = {
  queued: ["Ajan sırada", "bg-zinc-200 text-zinc-700"],
  working: ["Ajan çalışıyor", "bg-lime-100 text-lime-800 animate-pulse"],
  awaiting_review: ["Onay bekliyor", "bg-amber-100 text-amber-800"],
  approved: ["Ajan çıktısı onaylandı", "bg-lime-100 text-lime-800"],
  failed: ["Ajan hatası", "bg-red-100 text-red-700"],
};

export function AgentStateBadge({ state }: { state: AgentState }) {
  const style = STYLES[state];
  if (!style) return null;
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${style[1]}`}>{style[0]}</span>;
}
