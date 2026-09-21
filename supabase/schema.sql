-- Kerala Trip Expense Tracker
-- Run this entire file in Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trip_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  contributed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  description text not null,
  category text not null default 'Other',
  amount numeric(12,2) not null check (amount > 0),
  payment_source text not null check (payment_source in ('trip_fund', 'personal')),
  spent_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  constraint personal_payment_requires_member check (
    (payment_source = 'trip_fund' and member_id is null)
    or (payment_source = 'personal' and member_id is not null)
  )
);

create index if not exists members_trip_id_idx on public.members(trip_id);
create index if not exists contributions_trip_id_idx on public.contributions(trip_id);
create index if not exists expenses_trip_id_idx on public.expenses(trip_id);

alter table public.trips enable row level security;
alter table public.members enable row level security;
alter table public.contributions enable row level security;
alter table public.expenses enable row level security;

-- Trusted-group version: allows the browser app to read/write using the anon key.
-- Do not store sensitive/private information in this project.
drop policy if exists "public trips access" on public.trips;
create policy "public trips access" on public.trips for all to anon, authenticated using (true) with check (true);

drop policy if exists "public members access" on public.members;
create policy "public members access" on public.members for all to anon, authenticated using (true) with check (true);

drop policy if exists "public contributions access" on public.contributions;
create policy "public contributions access" on public.contributions for all to anon, authenticated using (true) with check (true);

drop policy if exists "public expenses access" on public.expenses;
create policy "public expenses access" on public.expenses for all to anon, authenticated using (true) with check (true);

-- Enable realtime updates if the tables are not already included.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members') then
    execute 'alter publication supabase_realtime add table public.members';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contributions') then
    execute 'alter publication supabase_realtime add table public.contributions';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses') then
    execute 'alter publication supabase_realtime add table public.expenses';
  end if;
end $$;
