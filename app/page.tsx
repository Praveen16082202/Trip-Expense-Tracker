"use client";

import Link from "next/link";
import {
  Banknote,
  CircleCheck,
  CirclePlus,
  IndianRupee,
  ReceiptIndianRupee,
  Users,
  WalletCards,
} from "lucide-react";
import { useTrip } from "@/components/TripProvider";
import { Card, Stat } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default function HomePage() {
  const {
    trip,
    members,
    contributions,
    expenses,
    budgetCategories,
    loading,
  } = useTrip();

  if (loading || !trip) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading trip...
      </div>
    );
  }

  /*
   * BUDGET
   */
  const perPersonBudget =
    budgetCategories.reduce(
      (sum, category) =>
        sum +
        Number(
          category.amount_per_person
        ),
      0
    );

  const totalPlannedBudget =
    perPersonBudget * members.length;

  /*
   * CONTRIBUTIONS
   */
  const contributed =
    contributions.reduce(
      (sum, contribution) =>
        sum +
        Number(contribution.amount),
      0
    );

  const stillToCollect =
    Math.max(
      totalPlannedBudget -
        contributed,
      0
    );

  const collectionPercentage =
    totalPlannedBudget > 0
      ? Math.min(
          (contributed /
            totalPlannedBudget) *
            100,
          100
        )
      : 0;

  /*
   * EXPENSES
   */
  const fundSpent = expenses
    .filter(
      (expense) =>
        expense.payment_source ===
        "trip_fund"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount),
      0
    );

  const personalSpent = expenses
    .filter(
      (expense) =>
        expense.payment_source ===
        "personal"
    )
    .reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount),
      0
    );

  const totalSpent =
    fundSpent + personalSpent;

  const availableFund =
    contributed - fundSpent;

  /*
   * MEMBER HELPERS
   */
  const memberName = (
    id: string | null
  ) =>
    members.find(
      (member) => member.id === id
    )?.name || "Trip fund";

  const memberContribution = (
    memberId: string
  ) =>
    contributions
      .filter(
        (contribution) =>
          contribution.member_id ===
          memberId
      )
      .reduce(
        (sum, contribution) =>
          sum +
          Number(
            contribution.amount
          ),
        0
      );

  const fullyPaidMembers =
    perPersonBudget > 0
      ? members.filter(
          (member) =>
            memberContribution(
              member.id
            ) >= perPersonBudget
        ).length
      : 0;

  return (
    <div className="space-y-5">
      {/* AVAILABLE FUND */}

      <section className="overflow-hidden rounded-[2rem] bg-emerald-800 p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold text-emerald-100">
          Available trip fund
        </p>

        <div className="mt-2 text-4xl font-black md:text-5xl">
          {money(availableFund)}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-emerald-100">
              Collected
            </p>

            <p className="mt-1 text-lg font-extrabold">
              {money(contributed)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-emerald-100">
              Fund spent
            </p>

            <p className="mt-1 text-lg font-extrabold">
              {money(fundSpent)}
            </p>
          </div>
        </div>
      </section>

      {/* BUDGET SUMMARY */}

      {budgetCategories.length > 0 ? (
        <Card>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Trip budget
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {money(
                  perPersonBudget
                )}

                <span className="ml-1 text-sm font-semibold text-slate-500">
                  / person
                </span>
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {budgetCategories
                  .map(
                    (category) =>
                      category.category_name
                  )
                  .join(" + ")}
              </p>
            </div>

            <Link
              href="/budget"
              className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"
              aria-label="Open trip budget"
            >
              <WalletCards
                size={24}
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                Total planned
              </p>

              <p className="mt-1 font-black">
                {money(
                  totalPlannedBudget
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">
                Collected
              </p>

              <p className="mt-1 font-black text-emerald-800">
                {money(contributed)}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                Still to collect
              </p>

              <p className="mt-1 font-black text-amber-800">
                {money(
                  stillToCollect
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-3">
              <p className="text-xs text-sky-700">
                Fully paid
              </p>

              <p className="mt-1 font-black text-sky-800">
                {fullyPaidMembers}/
                {members.length}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
              <span>
                Collection progress
              </span>

              <span>
                {collectionPercentage.toFixed(
                  0
                )}
                %
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${collectionPercentage}%`,
                }}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-900">
                No trip budget set
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add your Package,
                Food, Travel and
                other planned costs.
              </p>
            </div>

            <Link
              href="/budget"
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
            >
              Set budget
            </Link>
          </div>
        </Card>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Members"
          value={String(
            members.length
          )}
          helper="People in this trip"
        />

        <Stat
          label="Total expenses"
          value={money(totalSpent)}
          helper="Fund + personal"
        />

        <Stat
          label="Personal paid"
          value={money(
            personalSpent
          )}
          helper="Out-of-pocket spends"
        />

        <Stat
          label="Transactions"
          value={String(
            contributions.length +
              expenses.length
          )}
          helper="All entries"
        />
      </div>

      {/* ACTIONS */}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/members#add-contribution"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-4 text-sm font-extrabold text-white shadow-sm"
        >
          <Banknote size={19} />
          Add money
        </Link>

        <Link
          href="/expenses#add-expense"
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-extrabold text-white shadow-sm"
        >
          <CirclePlus size={19} />
          Add expense
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* PAYMENT STATUS */}

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900">
                Payment status
              </h2>

              <p className="text-xs text-slate-500">
                {perPersonBudget >
                0
                  ? `${money(
                      perPersonBudget
                    )} per person`
                  : "Set a budget to track payments"}
              </p>
            </div>

            <Users
              size={20}
              className="text-emerald-700"
            />
          </div>

          <div className="space-y-3">
            {members.map(
              (member) => {
                const paid =
                  memberContribution(
                    member.id
                  );

                const remaining =
                  Math.max(
                    perPersonBudget -
                      paid,
                    0
                  );

                const extra =
                  Math.max(
                    paid -
                      perPersonBudget,
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
                  perPersonBudget >
                    0 &&
                  paid >=
                    perPersonBudget;

                return (
                  <div
                    key={member.id}
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">
                            {
                              member.name
                            }
                          </p>

                          {fullyPaid && (
                            <CircleCheck
                              size={
                                16
                              }
                              className="text-emerald-600"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {money(
                            paid
                          )}{" "}
                          paid
                        </p>
                      </div>

                      {perPersonBudget >
                      0 ? (
                        <div className="text-right">
                          {remaining >
                          0 ? (
                            <>
                              <p className="text-xs text-amber-700">
                                Still
                                to pay
                              </p>

                              <p className="font-black text-amber-800">
                                {money(
                                  remaining
                                )}
                              </p>
                            </>
                          ) : extra >
                            0 ? (
                            <>
                              <p className="text-xs text-emerald-700">
                                Extra
                                paid
                              </p>

                              <p className="font-black text-emerald-800">
                                {money(
                                  extra
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              Fully
                              paid
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {perPersonBudget >
                      0 && (
                      <>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                          <span>
                            {
                              percentage.toFixed(
                                0
                              )
                            }
                            %
                          </span>

                          <span>
                            Target{" "}
                            {money(
                              perPersonBudget
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              }
            )}

            {members.length ===
              0 && (
              <p className="text-sm text-slate-500">
                No members yet.
              </p>
            )}
          </div>
        </Card>

        {/* RECENT EXPENSES */}

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900">
                Recent expenses
              </h2>

              <p className="text-xs text-slate-500">
                Latest trip spending
              </p>
            </div>

            <ReceiptIndianRupee
              size={20}
              className="text-emerald-700"
            />
          </div>

          <div className="space-y-3">
            {expenses
              .slice(0, 6)
              .map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {
                        expense.description
                      }
                    </p>

                    <p className="text-xs text-slate-500">
                      {expense.category}
                      {" · "}
                      {shortDate(
                        expense.spent_at
                      )}
                      {" · "}
                      {expense.payment_source ===
                      "personal"
                        ? memberName(
                            expense.member_id
                          )
                        : "Trip fund"}
                    </p>
                  </div>

                  <span className="shrink-0 font-extrabold">
                    {money(
                      Number(
                        expense.amount
                      )
                    )}
                  </span>
                </div>
              ))}

            {expenses.length ===
              0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                <IndianRupee className="mx-auto mb-2" />
                No expenses recorded
                yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}