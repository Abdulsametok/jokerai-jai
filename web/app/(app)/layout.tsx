import { Suspense } from "react";
import { SessionProvider } from "@/components/session";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/ui";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner label="Yükleniyor..." />
        </div>
      }
    >
      <SessionProvider>
        <AppShell>{children}</AppShell>
      </SessionProvider>
    </Suspense>
  );
}
