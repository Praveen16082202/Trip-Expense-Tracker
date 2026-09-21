"use client";

import Link from "next/link";
import { Banknote, CirclePlus, IndianRupee, ReceiptIndianRupee, Users } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card, Stat } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default function HomePage() {
  const { trip, members, contributions, expenses, loading } = useTrip();
  if (loading || !trip) return <div className="p-10 text-center text-slate-500">Loading trip...</div>;

  const contributed = contributions.reduce((sum, x) => sum + Number(x.amount), 0);
  const fundSpent = expenses.filter((x) => x.payment_source === "trip_fund").reduce((sum, x) => sum + Number(x.amount), 0);
  const personalSpent = expenses.filter((x) => x.payment_source === "personal").reduce((sum, x) => sum + Number(x.amount), 0);
  const totalSpent = fundSpent + personalSpent;
  const remaining = contributed - fundSpent;
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name || "Trip fund";

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-emerald-800 p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold text-emerald-100">Available trip fund</p>
        <div className="mt-2 text-4xl font-black md:text-5xl">{money(remaining)}</div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-emerald-100">Collected</p><p className="mt-1 text-lg font-extrabold">{money(contributed)}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-emerald-100">Fund spent</p><p className="mt-1 text-lg font-extrabold">{money(fundSpent)}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Members" value={String(members.length)} helper="People in this trip" />
        <Stat label="Total expenses" value={money(totalSpent)} helper="Fund + personal" />
        <Stat label="Personal paid" value={money(personalSpent)} helper="Out-of-pocket spends" />
        <Stat label="Transactions" value={String(contributions.length + expenses.length)} helper="All entries" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/members#add-contribution" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-4 text-sm font-extrabold text-white shadow-sm"><Banknote size={19} /> Add money</Link>
        <Link href="/expenses#add-expense" className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-extrabold text-white shadow-sm"><CirclePlus size={19} /> Add expense</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Members</h2><p className="text-xs text-slate-500">Contribution totals</p></div><Users size={20} className="text-emerald-700" /></div>
          <div className="space-y-3">
            {members.map((member) => {
              const total = contributions.filter((x) => x.member_id === member.id).reduce((sum, x) => sum + Number(x.amount), 0);
              return <div key={member.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold">{member.name}</span><span className="font-extrabold text-emerald-800">{money(total)}</span></div>;
            })}
            {members.length === 0 && <p className="text-sm text-slate-500">No members yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Recent expenses</h2><p className="text-xs text-slate-500">Latest trip spending</p></div><ReceiptIndianRupee size={20} className="text-emerald-700" /></div>
          <div className="space-y-3">
            {expenses.slice(0, 6).map((expense) => <div key={expense.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"><div className="min-w-0"><p className="truncate font-semibold">{expense.description}</p><p className="text-xs text-slate-500">{expense.category} · {shortDate(expense.spent_at)} · {expense.payment_source === "personal" ? memberName(expense.member_id) : "Trip fund"}</p></div><span className="shrink-0 font-extrabold">{money(Number(expense.amount))}</span></div>)}
            {expenses.length === 0 && <div className="py-6 text-center text-sm text-slate-500"><IndianRupee className="mx-auto mb-2" />No expenses recorded yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
