"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    api("/me")
      .then(() => router.replace("/my-tasks"))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center">
      <Spinner label="JokerAI açılıyor..." />
    </main>
  );
}
