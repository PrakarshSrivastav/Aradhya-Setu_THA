import mongoose from "mongoose";
import { STATUSES } from "../lib/constants.js";

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true }, // e.g. "AS-1024"
    devotee: {
      name: { type: String, required: true },
      phone: String, // WhatsApp number
      email: String,
    },
    puja: { type: String, required: true },
    temple: String,
    pujaDate: { type: Date, required: true },
    amount: { type: Number, required: true }, // total paid, in rupees
    status: { type: String, enum: STATUSES, default: "Pending" },

    // Extra details shown in the booking details view
    beneficiaries: [{ name: String, gotra: String, _id: false }],
    sankalp: String,
    addOns: [{ name: String, price: Number, _id: false }],
    statusHistory: [{ status: String, changedAt: Date, _id: false }],
  },
  { timestamps: true } // adds createdAt (= booking time) and updatedAt
);

// Reuse the model if it was already compiled (avoids errors on hot reload)
export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
