"use client";

import { useMemo, useState } from "react";
import { Trash2, UserPlus, WalletCards } from "lucide-react";
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

  if (loading || !trip) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  // Keep the trip ID in a non-null variable.
  // This avoids TypeScript null errors inside async functions.
  const tripId = trip.id;

  async function addMember(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !name.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    const { error } = await supabase.from("members").insert({
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

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();

    const value = Number(amount);

    if (!supabase || !memberId || value <= 0) {
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
        contributed_at: new Date().toISOString(),
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

  async function deleteContribution(id: string) {
    if (
      !supabase ||
      !confirm("Delete this contribution?")
    ) {
      return;
    }

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
            Add everyone travelling and record each amount
            they put into the common trip wallet.
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
              disabled={busy || !name.trim()}
            >
              {busy ? "Adding..." : "Add"}
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
                  setMemberId(e.target.value)
                }
              >
                <option value="">
                  Select member
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

              <div className="grid grid-cols-2 gap-3">
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

                <input
                  className={inputClass}
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
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
        <h2 className="mb-4 font-extrabold">
          Contribution summary
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl bg-slate-50 p-4"
            >
              <p className="font-bold">
                {member.name}
              </p>

              <p className="mt-2 text-2xl font-black text-emerald-800">
                {money(
                  totals.get(member.id) || 0
                )}
              </p>
            </div>
          ))}

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
              const member = members.find(
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
                      aria-label={`Delete ${member?.name || "member"} contribution`}
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