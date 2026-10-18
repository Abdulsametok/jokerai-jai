"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, RotateCcw, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Artifact, TaskDetail } from "@/lib/types";
import { AGENT_KIND_LABEL, formatDateTime } from "@/lib/format";
import { Button, Spinner, cx } from "../ui";

export function ArtifactContent({ content }: { content: string }) {
  return (
    <div className="prose-artifact text-sm text-zinc-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function AgentPanel({ task, onChange }: { task: TaskDetail; onChange: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!task.agent_executable && task.artifacts.length === 0) return null;

  const latest = task.artifacts[task.artifacts.length - 1] as Artifact | undefined;
  const history = task.artifacts.slice(0, -1).reverse();
  const working = task.agent_state === "queued" || task.agent_state === "working";

  async function call(path: string, body?: unknown) {
    setBusy(true);
    try {
      await api(path, { method: "POST", body });
      setFeedback("");
      setRejecting(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-900/10 bg-zinc-50">
      <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2.5 text-sm text-white">
        <Bot size={16} className="text-lime-400" />
        <span className="font-medium">JokerAI yürütme</span>
        {task.agent_kind && (
          <span className="rounded bg-white/10 px-1.5 text-[11px] text-zinc-300">{AGENT_KIND_LABEL[task.agent_kind]}</span>
        )}
        <span className="flex-1" />
        {latest && <span className="text-[11px] text-zinc-400">v{latest.version}</span>}
      </div>

      <div className="space-y-3 p-4">
        {working && <Spinner label="JokerAI bu görevi yürütüyor, çıktı birazdan onayına gelecek..." />}

        {!working && !latest && task.agent_state !== "failed" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">Bu görevi ajan yürütebilir. Çıktı hazır olunca onayına sunulur.</p>
            <Button variant="agent" size="sm" disabled={busy} onClick={() => call(`/tasks/${task.id}/agent_run`)}>
              <Sparkles size={14} /> Ajana yaptır
            </Button>
          </div>
        )}

        {task.agent_state === "failed" && (
          <div className="flex items-center justify-between gap-3 text-sm text-red-700">
            Ajan bu görevi tamamlayamadı.
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => call(`/tasks/${task.id}/agent_run`)}>
              <RotateCcw size={14} /> Tekrar dene
            </Button>
          </div>
        )}

        {latest && !working && (
          <div
            className={cx(
              "rounded-lg border bg-white",
              latest.status === "pending_review" ? "border-amber-300" : "border-zinc-200",
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
              <div className="text-sm font-medium">{latest.title}</div>
              <StatusPill artifact={latest} />
            </div>
            <div className="max-h-96 overflow-y-auto px-3 py-2">
              <ArtifactContent content={latest.content} />
            </div>

            {latest.status === "pending_review" && task.can_review && (
              <div className="space-y-2 border-t border-zinc-100 p-3">
                {rejecting ? (
                  <>
                    <textarea
                      autoFocus
                      className="textarea"
                      rows={2}
                      placeholder="Neyi değiştirsin? Ajan bu geri bildirimle yeni sürüm üretecek."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                        Vazgeç
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy || !feedback.trim()}
                        onClick={() => call(`/artifacts/${latest.id}/reject`, { feedback })}
                      >
                        Reddet ve yeniden üret
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>
                      Geri bildirimle reddet
                    </Button>
                    <Button size="sm" variant="agent" disabled={busy} onClick={() => call(`/artifacts/${latest.id}/approve`)}>
                      <Check size={14} /> Onayla ve tamamla
                    </Button>
                  </div>
                )}
              </div>
            )}
            {latest.status === "pending_review" && !task.can_review && (
              <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500">
                Proje yöneticisinin onayı bekleniyor.
              </p>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-zinc-500 hover:underline">
              {showHistory ? "Önceki sürümleri gizle" : `Önceki sürümler (${history.length})`}
            </button>
            {showHistory && (
              <ul className="mt-2 space-y-2">
                {history.map((a) => (
                  <li key={a.id} className="rounded-lg border border-zinc-200 bg-white p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        v{a.version} · {a.title}
                      </span>
                      <StatusPill artifact={a} />
                    </div>
                    {a.feedback && <p className="mt-1 text-red-700">Geri bildirim: {a.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusPill({ artifact }: { artifact: Artifact }) {
  const map = {
    pending_review: ["Onayını bekliyor", "bg-amber-100 text-amber-800"],
    approved: ["Onaylandı", "bg-lime-100 text-lime-800"],
    rejected: ["Reddedildi", "bg-red-100 text-red-700"],
    superseded: ["Eski sürüm", "bg-zinc-100 text-zinc-500"],
  } as const;
  const [label, style] = map[artifact.status];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${style}`} title={formatDateTime(artifact.created_at)}>
      {label}
    </span>
  );
}
