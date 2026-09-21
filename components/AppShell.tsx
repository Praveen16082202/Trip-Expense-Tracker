"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HandCoins,
  House,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import { useTrip } from "./TripProvider";

const nav = [
  { href: "/", label: "Home", icon: House },
  { href: "/budget", label: "Budget", icon: WalletCards },
  { href: "/members", label: "Members", icon: Users },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/settlements", label: "Settle", icon: HandCoins },
];

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { trip } = useTrip();

  const setup = pathname === "/setup";

  if (setup) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b border-emerald-950/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="rounded-2xl bg-emerald-700 p-2 text-white">
              <WalletCards size={20} />
            </div>

            <div>
              <p className="text-sm font-bold text-emerald-950">
                {trip?.name || "Kerala Trip"}
              </p>

              <p className="text-xs text-slate-500">
                Group expense tracker
              </p>
            </div>
          </Link>

          {trip && (
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-800">
              CODE {trip.trip_code}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-5 md:px-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-24 space-y-2">
            {nav.map((item) => {
              const active =
                pathname === item.href;

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-2 py-2 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href;

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${
                  active
                    ? "text-emerald-700"
                    : "text-slate-500"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={
                    active ? 2.6 : 2
                  }
                />

                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}