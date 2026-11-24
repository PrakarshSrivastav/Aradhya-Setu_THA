import StatusBadge from "./StatusBadge";
import { formatDate, formatINR, relativeDay } from "@/lib/format";

// Column headers that can be clicked to sort
function SortHeader({ label, field, sort, onSort, align = "left" }) {
  const active = sort.field === field;
  const arrow = active ? (sort.order === "asc" ? "↑" : "↓") : "↕";
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-stone-900 ${active ? "text-stone-900" : ""}`}
      >
        {label}
        <span className={active ? "text-orange-600" : "text-stone-300"}>{arrow}</span>
      </button>
    </th>
  );
}

function DateCell({ value }) {
  const rel = relativeDay(value);
  const soon = rel === "Today" || rel === "Tomorrow";
  return (
    <div>
      <div className="text-stone-800">{formatDate(value)}</div>
      <div className={`text-xs ${soon ? "font-medium text-orange-600" : "text-stone-400"}`}>{rel}</div>
    </div>
  );
}

export default function BookingsTable({ bookings, sort, onSort, onOpen }) {
  return (
    <>
      {/* Desktop / tablet: a real table */}
      <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <SortHeader label="Booking ID" field="bookingId" sort={sort} onSort={onSort} />
              <th scope="col" className="px-4 py-3 text-left font-medium">Devotee</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Puja</th>
              <SortHeader label="Puja date" field="pujaDate" sort={sort} onSort={onSort} />
              <SortHeader label="Amount" field="amount" sort={sort} onSort={onSort} align="right" />
              <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
              <th scope="col" className="w-10 px-4 py-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bookings.map((b) => (
              <tr
                key={b.bookingId}
                onClick={() => onOpen(b.bookingId)}
                className="cursor-pointer transition hover:bg-orange-50/60"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(b.bookingId);
                    }}
                    className="font-mono font-medium text-orange-700 hover:underline"
                  >
                    {b.bookingId}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-stone-900">{b.devotee.name}</div>
                  <div className="text-xs text-stone-400">{b.devotee.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-stone-800">{b.puja}</div>
                  <div className="text-xs text-stone-400">{b.temple}</div>
                </td>
                <td className="px-4 py-3"><DateCell value={b.pujaDate} /></td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-stone-900">{formatINR(b.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3 text-stone-300">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per booking */}
      <ul className="space-y-3 md:hidden">
        {bookings.map((b) => (
          <li key={b.bookingId}>
            <button
              type="button"
              onClick={() => onOpen(b.bookingId)}
              className="w-full rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm active:bg-orange-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium text-orange-700">{b.bookingId}</div>
                  <div className="truncate font-medium text-stone-900">{b.devotee.name}</div>
                  <div className="truncate text-sm text-stone-500">{b.puja}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-stone-100 pt-3 text-sm">
                <DateCell value={b.pujaDate} />
                <div className="font-semibold tabular-nums text-stone-900">{formatINR(b.amount)}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
