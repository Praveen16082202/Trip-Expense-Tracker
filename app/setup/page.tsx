"use client";

import { useState } from "react";
import { Palmtree, UsersRound, WalletCards } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card, buttonClass, inputClass } from "@/components/ui";

export default function SetupPage() {
  const { createTrip, joinTrip, configured } = useTrip();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [tripName, setTripName] = useState("Kerala Trip 2026");
  const [creatorName, setCreatorName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "create") {
        if (!tripName.trim() || !creatorName.trim()) throw new Error("Enter the trip name and your name.");
        await createTrip(tripName, creatorName);
      } else {
        if (!code.trim()) throw new Error("Enter the trip code.");
        await joinTrip(code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg"><Palmtree size={30} /></div>
          <h1 className="text-3xl font-black text-emerald-950">Kerala Trip Wallet</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Collect money, record every spend, and know exactly what is left.</p>
        </div>

        {!configured && (
          <Card className="mb-5 border-amber-200 bg-amber-50">
            <p className="font-bold text-amber-900">Supabase setup required</p>
            <p className="mt-1 text-sm text-amber-800">Copy .env.example to .env.local and add your Supabase URL and anon key.</p>
          </Card>
        )}

        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1">
          <button onClick={() => setMode("create")} className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "create" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}>Create trip</button>
          <button onClick={() => setMode("join")} className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "join" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}>Join trip</button>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "create" ? (
              <>
                <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Trip name</span><input className={inputClass} value={tripName} onChange={(e) => setTripName(e.target.value)} /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Your name</span><input className={inputClass} placeholder="Praveen" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} /></label>
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex gap-3"><WalletCards size={20} className="shrink-0" /><p>A 6-character trip code will be created. Share it with your friends so everyone opens the same wallet.</p></div></div>
              </>
            ) : (
              <>
                <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Trip code</span><input className={`${inputClass} uppercase tracking-[0.25em]`} maxLength={6} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
                <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900"><div className="flex gap-3"><UsersRound size={20} className="shrink-0" /><p>After joining, add yourself under Members before recording your contribution or personal payment.</p></div></div>
              </>
            )}
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button className={`${buttonClass} w-full`} disabled={!configured || busy}>{busy ? "Please wait..." : mode === "create" ? "Create Kerala Trip" : "Join Trip"}</button>
          </form>
        </Card>
      </div>
    </main>
  );
}
