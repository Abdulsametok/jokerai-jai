"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

type Health = {
  status: string;
  database: string;
  jobs: { adapter: string; alive_processes?: Record<string, number> };
};

export function ApiStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Health>("/health")
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  const workers = health?.jobs.alive_processes ? Object.keys(health.jobs.alive_processes).length : 0;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <span
        className={`h-2 w-2 rounded-full ${error ? "bg-red-500" : health ? "bg-lime-500" : "animate-pulse bg-zinc-400"}`}
      />
      <span className="font-mono">{API_URL.replace(/^https?:\/\//, "")}</span>
      {health && (
        <span>
          · DB {health.database} · kuyruk {health.jobs.adapter}
          {workers > 0 && ` (${workers} süreç)`}
        </span>
      )}
      {error && <span className="text-red-500">· {error}</span>}
    </div>
  );
}
