"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

type Health = {
  status: string;
  time: string;
  database: string;
  jobs: { adapter: string; alive_processes?: Record<string, number>; last_heartbeat_at?: string | null };
};

export function ApiStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Health>("/health")
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
      <div className="mb-2 font-medium text-zinc-300">API bağlantısı</div>
      <div className="font-mono text-xs text-zinc-400">{API_URL}</div>
      {error && <div className="mt-2 text-red-400">Hata: {error}</div>}
      {!error && !health && <div className="mt-2 text-zinc-400">Kontrol ediliyor...</div>}
      {health && (
        <ul className="mt-2 space-y-1 text-zinc-300">
          <li>
            Durum: <span className="text-lime-400">{health.status}</span>
          </li>
          <li>Veritabanı: {health.database}</li>
          <li>Kuyruk: {health.jobs.adapter}</li>
          {health.jobs.alive_processes && (
            <li>Kuyruk süreçleri: {JSON.stringify(health.jobs.alive_processes)}</li>
          )}
        </ul>
      )}
    </div>
  );
}
