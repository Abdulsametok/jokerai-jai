import type { Activity } from "@/lib/types";
import { ACTIVITY_LABEL, formatDateTime } from "@/lib/format";

function detail(a: Activity) {
  const d = a.data as Record<string, string | string[] | undefined>;
  if (a.action === "task_moved") return `${d.from ?? "?"} → ${d.to}`;
  if (a.action === "task_assigned") return d.assignee ? `→ ${d.assignee}` : "atamayı kaldırdı";
  if (a.action === "artifact_rejected" && d.feedback) return `"${d.feedback}"`;
  if (a.action === "artifact_generated" && d.version) return `v${d.version}`;
  return "";
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">Aktivite</h3>
      <ul className="space-y-1.5 border-l border-zinc-200 pl-3">
        {activities.map((a) => (
          <li key={a.id} className="text-xs text-zinc-500">
            <span className={a.by_agent ? "font-medium text-lime-700" : "font-medium text-zinc-700"}>
              {a.by_agent ? "JokerAI" : a.actor?.name}
            </span>{" "}
            {ACTIVITY_LABEL[a.action] ?? a.action} {detail(a)}{" "}
            <span className="text-zinc-400">· {formatDateTime(a.created_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
