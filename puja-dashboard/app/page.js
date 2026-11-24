"use client";

import { useCallback, useEffect, useState } from "react";
import StatusCards from "@/components/StatusCards";
import Toolbar from "@/components/Toolbar";
import BookingsTable from "@/components/BookingsTable";
import BookingDrawer from "@/components/BookingDrawer";

// Default sort direction when a column header is clicked for the first time
const DEFAULT_ORDER = { createdAt: "desc", amount: "desc", pujaDate: "asc", bookingId: "asc" };

export default function Dashboard() {
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [puja, setPuja] = useState("");
  const [sort, setSort] = useState({ field: "createdAt", order: "desc" });

  // Data from the API. We remember which query each result belongs to,
  // so "loading" is simply: the latest result isn't for the current query yet.
  const [result, setResult] = useState(null); // { query, bookings, statusCounts }
  const [error, setError] = useState(null); // { query, message }
  const [refreshCount, setRefreshCount] = useState(0);

  const [selectedId, setSelectedId] = useState(null);

  // Wait until the admin stops typing for 300ms before searching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ sort: sort.field, order: sort.order });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (status) params.set("status", status);
  if (puja) params.set("puja", puja);
  const query = params.toString();

  useEffect(() => {
    const controller = new AbortController(); // cancel stale requests when filters change fast
    fetch(`/api/bookings?${query}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Server error (${r.status})`))))
      .then((data) => {
        setResult({ query, ...data });
        setError(null);
      })
      .catch((e) => e.name !== "AbortError" && setError({ query, message: e.message }));
    return () => controller.abort();
  }, [query, refreshCount]);

  const loading = result?.query !== query && error?.query !== query;
  const bookings = result?.bookings ?? [];

  function handleHeaderSort(field) {
    setSort((s) =>
      s.field === field
        ? { field, order: s.order === "asc" ? "desc" : "asc" }
        : { field, order: DEFAULT_ORDER[field] }
    );
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPuja("");
  }

  // After a status change: update the row right away, then refetch so the
  // counts (and the list, if it's filtered by status) are correct.
  const handleUpdated = useCallback((updated) => {
    setResult((r) =>
      r && { ...r, bookings: r.bookings.map((b) => (b.bookingId === updated.bookingId ? updated : b)) }
    );
    setRefreshCount((n) => n + 1);
  }, []);

  const closeDrawer = useCallback(() => setSelectedId(null), []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-amber-500 text-lg text-white shadow-sm">
              ॐ
            </div>
            <div>
              <div className="font-semibold leading-tight text-stone-900">Aaradhya Setu</div>
              <div className="text-xs text-stone-500">Puja Bookings · Admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRefreshCount((n) => n + 1)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Bookings</h1>
          <p className="text-sm text-stone-500">Search, filter and update the status of puja bookings.</p>
        </div>

        <StatusCards counts={result?.statusCounts} active={status} onSelect={setStatus} />

        <Toolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          puja={puja}
          onPuja={setPuja}
          sort={sort}
          onSort={setSort}
          onClear={clearFilters}
        />

        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            {result ? `${bookings.length} booking${bookings.length === 1 ? "" : "s"}` : " "}
          </span>
          {loading && <span className="text-orange-600">Loading…</span>}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load bookings: {error.message}.{" "}
            <button type="button" className="font-medium underline" onClick={() => setRefreshCount((n) => n + 1)}>
              Try again
            </button>
          </div>
        )}

        {result && bookings.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="font-medium text-stone-800">No bookings match these filters.</p>
            <button type="button" onClick={clearFilters} className="mt-2 text-sm font-medium text-orange-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {bookings.length > 0 && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <BookingsTable bookings={bookings} sort={sort} onSort={handleHeaderSort} onOpen={setSelectedId} />
          </div>
        )}
      </main>

      {selectedId && (
        <BookingDrawer key={selectedId} bookingId={selectedId} onClose={closeDrawer} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
