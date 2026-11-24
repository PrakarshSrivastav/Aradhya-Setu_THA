// "Needs attention" rules — bookings at risk of being missed.
// Used by the API (to filter and count) and by the UI (to explain why).
//
//   Rule 1: still PENDING and the puja is within ATTENTION_DAYS (or already past)
//           -> nobody has arranged a pandit yet, and time is running out.
//   Rule 2: CONFIRMED / IN PROGRESS but the puja date has already passed
//           -> the puja probably happened but nobody marked it Completed
//              (or it was missed — either way someone must check).

export const ATTENTION_DAYS = 2;

const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Whole days from today until the puja (0 = today, 1 = tomorrow, -1 = yesterday)
export function daysUntil(pujaDate, now = new Date()) {
  return Math.round((startOfDay(new Date(pujaDate)) - startOfDay(now)) / DAY);
}

// MongoDB filter matching every booking that needs attention
export function attentionQuery(now = new Date()) {
  const today = startOfDay(now);
  const afterWindow = new Date(today.getTime() + (ATTENTION_DAYS + 1) * DAY);
  return {
    $or: [
      { status: "Pending", pujaDate: { $lt: afterWindow } },
      { status: { $in: ["Confirmed", "In Progress"] }, pujaDate: { $lt: today } },
    ],
  };
}

// Short human-readable reason, or null if the booking is fine
export function attentionReason(booking, now = new Date()) {
  const days = daysUntil(booking.pujaDate, now);

  if (booking.status === "Pending") {
    if (days < 0) return "Puja date has passed — never confirmed";
    if (days === 0) return "Puja is today — not confirmed yet";
    if (days <= ATTENTION_DAYS) return `Puja in ${days} day${days === 1 ? "" : "s"} — not confirmed yet`;
  }
  if ((booking.status === "Confirmed" || booking.status === "In Progress") && days < 0) {
    return "Puja date has passed — not marked Completed";
  }
  return null;
}
