"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CheckSquare, Inbox, LogOut, Plus, Sparkles, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { ProjectSummary } from "@/lib/types";
import { useSession } from "./session";
import { Logo } from "./logo";
import { Avatar, cx } from "./ui";
import { NewProjectDialog } from "./new-project-dialog";

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useApi<{ projects: ProjectSummary[] }>("/projects");
  const [creating, setCreating] = useState(false);

  async function logout() {
    await api("/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/login");
  }

  const nav = [
    { href: "/my-tasks", label: "Görevlerim", icon: CheckSquare },
    { href: "/inbox", label: "Gelen kutusu", icon: Inbox, badge: me.unread_notifications },
    { href: "/ai-usage", label: "AI maliyeti", icon: Wallet },
  ];

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col lg:w-64 bg-[#121417] text-zinc-300">
        <div className="px-4 py-4">
          <Link href="/my-tasks">
            <Logo />
          </Link>
        </div>

        <div className="px-3">
          <Link
            href="/goals/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-lime-300"
          >
            <Sparkles size={16} /> Hedef ver, ajan yürütsün
          </Link>
        </div>

        <nav className="mt-4 space-y-0.5 px-2">
          {nav.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
                pathname.startsWith(href) ? "bg-white/10 text-white" : "hover:bg-white/5",
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span className="rounded-full bg-lime-400 px-1.5 text-[11px] font-semibold text-zinc-900">{badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex items-center justify-between px-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Projeler
          <button onClick={() => setCreating(true)} className="rounded p-0.5 hover:bg-white/10" aria-label="Yeni proje">
            <Plus size={14} />
          </button>
        </div>
        <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {data?.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={cx(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
                pathname === `/projects/${p.id}` ? "bg-white/10 text-white" : "hover:bg-white/5",
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
              {p.from_goal && <Sparkles size={12} className="ml-auto shrink-0 text-lime-400" />}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
          <Avatar user={me} size={28} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-white">{me.name}</div>
            <div className="truncate text-xs text-zinc-500">{me.title}</div>
          </div>
          <button onClick={logout} className="rounded p-1 hover:bg-white/10" aria-label="Çıkış yap" title="Çıkış yap">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
      {creating && <NewProjectDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
