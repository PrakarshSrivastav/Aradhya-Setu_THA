const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (amount) => inr.format(amount ?? 0);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// Dates as "YYYY-MM-DD" in local time (for URLs and <input type="date">)
export const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseISODate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const shiftISODate = (s, days) => {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const formatLongDate = (s) =>
  parseISODate(s).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// "Today", "Tomorrow", "In 3 days", "2 days ago" — helps admins spot what's coming up
export function relativeDay(value) {
  const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((start(new Date(value)) - start(new Date())) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}
