"use client";

// The day's to-do list for pandits: every puja on one date, grouped by temple,
// with exactly what the pandit needs to perform it (names, gotra, sankalp,
// offerings). Can be printed or sent as WhatsApp text.
// Devotee phone/email are deliberately left out — the pandit doesn't need them.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import { formatLongDate, shiftISODate, toISODate } from "@/lib/format";

function groupByTemple(bookings) {
  const groups = new Map();
  for (const b of bookings) {
    const key = b.temple || "Temple not set";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const forLine = (b) =>
  (b.beneficiaries?.length ? b.beneficiaries : [{ name: b.devotee.name }])
    .map((p) => (p.gotra ? `${p.name} (Gotra: ${p.gotra})` : p.name))
    .join(", ");

// Plain-text version for WhatsApp / copy-paste
function buildText(date, groups, total) {
  const lines = [`🙏 Puja Run-Sheet — ${formatLongDate(date)}`, `${total} puja${total === 1 ? "" : "s"}`, ""];
  for (const [temple, items] of groups) {
    lines.push(`📍 ${temple}`);
    items.forEach((b, i) => {
      lines.push(`${i + 1}. ${b.bookingId} — ${b.puja}`);
      lines.push(`   For: ${forLine(b)}`);
      if (b.sankalp) lines.push(`   Sankalp: ${b.sankalp}`);
      if (b.addOns?.length) lines.push(`   Offerings: ${b.addOns.map((a) => a.name).join(", ")}`);
      if (b.status === "Pending") lines.push("   ⚠ NOT CONFIRMED YET");
    });
    lines.push("");
  }
  return lines.join("\n").trim();
}

export default function RunSheet({ date }) {
  const router = useRouter();
  const [result, setResult] = useState(null); // { date, bookings }
  const [error, setError] = useState(null); // { date, message }
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bookings?date=${date}&sort=bookingId&order=asc`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Server error (${r.status})`))))
      .then((data) => setResult({ date, bookings: data.bookings }))
      .catch((e) => e.name !== "AbortError" && setError({ date, message: e.message }));
    return () => controller.abort();
  }, [date]);

  const loading = result?.date !== date && error?.date !== date;
  const bookings = result?.date === date ? result.bookings : [];
  const groups = groupByTemple(bookings);
  const text = buildText(date, groups, bookings.length);
  const isToday = date === toISODate(new Date());

  const goTo = (d) => router.push(`/run-sheet?date=${d}`);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy automatically — please select the text and copy it.");
    }
  }

  const btn = "h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 hover:bg-stone-50";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
      {/* Controls — hidden when printing */}
      <div className="mb-6 space-y-3 print:hidden">
        <Link href="/" className="text-sm font-medium text-orange-700 hover:underline">
          ← Back to bookings
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => goTo(shiftISODate(date, -1))}>
            ← Prev day
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && goTo(e.target.value)}
            aria-label="Run-sheet date"
            className={`${btn} px-2`}
          />
          <button type="button" className={btn} onClick={() => goTo(shiftISODate(date, 1))}>
            Next day →
          </button>
          {!isToday && (
            <button type="button" className={btn} onClick={() => goTo(toISODate(new Date()))}>
              Today
            </button>
          )}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button type="button" className={btn} onClick={copyText} disabled={!bookings.length}>
              {copied ? "Copied ✓" : "Copy as text"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!bookings.length}
              className={`${btn} inline-flex items-center ${bookings.length ? "" : "pointer-events-none opacity-50"}`}
            >
              Share on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!bookings.length}
              className="h-9 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* The sheet itself */}
      <header className="mb-5 border-b-2 border-orange-500 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Aaradhya Setu · Puja Run-Sheet</p>
        <h1 className="text-2xl font-semibold text-stone-900">{formatLongDate(date)}</h1>
        <p className="text-sm text-stone-500">
          {loading ? "Loading…" : `${bookings.length} puja${bookings.length === 1 ? "" : "s"} across ${groups.length} temple${groups.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {error?.date === date && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load the run-sheet: {error.message}</p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          No pujas booked for this day.
        </div>
      )}

      <div className="space-y-6">
        {groups.map(([temple, items]) => (
          <section key={temple} className="break-inside-avoid">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-stone-900">
              <span aria-hidden="true">📍</span>
              {temple}
              <span className="text-sm font-normal text-stone-400">({items.length})</span>
            </h2>
            <ol className="space-y-3">
              {items.map((b, i) => (
                <li
                  key={b.bookingId}
                  className={`break-inside-avoid rounded-xl border bg-white p-4 print:rounded-none print:shadow-none ${
                    b.status === "Pending" ? "border-rose-300" : "border-stone-200"
                  } ${b.status === "Completed" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-stone-400">{i + 1}.</span>
                      <div>
                        <div className="font-semibold text-stone-900">{b.puja}</div>
                        <div className="font-mono text-xs text-orange-700">{b.bookingId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      {/* Box the pandit/admin ticks by hand on the printout */}
                      <span className="hidden h-5 w-5 border-2 border-stone-500 print:inline-block" aria-hidden="true" />
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-x-4 gap-y-1.5 pl-6 text-sm sm:grid-cols-[8rem_1fr]">
                    <dt className="text-stone-500">Puja for</dt>
                    <dd className="font-medium text-stone-900">{forLine(b)}</dd>
                    {b.sankalp && (
                      <>
                        <dt className="text-stone-500">Sankalp</dt>
                        <dd className="italic text-stone-800">“{b.sankalp}”</dd>
                      </>
                    )}
                    {b.addOns?.length > 0 && (
                      <>
                        <dt className="text-stone-500">Offerings</dt>
                        <dd className="text-stone-800">{b.addOns.map((a) => a.name).join(", ")}</dd>
                      </>
                    )}
                    <dt className="text-stone-500">Booked by</dt>
                    <dd className="text-stone-800">{b.devotee.name}</dd>
                  </dl>

                  {b.status === "Pending" && (
                    <p className="mt-3 pl-6 text-sm font-semibold text-rose-700">⚠ Not confirmed yet — arrange a pandit before this puja</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
