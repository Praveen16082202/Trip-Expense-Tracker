"use client";

import { useMemo, useState } from "react";
import { Trash2, UserPlus, WalletCards } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const { trip, members, contributions, refresh, loading, leaveTrip } = useTrip();
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    contributions.forEach((c) => map.set(c.member_id, (map.get(c.member_id) || 0) + Number(c.amount)));
    return map;
  }, [contributions]);

  if (loading || !trip) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !name.trim()) return;
    setBusy(true); setError("");
    const { error } = await supabase.from("members").insert({ trip_id: trip.id, name: name.trim() });
    if (error) setError(error.message); else { setName(""); await refresh(); }
    setBusy(false);
  }

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!supabase || !memberId || value <= 0) return;
    setBusy(true); setError("");
    const { error } = await supabase.from("contributions").insert({
      trip_id: trip.id,
      member_id: memberId,
      amount: value,
      note: note.trim() || null,
      contributed_at: new Date().toISOString(),
    });
    if (error) setError(error.message); else { setAmount(""); setNote(""); await refresh(); }
    setBusy(false);
  }

  async function deleteContribution(id: string) {
    if (!supabase || !confirm("Delete this contribution?")) return;
    await supabase.from("contributions").delete().eq("id", id);
    await refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-black text-slate-900">Members & contributions</h1><p className="mt-1 text-sm text-slate-500">Add everyone travelling and record each amount they put into the common trip wallet.</p></div><button onClick={leaveTrip} className={`${secondaryButtonClass} shrink-0`}>Leave trip</button></div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2"><UserPlus size={20} className="text-emerald-700" /><h2 className="font-extrabold">Add member</h2></div>
          <form onSubmit={addMember} className="flex gap-2">
            <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <button className={buttonClass} disabled={busy || !name.trim()}>Add</button>
          </form>
        </Card>

        <Card id="add-contribution">
          <div className="mb-4 flex items-center gap-2"><WalletCards size={20} className="text-emerald-700" /><h2 className="font-extrabold">Add money to trip fund</h2></div>
          <form onSubmit={addContribution} className="space-y-3">
            <select className={inputClass} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select member</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3"><input className={inputClass} type="number" min="1" step="1" placeholder="Amount ₹" value={amount} onChange={(e) => setAmount(e.target.value)} /><input className={inputClass} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <button className={`${buttonClass} w-full`} disabled={busy || !memberId || Number(amount) <= 0}>Add contribution</button>
          </form>
        </Card>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <Card>
        <h2 className="mb-4 font-extrabold">Contribution summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => <div key={m.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">{m.name}</p><p className="mt-2 text-2xl font-black text-emerald-800">{money(totals.get(m.id) || 0)}</p></div>)}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-extrabold">Contribution history</h2>
        <div className="space-y-2">
          {contributions.map((c) => {
            const member = members.find((m) => m.id === c.member_id);
            return <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"><div><p className="font-semibold">{member?.name || "Member"}</p><p className="text-xs text-slate-500">{shortDate(c.contributed_at)}{c.note ? ` · ${c.note}` : ""}</p></div><div className="flex items-center gap-3"><span className="font-extrabold text-emerald-800">+{money(Number(c.amount))}</span><button className={`${secondaryButtonClass} !p-2 text-red-600`} onClick={() => deleteContribution(c.id)} aria-label="Delete"><Trash2 size={16} /></button></div></div>;
          })}
          {contributions.length === 0 && <p className="py-5 text-center text-sm text-slate-500">No contributions yet.</p>}
        </div>
      </Card>
    </div>
  );
}
