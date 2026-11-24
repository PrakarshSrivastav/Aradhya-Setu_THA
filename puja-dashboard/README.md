# Aaradhya Setu — Puja Booking Admin Dashboard

Admin dashboard for managing puja bookings (SDE Intern Assignment, Option 2).
See `../scenario.txt` for the customer → admin story this app supports.

**Stack:** Next.js 16 (React 19, App Router) · Next.js API routes on Node.js · MongoDB via Mongoose · Tailwind CSS

## Run it

```bash
npm install
npm run dev      # starts local MongoDB (port 27017) + Next.js (http://localhost:3000)
npm run seed     # in a second terminal: loads ~30 dummy bookings (wipes existing ones)
```

No MongoDB install needed: `npm run db` starts a local MongoDB via `mongodb-memory-server`
and stores data in `.data/db`, so changes persist across restarts.
To use your own MongoDB/Atlas instead, set `MONGODB_URI` in `.env.local` and run `npm run dev:web`.

## API

| Method | Route | What it does |
|---|---|---|
| GET | `/api/bookings?search=&status=&puja=&sort=&order=` | List bookings + counts per status. `sort`: `pujaDate`, `amount`, `createdAt`, `bookingId`; `order`: `asc`/`desc` |
| GET | `/api/bookings/:bookingId` | One booking, for the details view |
| PATCH | `/api/bookings/:bookingId` | Body `{ "status": "Confirmed" }` — validates the status and records it in `statusHistory` |

Statuses: `Pending → Confirmed → In Progress → Completed`

## Project layout

```
app/page.js                     dashboard UI
app/api/bookings/route.js       list / search / filter / sort
app/api/bookings/[id]/route.js  get one, change status
models/Booking.js               Mongoose schema
lib/db.js                       cached MongoDB connection
lib/constants.js                statuses, pujas, add-ons
scripts/db.mjs                  local MongoDB server
scripts/seed.mjs                dummy data
```

## Dashboard features

- Summary cards with counts per status (click one to filter)
- Search by booking ID, devotee or puja (debounced, 300 ms)
- Filter by status and puja; sort by booking time, puja date, amount or ID (dropdown or click column headers)
- Booking details slide-over: devotee contact, beneficiaries & gotra, sankalp, payment breakdown, status history
- Status changes: one-click "Mark as next status", or set any status directly; saved to MongoDB
- Responsive: table on desktop, cards on mobile

## Troubleshooting

- **Turbopack "failed to create junction point … Access is denied"** (Windows): stop the server, delete the `.next` folder and run `npm run dev` again. It is a file-locking race (often antivirus scanning `node_modules`), not a code problem.
