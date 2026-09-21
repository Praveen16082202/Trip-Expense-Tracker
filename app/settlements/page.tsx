"use client";

import { useMemo } from "react";
import { ArrowRight, Info } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card } from "@/components/ui";
import { money } from "@/lib/format";

type Balance = { id: string; name: string; value: number };
type Transfer = { from: string; to: string; amount: number };

export default function SettlementsPage() {
  const { members, contributions, expenses, loading, trip } = useTrip();

  const result = useMemo(() => {
    const totalContributed = contributions.reduce((s, c) => s + Number(c.amount), 0);
    const fundSpent = expenses.filter((e) => e.payment_source === "trip_fund").reduce((s, e) => s + Number(e.amount), 0);
    const personalSpent = expenses.filter((e) => e.payment_source === "personal").reduce((s, e) => s + Number(e.amount), 0);
    const totalSpent = fundSpent + personalSpent;
    const remainingFund = totalContributed - fundSpent;
    const fairShare = members.length ? totalSpent / members.length : 0;

    const balances: Balance[] = members.map((m) => {
      const contribution = contributions.filter((c) => c.member_id === m.id).reduce((s, c) => s + Number(c.amount), 0);
      const personal = expenses.filter((e) => e.payment_source === "personal" && e.member_id === m.id).reduce((s, e) => s + Number(e.amount), 0);
      const refund = totalContributed > 0 ? remainingFund * (contribution / totalContributed) : 0;
      const effectivePaid = contribution - refund + personal;
      return { id: m.id, name: m.name, value: effectivePaid - fairShare };
    });

    const creditors = balances.filter((x) => x.value > 0.5).map((x) => ({ ...x })).sort((a,b) => b.value-a.value);
    const debtors = balances.filter((x) => x.value < -0.5).map((x) => ({ ...x, value: -x.value })).sort((a,b) => b.value-a.value);
    const transfers: Transfer[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].value, creditors[j].value);
      if (amount > 0.5) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
      debtors[i].value -= amount; creditors[j].value -= amount;
      if (debtors[i].value < 0.5) i++;
      if (creditors[j].value < 0.5) j++;
    }

    return { totalContributed, totalSpent, remainingFund, fairShare, balances, transfers };
  }, [members, contributions, expenses]);

  if (loading || !trip) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-900">Final settlement</h1><p className="mt-1 text-sm text-slate-500">A simple equal split of all trip expenses across all members.</p></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><p className="text-xs font-bold text-slate-400">COLLECTED</p><p className="mt-2 text-xl font-black">{money(result.totalContributed)}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">SPENT</p><p className="mt-2 text-xl font-black">{money(result.totalSpent)}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">FUND LEFT</p><p className="mt-2 text-xl font-black text-emerald-800">{money(result.remainingFund)}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">PER PERSON</p><p className="mt-2 text-xl font-black">{money(result.fairShare)}</p></Card>
      </div>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900"><div className="flex gap-3"><Info size={20} className="shrink-0" /><p>Any money still in the trip fund is treated as refundable to contributors in proportion to how much they contributed. Personal payments are then included before calculating the equal split.</p></div></div>

      <Card>
        <h2 className="mb-4 font-extrabold">Who should pay whom</h2>
        <div className="space-y-3">
          {result.transfers.map((t, idx) => <div key={idx} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4"><div className="flex min-w-0 items-center gap-2 font-semibold"><span className="truncate">{t.from}</span><ArrowRight size={17} className="shrink-0 text-slate-400" /><span className="truncate text-emerald-800">{t.to}</span></div><span className="shrink-0 font-black">{money(t.amount)}</span></div>)}
          {result.transfers.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Nothing to settle right now.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-extrabold">Member balance</h2>
        <div className="space-y-2">{result.balances.map((b) => <div key={b.id} className="flex justify-between rounded-2xl border border-slate-100 px-4 py-3"><span className="font-semibold">{b.name}</span><span className={`font-extrabold ${b.value >= 0 ? "text-emerald-700" : "text-red-600"}`}>{b.value >= 0 ? `gets ${money(b.value)}` : `owes ${money(Math.abs(b.value))}`}</span></div>)}</div>
      </Card>
    </div>
  );
}
