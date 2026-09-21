"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { clearStoredTrip, getStoredTripId, setStoredTripId } from "@/lib/trip";
import type { Contribution, Expense, Member, Trip } from "@/lib/types";

type TripContextValue = {
  trip: Trip | null;
  members: Member[];
  contributions: Contribution[];
  expenses: Expense[];
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  createTrip: (name: string, creatorName: string) => Promise<string>;
  joinTrip: (code: string) => Promise<string>;
  leaveTrip: () => void;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const tripId = getStoredTripId();
    if (!tripId) {
      setTrip(null);
      setMembers([]);
      setContributions([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [{ data: tripData }, { data: memberData }, { data: contributionData }, { data: expenseData }] = await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).maybeSingle(),
      supabase.from("members").select("*").eq("trip_id", tripId).order("created_at"),
      supabase.from("contributions").select("*").eq("trip_id", tripId).order("contributed_at", { ascending: false }),
      supabase.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
    ]);

    if (!tripData) {
      clearStoredTrip();
      setTrip(null);
    } else {
      setTrip(tripData as Trip);
      setMembers((memberData || []) as Member[]);
      setContributions((contributionData || []) as Contribution[]);
      setExpenses((expenseData || []) as Expense[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    if (!trip && pathname !== "/setup") router.replace("/setup");
    if (trip && pathname === "/setup") router.replace("/");
  }, [trip, loading, pathname, router]);

  useEffect(() => {
    if (!supabase || !trip?.id) return;
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `trip_id=eq.${trip.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "contributions", filter: `trip_id=eq.${trip.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${trip.id}` }, refresh)
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [trip?.id, refresh]);

  async function createTrip(name: string, creatorName: string) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const tripCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: created, error } = await supabase
      .from("trips")
      .insert({ name: name.trim(), trip_code: tripCode })
      .select("*")
      .single();
    if (error) throw error;

    const { error: memberError } = await supabase.from("members").insert({
      trip_id: created.id,
      name: creatorName.trim(),
    });
    if (memberError) throw memberError;

    setStoredTripId(created.id);
    await refresh();
    return tripCode;
  }

  async function joinTrip(code: string) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("trip_code", code.trim().toUpperCase())
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Trip code not found.");
    setStoredTripId(data.id);
    await refresh();
    return data.id;
  }

  function leaveTrip() {
    clearStoredTrip();
    setTrip(null);
    router.replace("/setup");
  }

  const value = useMemo(() => ({
    trip, members, contributions, expenses, loading,
    configured: isSupabaseConfigured,
    refresh, createTrip, joinTrip, leaveTrip,
  }), [trip, members, contributions, expenses, loading, refresh]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const value = useContext(TripContext);
  if (!value) throw new Error("useTrip must be used inside TripProvider");
  return value;
}
