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
| GET | `/api/bookings?search=&status=&puja=&attention=1&date=YYYY-MM-DD&sort=&order=` | List bookings + counts per status + `attentionCount`. `attention=1`: only at-risk bookings. `date`: only pujas on that day. `sort`: `pujaDate`, `amount`, `createdAt`, `bookingId`; `order`: `asc`/`desc` |
| GET | `/api/bookings/:bookingId` | One booking, for the details view |
| PATCH | `/api/bookings/:bookingId` | Body `{ "status": "Confirmed" }` — validates the status and records it in `statusHistory` |

Statuses: `Pending → Confirmed → In Progress → Completed`

## Project layout

```
app/page.js                     dashboard UI
app/run-sheet/page.js           daily run-sheet page (UI in components/RunSheet.js)
lib/attention.js                "needs attention" rules
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
- **Needs attention alerts** (`lib/attention.js`): a banner counts bookings at risk of being missed and
  filters to them in one click. Rules: still *Pending* with the puja ≤ 2 days away (or past), or
  *Confirmed / In Progress* after the puja date has passed. Each flagged row and its details panel
  say why. The same rules drive the MongoDB query and the on-screen reason, so they can't disagree.
- **Daily puja run-sheet** (`/run-sheet?date=YYYY-MM-DD`, "Today's run-sheet" button): every puja on
  one day grouped by temple, with what the pandit needs — names, gotra, sankalp, offerings — and
  unconfirmed ones flagged. Print it (controls hide, tick-boxes appear), copy it as text, or share
  on WhatsApp. Devotee phone/email are deliberately left off: the pandit doesn't need them.

## Troubleshooting

- **Turbopack "failed to create junction point … Access is denied"** (Windows): stop the server, delete the `.next` folder and run `npm run dev` again. It is a file-locking race (often antivirus scanning `node_modules`), not a code problem.
