"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Trash2,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import {
  Card,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const {
    trip,
    members,
    contributions,
    budgetCategories,
    refresh,
    loading,
    leaveTrip,
  } = useTrip();

  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /*
   * CONTRIBUTION TOTAL FOR EACH MEMBER
   */
  const totals = useMemo(() => {
    const map = new Map<string, number>();

    contributions.forEach((contribution) => {
      map.set(
        contribution.member_id,
        (map.get(contribution.member_id) || 0) +
          Number(contribution.amount)
      );
    });

    return map;
  }, [contributions]);

  /*
   * TOTAL BUDGET PER PERSON
   *
   * Example:
   * Package 6000
   * Food    1500
   * Travel  1150
   *
   * Total = 8650
   *
   * Nothing is hardcoded here.
   */
  const perPersonBudget = useMemo(() => {
    return budgetCategories.reduce(
      (sum, category) =>
        sum + Number(category.amount_per_person),
      0
    );
  }, [budgetCategories]);

  /*
   * OVERALL COLLECTION DETAILS
   */
  const totalExpected =
    perPersonBudget * members.length;

  const totalCollected = contributions.reduce(
    (sum, contribution) =>
      sum + Number(contribution.amount),
    0
  );

  const totalStillToCollect = Math.max(
    totalExpected - totalCollected,
    0
  );

  const fullyPaidCount =
    perPersonBudget > 0
      ? members.filter(
          (member) =>
            (totals.get(member.id) || 0) >=
            perPersonBudget
        ).length
      : 0;

  if (loading || !trip) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  const tripId = trip.id;

  /*
   * ADD MEMBER
   */
  async function addMember(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !name.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    const { error } = await supabase
      .from("members")
      .insert({
        trip_id: tripId,
        name: name.trim(),
      });

    if (error) {
      setError(error.message);
    } else {
      setName("");
      await refresh();
    }

    setBusy(false);
  }

  /*
   * ADD CONTRIBUTION
   */
  async function addContribution(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value = Number(amount);

    if (
      !supabase ||
      !memberId ||
      value <= 0
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { error } = await supabase
      .from("contributions")
      .insert({
        trip_id: tripId,
        member_id: memberId,
        amount: value,
        note: note.trim() || null,
        contributed_at:
          new Date().toISOString(),
      });

    if (error) {
      setError(error.message);
    } else {
      setAmount("");
      setNote("");
      await refresh();
    }

    setBusy(false);
  }

  /*
   * DELETE CONTRIBUTION
   */
  async function deleteContribution(
    id: string
  ) {
    if (
      !supabase ||
      !confirm(
        "Delete this contribution?"
      )
    ) {
      return;
    }

    setError("");

    const { error } = await supabase
      .from("contributions")
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
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Members & contributions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add everyone travelling and track
            how much each person has paid
            towards the trip.
          </p>
        </div>

        <button
          type="button"
          onClick={leaveTrip}
          className={`${secondaryButtonClass} shrink-0`}
        >
          Leave trip
        </button>
      </div>

      {/* BUDGET SUMMARY */}

      {perPersonBudget > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Payment target
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {money(perPersonBudget)}
                <span className="ml-1 text-sm font-semibold text-slate-500">
                  / person
                </span>
              </p>
            </div>

            <WalletCards
              size={24}
              className="text-emerald-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                Total expected
              </p>

              <p className="mt-1 font-black text-slate-900">
                {money(totalExpected)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">
                Collected
              </p>

              <p className="mt-1 font-black text-emerald-800">
                {money(totalCollected)}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                Still to collect
              </p>

              <p className="mt-1 font-black text-amber-800">
                {money(totalStillToCollect)}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-xs text-sky-700">
                Fully paid
              </p>

              <p className="mt-1 font-black text-sky-800">
                {fullyPaidCount}/{members.length}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* MEMBER + CONTRIBUTION FORMS */}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ADD MEMBER */}

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <UserPlus
              size={20}
              className="text-emerald-700"
            />

            <h2 className="font-extrabold">
              Add member
            </h2>
          </div>

          <form
            onSubmit={addMember}
            className="flex gap-2"
          >
            <input
              className={inputClass}
              placeholder="Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <button
              type="submit"
              className={buttonClass}
              disabled={
                busy || !name.trim()
              }
            >
              {busy
                ? "Adding..."
                : "Add"}
            </button>
          </form>
        </Card>

        {/* ADD CONTRIBUTION */}

        <div id="add-contribution">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <WalletCards
                size={20}
                className="text-emerald-700"
              />

              <h2 className="font-extrabold">
                Add money to trip fund
              </h2>
            </div>

            <form
              onSubmit={addContribution}
              className="space-y-3"
            >
              <select
                className={inputClass}
                value={memberId}
                onChange={(e) =>
                  setMemberId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select member
                </option>

                {members.map(
                  (member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                    </option>
                  )
                )}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Amount ₹"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                />

                <input
                  className={inputClass}
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) =>
                    setNote(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                type="submit"
                className={`${buttonClass} w-full`}
                disabled={
                  busy ||
                  !memberId ||
                  Number(amount) <= 0
                }
              >
                {busy
                  ? "Saving..."
                  : "Add contribution"}
              </button>
            </form>
          </Card>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {/* CONTRIBUTION SUMMARY */}

      <Card>
        <div className="mb-4">
          <h2 className="font-extrabold">
            Contribution summary
          </h2>

          {perPersonBudget > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Target:{" "}
              {money(perPersonBudget)} per
              person
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const paid =
              totals.get(member.id) || 0;

            const remaining =
              Math.max(
                perPersonBudget - paid,
                0
              );

            const extra =
              Math.max(
                paid - perPersonBudget,
                0
              );

            const percentage =
              perPersonBudget > 0
                ? Math.min(
                    (paid /
                      perPersonBudget) *
                      100,
                    100
                  )
                : 0;

            const fullyPaid =
              perPersonBudget > 0 &&
              paid >= perPersonBudget;

            return (
              <div
                key={member.id}
                className="rounded-2xl bg-slate-50 p-4"
              >
                {/* NAME */}

                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-900">
                    {member.name}
                  </p>

                  {fullyPaid && (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600"
                    />
                  )}
                </div>

                {/* PAID */}

                <div className="mt-3">
                  <p className="text-xs text-slate-500">
                    Paid
                  </p>

                  <p className="text-xl font-black text-emerald-800">
                    {money(paid)}
                  </p>
                </div>

                {/* PAYMENT STATUS */}

                {perPersonBudget > 0 && (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Target{" "}
                        {money(
                          perPersonBudget
                        )}
                      </p>

                      {remaining > 0 ? (
                        <div className="text-right">
                          <p className="text-[11px] text-amber-700">
                            Still to pay
                          </p>

                          <p className="font-black text-amber-800">
                            {money(
                              remaining
                            )}
                          </p>
                        </div>
                      ) : extra > 0 ? (
                        <div className="text-right">
                          <p className="text-[11px] text-emerald-700">
                            Extra paid
                          </p>

                          <p className="font-black text-emerald-800">
                            {money(extra)}
                          </p>
                        </div>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          Fully paid
                        </span>
                      )}
                    </div>

                    {/* PROGRESS BAR */}

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {percentage.toFixed(
                          0
                        )}
                        % paid
                      </span>

                      {remaining > 0 && (
                        <span>
                          {money(
                            remaining
                          )}{" "}
                          left
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="text-sm text-slate-500">
              No members added yet.
            </p>
          )}
        </div>
      </Card>

      {/* CONTRIBUTION HISTORY */}

      <Card>
        <h2 className="mb-4 font-extrabold">
          Contribution history
        </h2>

        <div className="space-y-2">
          {contributions.map(
            (contribution) => {
              const member =
                members.find(
                  (member) =>
                    member.id ===
                    contribution.member_id
                );

              return (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {member?.name ||
                        "Member"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {shortDate(
                        contribution.contributed_at
                      )}

                      {contribution.note
                        ? ` · ${contribution.note}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-extrabold text-emerald-800">
                      +
                      {money(
                        Number(
                          contribution.amount
                        )
                      )}
                    </span>

                    <button
                      type="button"
                      className={`${secondaryButtonClass} !p-2 text-red-600`}
                      onClick={() =>
                        deleteContribution(
                          contribution.id
                        )
                      }
                      aria-label={`Delete ${
                        member?.name ||
                        "member"
                      } contribution`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            }
          )}

          {contributions.length === 0 && (
            <p className="py-5 text-center text-sm text-slate-500">
              No contributions yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}