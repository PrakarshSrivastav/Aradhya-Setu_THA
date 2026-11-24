import { PUJAS, STATUSES } from "@/lib/constants";

const SORT_OPTIONS = [
  { label: "Newest bookings first", field: "createdAt", order: "desc" },
  { label: "Puja date: soonest first", field: "pujaDate", order: "asc" },
  { label: "Puja date: latest first", field: "pujaDate", order: "desc" },
  { label: "Amount: high to low", field: "amount", order: "desc" },
  { label: "Amount: low to high", field: "amount", order: "asc" },
  { label: "Booking ID", field: "bookingId", order: "asc" },
];

const selectClass =
  "h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200";

export default function Toolbar({ search, onSearch, status, onStatus, puja, onPuja, sort, onSort, onClear, hasFilters }) {
  const sortKey = `${sort.field}:${sort.order}`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by booking ID, devotee or puja…"
          aria-label="Search bookings"
          className={`${selectClass} w-full pl-9`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <select value={status} onChange={(e) => onStatus(e.target.value)} aria-label="Filter by status" className={selectClass}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select value={puja} onChange={(e) => onPuja(e.target.value)} aria-label="Filter by puja" className={selectClass}>
          <option value="">All pujas</option>
          {PUJAS.map((p) => (
            <option key={p.name}>{p.name}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => {
            const [field, order] = e.target.value.split(":");
            onSort({ field, order });
          }}
          aria-label="Sort bookings"
          className={`${selectClass} col-span-2`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={`${o.field}:${o.order}`} value={`${o.field}:${o.order}`}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="col-span-2 h-10 rounded-lg px-3 text-sm font-medium text-orange-700 hover:bg-orange-50"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
