"use client";

import { useState } from "react";
import { ReceiptText, Trash2 } from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import {
  Card,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";

const categories = [
  "Food",
  "Stay",
  "Travel",
  "Fuel",
  "Tickets",
  "Shopping",
  "Emergency",
  "Other",
];

export default function ExpensesPage() {
  const { trip, members, expenses, refresh, loading } = useTrip();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"trip_fund" | "personal">(
    "trip_fund"
  );
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading || !trip) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  // Store the trip ID after TypeScript confirms trip is not null.
  // This prevents "trip is possibly null" errors inside async functions.
  const tripId = trip.id;

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();

    const value = Number(amount);

    if (
      !supabase ||
      !description.trim() ||
      value <= 0 ||
      (source === "personal" && !memberId)
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { error } = await supabase.from("expenses").insert({
      trip_id: tripId,
      member_id: source === "personal" ? memberId : null,
      description: description.trim(),
      category,
      amount: value,
      payment_source: source,
      spent_at: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setDescription("");
      setAmount("");
      setNote("");
      setMemberId("");

      await refresh();
    }

    setBusy(false);
  }

  async function remove(id: string) {
    if (!supabase || !confirm("Delete this expense?")) {
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await refresh();
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const fund = expenses
    .filter((expense) => expense.payment_source === "trip_fund")
    .reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

  const personal = total - fund;

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Expenses
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Record everything spent during the trip, whether it came
          from the common wallet or someone paid personally.
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs font-bold text-slate-400">
            TOTAL
          </p>

          <p className="mt-2 text-xl font-black">
            {money(total)}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-bold text-slate-400">
            FUND
          </p>

          <p className="mt-2 text-xl font-black text-emerald-800">
            {money(fund)}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-bold text-slate-400">
            PERSONAL
          </p>

          <p className="mt-2 text-xl font-black text-sky-800">
            {money(personal)}
          </p>
        </Card>
      </div>

      {/* ADD EXPENSE */}

      <div id="add-expense">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText
              size={20}
              className="text-emerald-700"
            />

            <h2 className="font-extrabold">
              Add expense
            </h2>
          </div>

          <form
            onSubmit={addExpense}
            className="grid gap-3 md:grid-cols-2"
          >
            {/* DESCRIPTION */}

            <input
              className={inputClass}
              placeholder="What was this for?"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            {/* AMOUNT */}

            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              placeholder="Amount ₹"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
            />

            {/* CATEGORY */}

            <select
              className={inputClass}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              {categories.map((categoryItem) => (
                <option key={categoryItem}>
                  {categoryItem}
                </option>
              ))}
            </select>

            {/* DATE */}

            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />

            {/* PAYMENT SOURCE */}

            <select
              className={inputClass}
              value={source}
              onChange={(e) => {
                const newSource = e.target.value as
                  | "trip_fund"
                  | "personal";

                setSource(newSource);

                if (newSource === "trip_fund") {
                  setMemberId("");
                }
              }}
            >
              <option value="trip_fund">
                Paid from trip fund
              </option>

              <option value="personal">
                Paid personally
              </option>
            </select>

            {/* PERSONAL PAYER */}

            {source === "personal" ? (
              <select
                className={inputClass}
                value={memberId}
                onChange={(e) =>
                  setMemberId(e.target.value)
                }
              >
                <option value="">
                  Who paid?
                </option>

                {members.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
              />
            )}

            {/* NOTE FOR PERSONAL PAYMENT */}

            {source === "personal" && (
              <input
                className={`${inputClass} md:col-span-2`}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
              />
            )}

            {/* ERROR */}

            {error && (
              <p className="text-sm font-semibold text-red-600 md:col-span-2">
                {error}
              </p>
            )}

            {/* SAVE BUTTON */}

            <button
              type="submit"
              className={`${buttonClass} md:col-span-2`}
              disabled={
                busy ||
                !description.trim() ||
                Number(amount) <= 0 ||
                (source === "personal" &&
                  !memberId)
              }
            >
              {busy
                ? "Saving..."
                : "Save expense"}
            </button>
          </form>
        </Card>
      </div>

      {/* EXPENSE HISTORY */}

      <Card>
        <h2 className="mb-4 font-extrabold">
          Expense history
        </h2>

        <div className="space-y-2">
          {expenses.map((expense) => {
            const payer =
              expense.payment_source === "personal"
                ? members.find(
                    (member) =>
                      member.id ===
                      expense.member_id
                  )?.name || "Member"
                : "Trip fund";

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {expense.description}
                  </p>

                  <p className="text-xs text-slate-500">
                    {expense.category}
                    {" · "}
                    {shortDate(
                      expense.spent_at
                    )}
                    {" · "}
                    {payer}

                    {expense.note
                      ? ` · ${expense.note}`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-extrabold">
                    {money(
                      Number(
                        expense.amount
                      )
                    )}
                  </span>

                  <button
                    type="button"
                    aria-label={`Delete ${expense.description}`}
                    className={`${secondaryButtonClass} !p-2 text-red-600`}
                    onClick={() =>
                      remove(expense.id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {expenses.length === 0 && (
            <p className="py-5 text-center text-sm text-slate-500">
              No expenses yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}