import type { Metadata } from "next";
import "./globals.css";
import { TripProvider } from "@/components/TripProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Kerala Trip Expense Tracker",
  description: "Shared group trip contributions and expense tracker",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TripProvider>
          <AppShell>{children}</AppShell>
        </TripProvider>
      </body>
    </html>
  );
}
