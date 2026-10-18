"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Logo } from "@/components/logo";
import { ApiStatus } from "@/components/api-status";
import { Button } from "@/components/ui";

const DEMO_PASSWORD = "jokerai2026";
const PERSONAS = [
  { email: "deniz@northwind.test", name: "Deniz Arslan", title: "Operasyon Müdürü (onaylayan)" },
  { email: "mert@northwind.test", name: "Mert Kaya", title: "Veri Analisti" },
  { email: "ece@northwind.test", name: "Ece Yıldız", title: "Vardiya Planlama Uzmanı" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: FormEvent, override?: { email: string; password: string }) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup" && !override) {
        await api("/users", { method: "POST", body: { name, email, password } });
      } else {
        await api("/session", { method: "POST", body: override ?? { email, password } });
      }
      router.replace("/my-tasks");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#121417] p-12 text-white lg:flex">
        <Logo />
        <div className="max-w-md space-y-5">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Görevleri listeleme. <span className="text-lime-400">Yürüt.</span>
          </h1>
          <p className="text-zinc-400">
            Hedefini tek cümleyle yaz. JokerAI projeyi kurar, işi ekibe dağıtır, taslakları ve analizleri kendisi
            üretir. Sen sadece kontrol eder ve onaylarsın.
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>· Proje ve görev yönetimi, liste ve pano görünümü</li>
            <li>· Yorum, @bahsetme, Görevlerim ve gelen kutusu</li>
            <li>· Hedef → plan → otomatik yürütme → insan onayı</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-500">Tüm demo verisi sentetiktir (hayali Northwind Lojistik).</p>
      </section>

      <section className="flex flex-col items-center justify-center gap-8 p-6">
        <div className="lg:hidden">
          <Logo dark />
        </div>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">{mode === "login" ? "Giriş yap" : "Hesap oluştur"}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {mode === "login" ? "Hesabınla ya da bir demo kullanıcıyla devam et." : "Kendi çalışma alanını oluştur."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                className="input"
                placeholder="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="E-posta"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Parola (en az 8 karakter)"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Kayıt ol"}
            </Button>
          </form>

          <button
            type="button"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
          </button>

          {mode === "login" && (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Demo kullanıcılar</div>
              {PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  disabled={busy}
                  onClick={() => submit(undefined, { email: p.email, password: DEMO_PASSWORD })}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm hover:border-lime-500 hover:bg-lime-50"
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-zinc-500">{p.title}</span>
                  </span>
                  <span className="text-xs text-zinc-400">Giriş →</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <ApiStatus />
      </section>
    </main>
  );
}
