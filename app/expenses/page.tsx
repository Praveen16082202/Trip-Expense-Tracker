"use client";

import { useState } from "react";
import { ReceiptText, Trash2 } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";

const categories = ["Food", "Stay", "Travel", "Fuel", "Tickets", "Shopping", "Emergency", "Other"];

export default function ExpensesPage() {
  const { trip, members, expenses, refresh, loading } = useTrip();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"trip_fund" | "personal">("trip_fund");
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading || !trip) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!supabase || !description.trim() || value <= 0 || (source === "personal" && !memberId)) return;
    setBusy(true); setError("");
    const { error } = await supabase.from("expenses").insert({
      trip_id: trip.id,
      member_id: source === "personal" ? memberId : null,
      description: description.trim(),
      category,
      amount: value,
      payment_source: source,
      spent_at: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim() || null,
    });
    if (error) setError(error.message); else {
      setDescription(""); setAmount(""); setNote(""); await refresh();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!supabase || !confirm("Delete this expense?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    await refresh();
  }

  const total = expenses.reduce((sum, x) => sum + Number(x.amount), 0);
  const fund = expenses.filter((x) => x.payment_source === "trip_fund").reduce((sum, x) => sum + Number(x.amount), 0);
  const personal = total - fund;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-900">Expenses</h1><p className="mt-1 text-sm text-slate-500">Record everything spent during the trip, whether it came from the common wallet or someone paid personally.</p></div>

      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs font-bold text-slate-400">TOTAL</p><p className="mt-2 text-xl font-black">{money(total)}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">FUND</p><p className="mt-2 text-xl font-black text-emerald-800">{money(fund)}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">PERSONAL</p><p className="mt-2 text-xl font-black text-sky-800">{money(personal)}</p></Card>
      </div>

      <Card id="add-expense">
        <div className="mb-4 flex items-center gap-2"><ReceiptText size={20} className="text-emerald-700" /><h2 className="font-extrabold">Add expense</h2></div>
        <form onSubmit={addExpense} className="grid gap-3 md:grid-cols-2">
          <input className={inputClass} placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className={inputClass} type="number" min="1" step="1" placeholder="Amount ₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as "trip_fund" | "personal")}><option value="trip_fund">Paid from trip fund</option><option value="personal">Paid personally</option></select>
          {source === "personal" ? <select className={inputClass} value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">Who paid?</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select> : <input className={inputClass} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />}
          {source === "personal" && <input className={`${inputClass} md:col-span-2`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />}
          {error && <p className="text-sm font-semibold text-red-600 md:col-span-2">{error}</p>}
          <button className={`${buttonClass} md:col-span-2`} disabled={busy || !description.trim() || Number(amount) <= 0 || (source === "personal" && !memberId)}>Save expense</button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-extrabold">Expense history</h2>
        <div className="space-y-2">
          {expenses.map((e) => {
            const payer = e.payment_source === "personal" ? members.find((m) => m.id === e.member_id)?.name || "Member" : "Trip fund";
            return <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"><div className="min-w-0"><p className="truncate font-semibold">{e.description}</p><p className="text-xs text-slate-500">{e.category} · {shortDate(e.spent_at)} · {payer}{e.note ? ` · ${e.note}` : ""}</p></div><div className="flex shrink-0 items-center gap-3"><span className="font-extrabold">{money(Number(e.amount))}</span><button className={`${secondaryButtonClass} !p-2 text-red-600`} onClick={() => remove(e.id)}><Trash2 size={16} /></button></div></div>;
          })}
          {expenses.length === 0 && <p className="py-5 text-center text-sm text-slate-500">No expenses yet.</p>}
        </div>
      </Card>
    </div>
  );
}
