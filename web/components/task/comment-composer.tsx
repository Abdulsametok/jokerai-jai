"use client";

import { useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { User } from "@/lib/types";
import { Avatar, Button } from "../ui";

// Typing "@" opens a people picker; picked names are inserted as "@Ad Soyad"
// and their ids are sent so the API can notify exactly those users.
export function CommentComposer({ taskId, onPosted }: { taskId: number; onPosted: () => void }) {
  const { data } = useApi<{ users: User[] }>("/users");
  const [body, setBody] = useState("");
  const [mentioned, setMentioned] = useState<User[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const matches = useMemo(() => {
    if (query === null || !data) return [];
    const q = query.toLocaleLowerCase("tr");
    return data.users.filter((u) => u.name.toLocaleLowerCase("tr").includes(q)).slice(0, 6);
  }, [query, data]);

  function onChangeText(value: string) {
    setBody(value);
    const caret = ref.current?.selectionStart ?? value.length;
    const match = /(^|\s)@([^\s@]*)$/.exec(value.slice(0, caret));
    setQuery(match ? match[2] : null);
  }

  function pick(user: User) {
    const caret = ref.current?.selectionStart ?? body.length;
    const before = body.slice(0, caret).replace(/@([^\s@]*)$/, `@${user.name} `);
    setBody(before + body.slice(caret));
    setMentioned((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
    setQuery(null);
    ref.current?.focus();
  }

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: { body, mentioned_user_ids: mentioned.map((u) => u.id) },
      });
      setBody("");
      setMentioned([]);
      onPosted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mt-3">
      <textarea
        ref={ref}
        className="textarea min-h-16"
        placeholder="Yorum yaz... (@ ile birinden bahset)"
        value={body}
        onChange={(e) => onChangeText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          if (e.key === "Escape") setQuery(null);
        }}
      />
      {matches.length > 0 && (
        <ul className="absolute bottom-full left-0 z-20 mb-1 w-64 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {matches.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(u);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-lime-50"
              >
                <Avatar user={u} size={20} />
                <span className="flex-1 truncate">{u.name}</span>
                <span className="truncate text-xs text-zinc-400">{u.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={busy || !body.trim()}>
          Yorum gönder
        </Button>
      </div>
    </div>
  );
}
