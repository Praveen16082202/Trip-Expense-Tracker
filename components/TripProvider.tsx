"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  clearStoredTrip,
  getStoredTripId,
  setStoredTripId,
} from "@/lib/trip";
import type {
  BudgetCategory,
  Contribution,
  Expense,
  Member,
  Trip,
} from "@/lib/types";

type TripContextValue = {
  trip: Trip | null;
  members: Member[];
  contributions: Contribution[];
  expenses: Expense[];
  budgetCategories: BudgetCategory[];
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  createTrip: (
    name: string,
    creatorName: string
  ) => Promise<string>;
  joinTrip: (code: string) => Promise<string>;
  leaveTrip: () => void;
};

const TripContext =
  createContext<TripContextValue | null>(null);

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<
    Contribution[]
  >([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<
    BudgetCategory[]
  >([]);
  const [loading, setLoading] = useState(true);

  /*
   * REFRESH TRIP DATA
   */
  const refresh = useCallback(async () => {
    const client = supabase;

    if (!client) {
      setLoading(false);
      return;
    }

    const tripId = getStoredTripId();

    if (!tripId) {
      setTrip(null);
      setMembers([]);
      setContributions([]);
      setExpenses([]);
      setBudgetCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        { data: tripData, error: tripError },
        { data: memberData, error: memberError },
        {
          data: contributionData,
          error: contributionError,
        },
        { data: expenseData, error: expenseError },
        { data: budgetData, error: budgetError },
      ] = await Promise.all([
        client
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .maybeSingle(),

        client
          .from("members")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at"),

        client
          .from("contributions")
          .select("*")
          .eq("trip_id", tripId)
          .order("contributed_at", {
            ascending: false,
          }),

        client
          .from("expenses")
          .select("*")
          .eq("trip_id", tripId)
          .order("spent_at", {
            ascending: false,
          }),

        client
          .from("budget_categories")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at"),
      ]);

      if (
        tripError ||
        memberError ||
        contributionError ||
        expenseError ||
        budgetError
      ) {
        console.error("Failed to refresh trip data:", {
          tripError,
          memberError,
          contributionError,
          expenseError,
          budgetError,
        });
      }

      if (!tripData) {
        clearStoredTrip();

        setTrip(null);
        setMembers([]);
        setContributions([]);
        setExpenses([]);
        setBudgetCategories([]);

        return;
      }

      setTrip(tripData as Trip);
      setMembers((memberData || []) as Member[]);
      setContributions(
        (contributionData || []) as Contribution[]
      );
      setExpenses((expenseData || []) as Expense[]);
      setBudgetCategories(
        (budgetData || []) as BudgetCategory[]
      );
    } catch (error) {
      console.error(
        "Unexpected error while refreshing trip:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * INITIAL LOAD
   */
  useEffect(() => {
    void refresh();
  }, [refresh]);

  /*
   * ROUTE HANDLING
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!trip && pathname !== "/setup") {
      router.replace("/setup");
      return;
    }

    if (trip && pathname === "/setup") {
      router.replace("/");
    }
  }, [trip, loading, pathname, router]);

  /*
   * SUPABASE REALTIME
   */
  useEffect(() => {
    const client = supabase;
    const tripId = trip?.id;

    if (!client || !tripId) {
      return;
    }

    const channel = client
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_categories",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [trip?.id, refresh]);

  /*
   * CREATE NEW TRIP
   */
  async function createTrip(
    name: string,
    creatorName: string
  ) {
    const client = supabase;

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const cleanTripName = name.trim();
    const cleanCreatorName = creatorName.trim();

    if (!cleanTripName) {
      throw new Error("Trip name is required.");
    }

    if (!cleanCreatorName) {
      throw new Error("Your name is required.");
    }

    const tripCode = Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

    const { data: created, error } = await client
      .from("trips")
      .insert({
        name: cleanTripName,
        trip_code: tripCode,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (!created) {
      throw new Error("Trip could not be created.");
    }

    const { error: memberError } = await client
      .from("members")
      .insert({
        trip_id: created.id,
        name: cleanCreatorName,
      });

    if (memberError) {
      throw memberError;
    }

    setStoredTripId(created.id);

    await refresh();

    return tripCode;
  }

  /*
   * JOIN EXISTING TRIP
   */
  async function joinTrip(code: string) {
    const client = supabase;

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      throw new Error("Enter a trip code.");
    }

    const { data, error } = await client
      .from("trips")
      .select("*")
      .eq("trip_code", cleanCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Trip code not found.");
    }

    setStoredTripId(data.id);

    await refresh();

    return data.id;
  }

  /*
   * LEAVE TRIP
   */
  function leaveTrip() {
    clearStoredTrip();

    setTrip(null);
    setMembers([]);
    setContributions([]);
    setExpenses([]);
    setBudgetCategories([]);

    router.replace("/setup");
  }

  /*
   * CONTEXT VALUE
   */
  const value = useMemo<TripContextValue>(
    () => ({
      trip,
      members,
      contributions,
      expenses,
      budgetCategories,
      loading,
      configured: isSupabaseConfigured,
      refresh,
      createTrip,
      joinTrip,
      leaveTrip,
    }),
    [
      trip,
      members,
      contributions,
      expenses,
      budgetCategories,
      loading,
      refresh,
    ]
  );

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const value = useContext(TripContext);

  if (!value) {
    throw new Error(
      "useTrip must be used inside TripProvider"
    );
  }

  return value;
}