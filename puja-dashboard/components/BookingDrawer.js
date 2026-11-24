"use client";

import { useEffect, useState } from "react";
import { STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, formatINR, relativeDay } from "@/lib/format";
import { attentionReason } from "@/lib/attention";
import StatusBadge, { STATUS_STYLES } from "./StatusBadge";

function Section({ title, children }) {
  return (
    <section className="border-t border-stone-100 px-5 py-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right text-stone-900">{children}</dd>
    </div>
  );
}

// Slide-over panel showing one booking in full, with the status controls.
// The parent renders it with key={bookingId}, so state resets for each booking.
export default function BookingDrawer({ bookingId, onClose, onUpdated }) {
  const [booking, setBooking] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(null); // the status currently being saved
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { signal: controller.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `Server error (${r.status})`);
        setBooking(body.booking);
      })
      .catch((e) => e.name !== "AbortError" && setLoadError(e.message));
    return () => controller.abort();
  }, [bookingId]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function changeStatus(status) {
    setSaving(status);
    setSaveError(null);
    try {
      const r = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `Server error (${r.status})`);
      setBooking(body.booking);
      onUpdated(body.booking);
    } catch (e) {
      setSaveError(`Could not update status: ${e.message}`);
    } finally {
      setSaving(null);
    }
  }

  const reason = booking ? attentionReason(booking) : null;
  const currentIndex = booking ? STATUSES.indexOf(booking.status) : -1;
  const nextStatus = STATUSES[currentIndex + 1];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-hidden="true" />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4">
          <div>
            <p className="font-mono text-sm font-medium text-orange-700">{bookingId}</p>
            <h2 id="drawer-title" className="text-lg font-semibold text-stone-900">
              {booking ? booking.puja : "Booking details"}
            </h2>
            {booking && <p className="text-sm text-stone-500">{booking.temple}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loadError && <p className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
          {!booking && !loadError && <p className="p-5 text-sm text-stone-500">Loading…</p>}

          {booking && (
            <>
              {/* Status controls */}
              <div className="space-y-3 px-5 py-4">
                {reason && (
                  <div role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    <span aria-hidden="true">⚠</span>
                    <span>
                      <strong>Needs attention:</strong> {reason}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Current status</span>
                  <StatusBadge status={booking.status} />
                </div>

                {nextStatus && (
                  <button
                    type="button"
                    onClick={() => changeStatus(nextStatus)}
                    disabled={saving !== null}
                    className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60"
                  >
                    {saving === nextStatus ? "Saving…" : `Mark as ${nextStatus}`}
                  </button>
                )}

                <div>
                  <p className="mb-1.5 text-xs text-stone-400">Or set status directly</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUSES.map((s) => {
                      const isCurrent = s === booking.status;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => changeStatus(s)}
                          disabled={isCurrent || saving !== null}
                          aria-pressed={isCurrent}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                            isCurrent
                              ? `${STATUS_STYLES[s].badge} border-transparent ring-1 ring-inset`
                              : "border-stone-200 text-stone-600 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-60"
                          }`}
                        >
                          {saving === s ? "Saving…" : s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {saveError && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{saveError}</p>}
              </div>

              <Section title="Puja">
                <dl>
                  <Row label="Puja date">
                    {formatDate(booking.pujaDate)}{" "}
                    <span className="text-stone-400">({relativeDay(booking.pujaDate)})</span>
                  </Row>
                  <Row label="Booked on">{formatDateTime(booking.createdAt)}</Row>
                </dl>
                {booking.sankalp && (
                  <blockquote className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm italic text-stone-700">
                    “{booking.sankalp}”
                  </blockquote>
                )}
              </Section>

              <Section title="Devotee">
                <dl>
                  <Row label="Name">{booking.devotee.name}</Row>
                  <Row label="WhatsApp">
                    <a href={`tel:${booking.devotee.phone}`} className="text-orange-700 hover:underline">
                      {booking.devotee.phone}
                    </a>
                  </Row>
                  <Row label="Email">
                    <a href={`mailto:${booking.devotee.email}`} className="text-orange-700 hover:underline">
                      {booking.devotee.email}
                    </a>
                  </Row>
                </dl>
              </Section>

              {booking.beneficiaries?.length > 0 && (
                <Section title="Puja performed for">
                  <ul className="space-y-1 text-sm">
                    {booking.beneficiaries.map((p, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-stone-900">{p.name}</span>
                        <span className="text-stone-500">Gotra: {p.gotra || "—"}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="Payment">
                <dl>
                  <Row label={booking.puja}>
                    {formatINR(booking.amount - (booking.addOns ?? []).reduce((sum, a) => sum + a.price, 0))}
                  </Row>
                  {booking.addOns?.map((a) => (
                    <Row key={a.name} label={`+ ${a.name}`}>{formatINR(a.price)}</Row>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-stone-100 pt-2 text-sm font-semibold">
                    <dt>Total paid</dt>
                    <dd className="tabular-nums">{formatINR(booking.amount)}</dd>
                  </div>
                </dl>
              </Section>

              <Section title="Status history">
                <ol className="relative ml-1.5 space-y-3 border-l border-stone-200 pl-4">
                  {[...(booking.statusHistory ?? [])].reverse().map((h, i) => (
                    <li key={i} className="relative text-sm">
                      <span
                        className={`absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                          STATUS_STYLES[h.status]?.dot ?? "bg-stone-400"
                        }`}
                      />
                      <div className="font-medium text-stone-800">{h.status}</div>
                      <div className="text-xs text-stone-400">{formatDateTime(h.changedAt)}</div>
                    </li>
                  ))}
                </ol>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
