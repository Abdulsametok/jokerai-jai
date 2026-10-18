"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { ProjectDetail, User } from "@/lib/types";
import { Avatar, Button } from "../ui";

const ROLE_LABEL = { owner: "Sahip", admin: "Yönetici", member: "Üye" } as const;

export function MembersButton({ project, onChange }: { project: ProjectDetail; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const { data } = useApi<{ users: User[] }>(open ? "/users" : null);
  const canManage = project.role === "owner" || project.role === "admin";
  const candidates = data?.users.filter((u) => !project.members.some((m) => m.id === u.id)) ?? [];

  async function add() {
    if (!userId) return;
    await api(`/projects/${project.id}/members`, { method: "POST", body: { user_id: Number(userId) } });
    setUserId("");
    onChange();
  }

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        <UserPlus size={14} /> Üyeler
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
          <div className="mb-2 text-xs font-semibold uppercase text-zinc-400">Proje üyeleri</div>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto">
            {project.members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Avatar user={m} size={24} />
                <span className="flex-1 truncate">{m.name}</span>
                <span className="text-xs text-zinc-400">{ROLE_LABEL[m.role]}</span>
              </li>
            ))}
          </ul>
          {canManage ? (
            <div className="mt-3 flex gap-2">
              <select className="select flex-1" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Kişi seç...</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={add} disabled={!userId}>
                Ekle
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">Üye eklemek için yönetici olmalısın.</p>
          )}
        </div>
      )}
    </div>
  );
}
