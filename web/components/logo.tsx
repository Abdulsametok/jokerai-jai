export function Logo({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-400 text-sm font-black text-zinc-900">
        J
      </span>
      <span className={`text-lg font-semibold tracking-tight ${dark ? "text-zinc-900" : "text-white"}`}>
        Joker<span className="text-lime-500">AI</span>
      </span>
    </span>
  );
}
