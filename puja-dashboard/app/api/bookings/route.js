import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { STATUSES } from "@/lib/constants";
import { attentionQuery } from "@/lib/attention";

const SORTABLE = ["pujaDate", "amount", "createdAt", "bookingId"];

// Escape user input before using it inside a RegExp
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/bookings?search=&status=&puja=&attention=1&date=YYYY-MM-DD&sort=pujaDate&order=asc
export async function GET(request) {
  await connectDB();
  const params = request.nextUrl.searchParams;

  // Every filter adds one condition; all conditions must match ($and)
  const conditions = [];

  const search = params.get("search")?.trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    conditions.push({ $or: [{ bookingId: re }, { "devotee.name": re }, { puja: re }] });
  }

  const status = params.get("status");
  if (status && STATUSES.includes(status)) conditions.push({ status });

  const puja = params.get("puja");
  if (puja) conditions.push({ puja });

  // Only bookings at risk (see lib/attention.js for the rules)
  if (params.get("attention") === "1") conditions.push(attentionQuery());

  // One calendar day, e.g. for the run-sheet: date=2026-11-24 (server's local time)
  const date = params.get("date");
  if (date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return Response.json({ error: "date must look like YYYY-MM-DD" }, { status: 400 });
    const start = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    conditions.push({ pujaDate: { $gte: start, $lt: end } });
  }

  const filter = conditions.length ? { $and: conditions } : {};
  const sortField = SORTABLE.includes(params.get("sort")) ? params.get("sort") : "createdAt";
  const order = params.get("order") === "asc" ? 1 : -1;

  const [bookings, counts, attentionCount] = await Promise.all([
    Booking.find(filter).sort({ [sortField]: order, bookingId: 1 }).lean(),
    // These two ignore the current filters — they describe the whole business
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.countDocuments(attentionQuery()),
  ]);

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const c of counts) statusCounts[c._id] = c.count;

  return Response.json({ bookings, statusCounts, attentionCount });
}
