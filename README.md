# 3D Attendance Dashboard — MVP

A responsive, dark, 3D student attendance dashboard built with plain **HTML, CSS, JavaScript, and JSON** — no build step, no backend, no database.

## Run it

Browsers block `fetch()` of local JSON files opened directly as `file://`, so serve the folder instead of double-clicking `index.html`:

```bash
cd 3d-attendance-dashboard
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser. (Any static server works — this is just the simplest option and matches the brief's note that Python may be used only as a local test server.)

## Structure

```
3d-attendance-dashboard/
├── index.html          # Page structure
├── css/styles.css       # Theme tokens, layout, 3D card + modal styling
├── js/app.js            # Data loading, calculations, filtering, 3D tilt, modal
├── data/students.json   # Student records (edit this to add/change students)
├── data/config.json     # School year label, attendance threshold, Sheets URL
└── README.md
```

## Configure

- **Google Sheets** — open `data/config.json` and paste a *view-only / published-to-web* Sheets URL into `googleSheets.url`. Leave it empty to keep showing the placeholder card. (File → Share → Publish to web in Google Sheets gives you the right link.)
- **Students** — edit `data/students.json`. Each record needs `id`, `name`, `section`, `profile` (image URL, or leave `""` for an auto-generated initials avatar), `present`, `total`, `absent`, and `today` (`"Present"` or `"Absent"`). Attendance % and Perfect/Needs Attention status are calculated automatically.
- **"Needs Attention" threshold** — edit `attendanceThreshold.needsAttentionBelowPercent` in `config.json` (defaults to 90%).

## Notes

- Fonts (Space Grotesk / Inter / JetBrains Mono) load from Google Fonts over the network; everything else runs fully offline once served.
- Respects `prefers-reduced-motion` (disables the card tilt and entrance animations).
- Student cards are keyboard-operable (Tab + Enter/Space); the profile modal closes on Escape, backdrop click, or the close button.
