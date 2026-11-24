import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { STATUSES } from "@/lib/constants";

// GET /api/bookings/AS-1024  -> one booking (for the details view)
export async function GET(_request, { params }) {
  const { id } = await params;
  await connectDB();
  const booking = await Booking.findOne({ bookingId: id }).lean();
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  return Response.json({ booking });
}

// PATCH /api/bookings/AS-1024  body: { "status": "Confirmed" }
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!STATUSES.includes(body.status)) {
    return Response.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  await connectDB();
  const booking = await Booking.findOneAndUpdate(
    { bookingId: id },
    {
      $set: { status: body.status },
      $push: { statusHistory: { status: body.status, changedAt: new Date() } },
    },
    { new: true, runValidators: true } // also enforce the schema's status enum
  ).lean();

  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  return Response.json({ booking });
}
