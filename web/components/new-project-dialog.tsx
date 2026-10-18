"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { api } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";
import { Button } from "./ui";

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { project } = await api<{ project: ProjectDetail }>("/projects", {
        method: "POST",
        body: { project: { name, description, due_on: dueOn || null } },
      });
      await mutate("/projects");
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Yeni proje</h2>
        <input className="input" placeholder="Proje adı" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <textarea
          className="textarea"
          rows={3}
          placeholder="Açıklama (isteğe bağlı)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="block text-sm text-zinc-600">
          Bitiş tarihi
          <input className="input mt-1" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" disabled={busy}>
            Oluştur
          </Button>
        </div>
      </form>
    </div>
  );
}
