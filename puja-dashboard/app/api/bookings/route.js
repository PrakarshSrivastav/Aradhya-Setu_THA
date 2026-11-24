import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { STATUSES } from "@/lib/constants";

const SORTABLE = ["pujaDate", "amount", "createdAt", "bookingId"];

// Escape user input before using it inside a RegExp
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/bookings?search=&status=&puja=&sort=pujaDate&order=asc
export async function GET(request) {
  await connectDB();
  const params = request.nextUrl.searchParams;

  const filter = {};
  const search = params.get("search")?.trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ bookingId: re }, { "devotee.name": re }, { puja: re }];
  }
  const status = params.get("status");
  if (status && STATUSES.includes(status)) filter.status = status;
  const puja = params.get("puja");
  if (puja) filter.puja = puja;

  const sortField = SORTABLE.includes(params.get("sort")) ? params.get("sort") : "createdAt";
  const order = params.get("order") === "asc" ? 1 : -1;

  const [bookings, counts] = await Promise.all([
    Booking.find(filter).sort({ [sortField]: order }).lean(),
    // Counts per status for the summary cards (ignores current filters)
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const c of counts) statusCounts[c._id] = c.count;

  return Response.json({ bookings, statusCounts });
}
