import type { Priority } from "./types";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function parseDate(value: string) {
  return value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return dateFmt.format(parseDate(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  return dateTimeFmt.format(parseDate(value));
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dueTone(due: string | null, completed: boolean) {
  if (!due || completed) return "text-zinc-500";
  const today = todayISO();
  if (due < today) return "text-red-600";
  if (due === today) return "text-amber-600";
  return "text-zinc-500";
}

export function relativeDue(due: string | null) {
  if (!due) return "";
  const today = todayISO();
  if (due === today) return "Bugün";
  const diff = Math.round((parseDate(due).getTime() - parseDate(today).getTime()) / 86400000);
  if (diff === 1) return "Yarın";
  if (diff === -1) return "Dün";
  return formatDate(due);
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-700",
};

export const AGENT_KIND_LABEL: Record<string, string> = {
  content: "İçerik",
  analysis: "Analiz",
  draft: "Taslak",
  integration: "Entegrasyon",
  checklist: "Kontrol listesi",
};

export const ACTIVITY_LABEL: Record<string, string> = {
  project_created: "projeyi oluşturdu",
  task_created: "görevi oluşturdu",
  subtask_created: "alt görev ekledi",
  task_updated: "görevi güncelledi",
  task_assigned: "görevi atadı",
  task_completed: "görevi tamamladı",
  task_reopened: "görevi yeniden açtı",
  task_moved: "görevi taşıdı",
  task_deleted: "görevi sildi",
  comment_added: "yorum yaptı",
  member_added: "üye ekledi",
  agent_queued: "ajan işi sıraya aldı",
  artifact_generated: "çıktı üretti, onay bekliyor",
  artifact_approved: "ajan çıktısını onayladı",
  artifact_rejected: "geri bildirimle reddetti",
  agent_failed: "ajan işi başarısız oldu",
  next_step_prepared: "sonraki adımı hazırladı",
  project_from_goal: "hedeften projeyi kurdu",
};
