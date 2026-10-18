import { ApiStatus } from "./api-status";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#121417] px-6 text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        <div>
          <div className="text-3xl font-semibold tracking-tight">
            Joker<span className="text-lime-400">AI</span>
          </div>
          <p className="mt-2 text-zinc-400">Hedefi yaz, iş yürüsün. Sen sadece onayla.</p>
        </div>
        <ApiStatus />
      </div>
    </main>
  );
}
