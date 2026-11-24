import RunSheet from "@/components/RunSheet";
import { toISODate } from "@/lib/format";

export const metadata = { title: "Puja Run-Sheet — Aaradhya Setu" };

// /run-sheet?date=2026-11-25  (defaults to today)
export default async function RunSheetPage({ searchParams }) {
  const { date } = await searchParams;
  const valid = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return <RunSheet date={valid ? date : toISODate(new Date())} />;
}
