# Kerala Trip Expense Tracker

A mobile-friendly shared trip wallet built with **Next.js 16 + React + Tailwind CSS + Supabase**.

## Features

- Create a trip and automatically receive a 6-character trip code
- Friends can join the same trip from their phones using the code
- Add/remove trip members
- Record multiple contributions from each member
- Common trip-fund balance
- Add expenses by category
- Mark an expense as paid from the common trip fund or personally by a member
- Realtime sync between devices using Supabase
- Dashboard with collected, spent, personal spend, fund remaining and recent expenses
- Equal-split final settlement calculation
- Leftover fund is accounted for proportionally to contributors before final settlement
- Responsive bottom navigation for phones

## 1. Install

```bash
npm install
```

## 2. Create a Supabase project

Create a free Supabase project. In Supabase, open **SQL Editor**, create a new query, paste everything from:

```text
supabase/schema.sql
```

and run it once.

## 3. Add environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

You can find both values in your Supabase project settings / API settings.

## 4. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Choose **Create trip**, enter the trip name and your name. The app creates a trip code. Friends can open the deployed app and use **Join trip** with that code.

## 5. Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Vercel Environment Variables.
4. Deploy.
5. Share the Vercel URL and trip code with everyone.

## How the money logic works

### Common fund

If Praveen contributes ₹5,000 and another member contributes ₹5,000, total collected is ₹10,000.

If a ₹2,000 hotel expense is marked **Paid from trip fund**, the displayed common-fund balance becomes ₹8,000.

### Personal payment

If a member personally pays ₹1,500 for petrol, it does **not** reduce the common wallet because that money came from their own pocket. It is still included in total trip spending and in the final settlement.

### Settlement

The app:

1. Totals all trip expenses.
2. Splits that total equally across all members.
3. Calculates how much each member effectively paid.
4. Treats any remaining common-fund cash as a refund to contributors in proportion to their contribution.
5. Produces simplified “A pays B” settlement instructions.

## Important security note

This version is intentionally simple for a trusted group of friends. Its Supabase RLS policies allow anonymous browser access, and the trip code is used for convenience rather than strong authentication. Do not store bank details, passwords, IDs, or other sensitive information in it.

For a future version, add Supabase Auth and membership-based RLS if you want private accounts and stronger access control.
