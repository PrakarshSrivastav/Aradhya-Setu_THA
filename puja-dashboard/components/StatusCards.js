import { STATUSES } from "@/lib/constants";
import { STATUS_STYLES } from "./StatusBadge";

// Summary counts at the top. Clicking a card filters the table to that status.
export default function StatusCards({ counts, active, onSelect }) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;
  const cards = [{ label: "All bookings", value: "", count: total }].concat(
    STATUSES.map((s) => ({ label: s, value: s, count: counts?.[s] ?? null }))
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const isActive = active === card.value;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelect(card.value)}
            aria-pressed={isActive}
            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:shadow ${
              isActive ? "border-orange-500 ring-2 ring-orange-200" : "border-stone-200"
            } ${card.value === "" ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="flex items-center gap-2 text-sm text-stone-500">
              {card.value && <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[card.value].dot}`} />}
              {card.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
              {card.count ?? "–"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
