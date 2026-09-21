export type Trip = {
  id: string;
  name: string;
  trip_code: string;
  created_at: string;
};

export type Member = {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
};

export type Contribution = {
  id: string;
  trip_id: string;
  member_id: string;
  amount: number;
  note: string | null;
  contributed_at: string;
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  member_id: string | null;
  description: string;
  category: string;
  amount: number;
  payment_source: "trip_fund" | "personal";
  spent_at: string;
  note: string | null;
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  trip_id: string;
  category_name: string;
  amount_per_person: number;
  created_at: string;
};