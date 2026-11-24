// One colour per status, used everywhere a status is shown
export const STATUS_STYLES = {
  Pending: { badge: "bg-amber-100 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  Confirmed: { badge: "bg-sky-100 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  "In Progress": { badge: "bg-violet-100 text-violet-800 ring-violet-200", dot: "bg-violet-500" },
  Completed: { badge: "bg-emerald-100 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? { badge: "bg-stone-100 text-stone-700 ring-stone-200", dot: "bg-stone-400" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
