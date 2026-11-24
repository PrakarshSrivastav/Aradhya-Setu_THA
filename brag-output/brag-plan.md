# Brag plan — Aaradhya Setu Puja Booking Dashboard

Made with the `/brag` skill (latent-spaces/brag), slim mode: the video is built
from the project's own design system (its Tailwind classes compiled with its own
Tailwind compiler, its Geist font, its colours), mirroring the real components.

## Answers

- **What is it?** An admin dashboard where the Aaradhya Setu team tracks every
  puja booking from "just booked" to "puja done".
- **Who is it for / what does it do for them?** The operations team: find any
  booking, move it through Pending → Confirmed → In Progress → Completed, and
  never miss a puja.
- **What sets it apart?** It knows the business: it flags pujas about to be
  missed, and prints a run-sheet with the names, gotra and sankalp the pandit
  must recite.
- **Most impressive claim:** "Nothing slips past puja day": the Needs-Attention banner.
- **Visual hook:** A "New booking" toast drops in (Priya, Rudrabhishek,
  Kashi Vishwanath), then "Now what?"
- **Real UI shown:** header, status cards, bookings table, search, details
  drawer + status change, attention banner, run-sheet.
- **Tone:** `polished` with warmth: saffron, calm, confident; quick cuts on the beat.
- **Share caption:** see share-copy.txt.

## Data & privacy

All records are the project's fictional seed data (no real customers).
Phone numbers are replaced with obvious placeholders (+91 90000 000xx).
No env files, secrets or URLs other than the public GitHub repo appear.

## Identity

- Background `#fdfaf6` (warm cream), ink stone-900, accent orange-600 `#ea580c`,
  gradient logo orange-500 → amber-500 with "ॐ".
- Status colours: amber (Pending), sky (Confirmed), violet (In Progress), emerald (Completed); rose for attention.
- Font: Geist (same as the app).

## Music

Original, composed for this video: 120 BPM (beat = 0.5 s), key of D.
Tanpura-style drone (D + A) from the start, temple-bell hit on frame 0 and on
the outro, sitar-like plucked melody in D major pentatonic, soft kick/hat
groove entering at the reveal (3.0 s). UI clicks are A-pitched blips; the
"Confirmed" success chime is A5 → D6; transitions get a soft filtered whoosh
that lands on the cut. Every cut and click sits on the 0.5 s grid.

## Storyboard (landscape 1920×1080, 30 fps, 22.5 s)

| # | Time | Scene | On screen | Sound |
|---|---|---|---|---|
| 1 | 0.0–3.0 | **Hook** | Cream canvas. A "New booking" toast drops in at 0.5: ॐ · "AS-1024 · Priya Sharma · Rudrabhishek · Kashi Vishwanath, Varanasi · ₹2,351". At 1.5 "Now what?" appears big and holds. | Bell on 0.0, drone, soft pluck on 0.5 |
| 2 | 3.0–6.0 | **Reveal** | Dashboard header slides down; 5 status cards rise one by one with counts ticking up (30 / 7 / 5 / 1 / 17); 4 table rows stagger in. Caption: "Every puja booking. One dashboard." | Drums enter on 3.0, whoosh into cut |
| 3 | 6.0–9.5 | **Find** | Search box: "priya" types in (8th-note ticks), table collapses to the AS-1024 row; cursor clicks the row at 9.0. Caption: "Find any booking in a keystroke." | Typing ticks, click blip on 9.0 |
| 4 | 9.5–13.5 | **Update** | Details drawer slides in (AS-1024, Rudrabhishek, sankalp "Good health for my father"). Cursor clicks "Mark as Confirmed" at 11.0: badge flips amber→sky, history gets "Confirmed", button becomes "Mark as In Progress". Caption: "One click. Saved for the whole team." | Click on 11.0 + success chime |
| 5 | 13.5–16.5 | **Safety net** | Rose banner "4 bookings need attention" slides in; 3 flagged rows with red markers + reasons ("Puja in 1 day — not confirmed yet"). Caption: "Nothing slips past puja day." | Low tom accent on 13.5 |
| 6 | 16.5–19.5 | **Run-sheet** | Paper-style run-sheet "Wednesday, 25 November 2026": two temple groups, names + gotra + sankalp; "Share on WhatsApp" button pulses. Caption: "Tomorrow's pujas, ready for the pandit." | Paper whoosh, pluck motif |
| 7 | 19.5–22.5 | **Outro** | Logo ॐ, "Aaradhya Setu" / "Puja Booking Dashboard", stack line "Next.js · Node.js · MongoDB", repo `github.com/PrakarshSrivastav/Aradhya-Setu_THA`. | Bell on 19.5, music resolves to D, fade last 1 s |

Scene durations: 3 + 3 + 3.5 + 4 + 3 + 3 + 3 = **22.5 s** (675 frames).
Transitions: staggered (old content out, then new in) or a dip through the cream background; no muddy crossfades.

Poster (frame 0): the settled "Confirmed" drawer frame (11.8 s).

Notes from the build:
- The drawer in scene 4 shows the real panel's header, status controls, Puja
  section and Status history; the Devotee and Payment sections are left out so
  the whole panel fits on screen without scrolling.
- Table columns are fixed-width in the video so nothing jumps when search hides rows.
- Kick and bell levels were pulled down after checking the waveform so no hit
  spikes above the music; final mix normalised to about -16 LUFS.

## How it was built (reproducible)

    node brag-output/work/build-css.mjs      # project's Tailwind -> composition/app.css
    node brag-output/work/music.mjs          # soundtrack -> work/audio.wav
    node brag-output/work/render.mjs frames  # headless Edge -> work/frames/*.jpg
    # then ffmpeg: frames + audio -> brag.mp4 (x264 CRF 18, AAC 192k, loudnorm -16 LUFS)
