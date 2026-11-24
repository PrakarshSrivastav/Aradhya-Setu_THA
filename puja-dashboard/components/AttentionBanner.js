import { ATTENTION_DAYS } from "@/lib/attention";

// Red banner when bookings are at risk; a calm green line when all is on track.
export default function AttentionBanner({ count, active, onToggle }) {
  if (count == null) return null;

  if (count === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span aria-hidden="true">✓</span>
        All bookings are on track — nothing needs attention.
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
          !
        </span>
        <div className="text-sm">
          <p className="font-semibold text-rose-900">
            {count} booking{count === 1 ? " needs" : "s need"} attention
          </p>
          <p className="text-rose-700">
            Not confirmed with the puja {ATTENTION_DAYS} days away or less, or past the puja date without being completed.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
          active ? "border border-rose-300 bg-white text-rose-700 hover:bg-rose-100" : "bg-rose-600 text-white hover:bg-rose-700"
        }`}
      >
        {active ? "Show all bookings" : "Show them"}
      </button>
    </div>
  );
}
