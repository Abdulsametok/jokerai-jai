"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Me } from "@/lib/types";
import { Spinner } from "./ui";

type SessionValue = { me: Me; refresh: () => void };

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, mutate } = useApi<{ user: Me }>("/me", { refreshInterval: 30000 });
  const unauthorized = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [unauthorized, router]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        {error && !unauthorized ? (
          <div className="text-sm text-red-600">API&apos;ye ulaşılamadı: {error.message}</div>
        ) : (
          <Spinner label="Yükleniyor..." />
        )}
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ me: data.user, refresh: () => void mutate() }}>{children}</SessionContext.Provider>
  );
}
