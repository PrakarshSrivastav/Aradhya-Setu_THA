// Fills the database with dummy bookings. Run: npm run seed
// (the database must be running: npm run db, or npm run dev)
// WARNING: deletes all existing bookings first.
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import { PUJAS, ADD_ONS, STATUSES } from "../lib/constants.js";

const NAMES = [
  "Rohan Mehta", "Ananya Iyer", "Vikram Singh", "Sneha Kulkarni", "Arjun Nair",
  "Kavya Reddy", "Aditya Joshi", "Meera Pillai", "Rahul Verma", "Pooja Sharma",
  "Karan Malhotra", "Divya Menon", "Siddharth Rao", "Neha Gupta", "Amit Patel",
  "Ishita Banerjee", "Manish Tiwari", "Ritu Agarwal", "Suresh Krishnan", "Lakshmi Narayan",
];
const GOTRAS = ["Kashyap", "Bharadwaj", "Vashishtha", "Gautam", "Atri", "Vishwamitra", "Jamadagni"];
const SANKALPS = [
  "Good health for my family",
  "Success in my son's exams",
  "Peace and prosperity at home",
  "Recovery of my father's health",
  "Blessings for a new business",
  "Removal of obstacles in career",
];

// Small seeded random generator so every seed run produces the same data
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setHours(9, 0, 0, 0);

// Status depends on the puja date, like real data would:
// past -> mostly Completed, today -> In Progress, future -> Pending/Confirmed
function statusFor(offsetDays) {
  if (offsetDays < 0) return rand() < 0.85 ? "Completed" : "Confirmed";
  if (offsetDays === 0) return "In Progress";
  return rand() < 0.6 ? "Pending" : "Confirmed";
}

// Spread the status changes evenly between booking time and now (never in the future)
function buildHistory(status, createdAt, pujaDate) {
  const steps = STATUSES.slice(0, STATUSES.indexOf(status) + 1);
  const end = Math.min(pujaDate.getTime() + 3 * 60 * 60 * 1000, Date.now()); // puja ends ~3h after start
  const gap = (end - createdAt.getTime()) / steps.length;
  return steps.map((s, i) => ({ status: s, changedAt: new Date(createdAt.getTime() + i * gap) }));
}

function makeBooking(i, overrides = {}) {
  const puja = pick(PUJAS);
  const offsetDays = Math.floor(rand() * 41) - 20; // -20 .. +20 days from today
  const pujaDate = new Date(today.getTime() + offsetDays * DAY);
  // Booked 5–15 days before the puja, but never later than (roughly) now
  const createdAt = new Date(
    Math.min(pujaDate.getTime() - (5 + Math.floor(rand() * 10)) * DAY, Date.now() - Math.floor(rand() * 72) * 3600 * 1000)
  );
  const addOns = ADD_ONS.filter(() => rand() < 0.3);
  const name = pick(NAMES);
  const status = statusFor(offsetDays);

  return {
    bookingId: `AS-${1000 + i}`,
    devotee: {
      name,
      phone: `+91 9${String(Math.floor(rand() * 1e9)).padStart(9, "0")}`,
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    },
    puja: puja.name,
    temple: puja.temple,
    pujaDate,
    amount: puja.price + addOns.reduce((sum, a) => sum + a.price, 0),
    status,
    beneficiaries: [{ name, gotra: pick(GOTRAS) }],
    sankalp: pick(SANKALPS),
    addOns,
    statusHistory: buildHistory(status, createdAt, pujaDate),
    createdAt,
    ...overrides,
  };
}

const bookings = Array.from({ length: 30 }, (_, i) => makeBooking(i + 1));

// Priya's booking from scenario.txt — a fresh Pending booking
const priyaCreated = new Date();
bookings.push(
  makeBooking(24, {
    devotee: { name: "Priya Sharma", phone: "+91 9876543210", email: "priya@example.com" },
    puja: "Rudrabhishek",
    temple: "Kashi Vishwanath, Varanasi",
    pujaDate: new Date(today.getTime() + 7 * DAY),
    amount: 2100 + 251,
    status: "Pending",
    beneficiaries: [{ name: "Ramesh Sharma", gotra: "Kashyap" }],
    sankalp: "Good health for my father",
    addOns: [{ name: "Prasad Delivery", price: 251 }],
    statusHistory: [{ status: "Pending", changedAt: priyaCreated }],
    createdAt: priyaCreated,
  })
);
// AS-1024 was generated above too; keep only Priya's copy
const unique = bookings.filter((b, i) => b.bookingId !== "AS-1024" || i === bookings.length - 1);

await mongoose.connect(process.env.MONGODB_URI);
await Booking.deleteMany({});
await Booking.insertMany(unique, { timestamps: false }); // keep our own createdAt
console.log(`Seeded ${unique.length} bookings.`);
await mongoose.disconnect();
