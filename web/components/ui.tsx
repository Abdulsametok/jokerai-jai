"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Priority, User } from "@/lib/types";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/format";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "agent";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-700",
        variant === "secondary" && "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        variant === "agent" && "bg-lime-400 text-zinc-900 hover:bg-lime-300",
        className,
      )}
    />
  );
}

export function Avatar({ user, size = 24 }: { user: User | null | undefined; size?: number }) {
  if (!user) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title="Atanmamış"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: user.avatar_color }}
      title={user.name}
    >
      {user.initials}
    </span>
  );
}

export function AgentAvatar({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-bold text-lime-400"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title="JokerAI ajanı"
    >
      J
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cx("rounded px-1.5 py-0.5 text-[11px] font-medium", PRIORITY_STYLE[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-zinc-200", className)}>
      <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-lime-500" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
      <div className="font-medium text-zinc-700">{title}</div>
      {children && <div className="mt-1 text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

export function CheckCircle({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-label={checked ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
      className={cx(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-lime-600 bg-lime-500 text-white" : "border-zinc-400 hover:border-lime-600 hover:bg-lime-50",
      )}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5l2.2 2.2 4.8-5" />
        </svg>
      )}
    </button>
  );
}
