"use client";

import { useState } from "react";
import {
  CirclePlus,
  IndianRupee,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import {
  Card,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { money } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export default function BudgetPage() {
  const {
    trip,
    members,
    budgetCategories,
    refresh,
    loading,
  } = useTrip();

  const [categoryName, setCategoryName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  if (loading || !trip) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading budget...
      </div>
    );
  }

  const tripId = trip.id;

  const perPersonBudget =
    budgetCategories.reduce(
      (sum, category) =>
        sum +
        Number(category.amount_per_person),
      0
    );

  const totalTripBudget =
    perPersonBudget * members.length;

  async function addCategory(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value = Number(amount);

    if (
      !supabase ||
      !categoryName.trim() ||
      value <= 0
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { error } = await supabase
      .from("budget_categories")
      .insert({
        trip_id: tripId,
        category_name:
          categoryName.trim(),
        amount_per_person: value,
      });

    if (error) {
      setError(error.message);
    } else {
      setCategoryName("");
      setAmount("");
      await refresh();
    }

    setBusy(false);
  }

  async function deleteCategory(
    id: string
  ) {
    if (
      !supabase ||
      !confirm(
        "Delete this budget category?"
      )
    ) {
      return;
    }

    setError("");

    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Trip Budget
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Set the planned cost per
          person. Your total trip
          budget is calculated
          automatically.
        </p>
      </div>

      {/* SUMMARY */}

      <section className="overflow-hidden rounded-[2rem] bg-emerald-800 p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold text-emerald-100">
          Budget per person
        </p>

        <div className="mt-2 text-4xl font-black md:text-5xl">
          {money(perPersonBudget)}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-emerald-100">
              Members
            </p>

            <p className="mt-1 text-lg font-extrabold">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-emerald-100">
              Total trip budget
            </p>

            <p className="mt-1 text-lg font-extrabold">
              {money(totalTripBudget)}
            </p>
          </div>
        </div>
      </section>

      {/* ADD CATEGORY */}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CirclePlus
            size={20}
            className="text-emerald-700"
          />

          <h2 className="font-extrabold">
            Add budget category
          </h2>
        </div>

        <form
          onSubmit={addCategory}
          className="space-y-3"
        >
          <input
            className={inputClass}
            placeholder="Category e.g. Package"
            value={categoryName}
            onChange={(e) =>
              setCategoryName(
                e.target.value
              )
            }
          />

          <div className="relative">
            <IndianRupee
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className={`${inputClass} pl-9`}
              type="number"
              min="1"
              step="1"
              placeholder="Amount per person"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`${buttonClass} w-full`}
            disabled={
              busy ||
              !categoryName.trim() ||
              Number(amount) <= 0
            }
          >
            {busy
              ? "Saving..."
              : "Add category"}
          </button>
        </form>
      </Card>

      {/* CATEGORY BREAKDOWN */}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold">
              Budget breakdown
            </h2>

            <p className="text-xs text-slate-500">
              Amount per person
            </p>
          </div>

          <WalletCards
            size={21}
            className="text-emerald-700"
          />
        </div>

        <div className="space-y-2">
          {budgetCategories.map(
            (category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {
                      category.category_name
                    }
                  </p>

                  <p className="text-xs text-slate-500">
                    Per person
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-800">
                    {money(
                      Number(
                        category.amount_per_person
                      )
                    )}
                  </span>

                  <button
                    type="button"
                    className={`${secondaryButtonClass} !p-2 text-red-600`}
                    onClick={() =>
                      deleteCategory(
                        category.id
                      )
                    }
                    aria-label={`Delete ${category.category_name}`}
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )
          )}

          {budgetCategories.length ===
            0 && (
            <div className="py-8 text-center">
              <WalletCards className="mx-auto mb-2 text-slate-300" />

              <p className="text-sm font-semibold text-slate-600">
                No budget set yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Add Package, Food,
                Travel or any other
                category.
              </p>
            </div>
          )}
        </div>

        {budgetCategories.length >
          0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  Total per person
                </p>

                <p className="text-xs text-slate-500">
                  All categories
                  combined
                </p>
              </div>

              <p className="text-xl font-black text-emerald-800">
                {money(
                  perPersonBudget
                )}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
              <div>
                <p className="font-bold text-emerald-900">
                  Total trip budget
                </p>

                <p className="text-xs text-emerald-700">
                  {money(
                    perPersonBudget
                  )}{" "}
                  × {members.length}{" "}
                  members
                </p>
              </div>

              <p className="text-xl font-black text-emerald-900">
                {money(
                  totalTripBudget
                )}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}