# The Personal Index

> A beautifully art-directed multi-page personal record system.  
> Built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no dependencies.  
> Web Programming · Lab 08

---

## What This Is

**The Personal Index** is a three-page static website that lets you:

1. **Create** a personal record by filling in seven fields.
2. **View** the record on a dedicated detail page.
3. **Browse** all saved records in a searchable directory.

All data is stored in your browser's `localStorage` — nothing is sent to a server.

---

## File Structure

```
Lab8/
├── index.html       ← Entry form (Page 1)
├── profile.html     ← Record detail view (Page 2)
├── directory.html   ← Searchable record directory (Page 3)
├── styles.css       ← Shared design system & responsive styles
├── app.js           ← All JavaScript: storage, validation, rendering
└── README.md        ← This file
```

---

## How to Run It

### Recommended: VS Code Live Server

1. Open the `Lab8` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if you haven't already.
3. Right-click `index.html` in the Explorer panel and choose **"Open with Live Server"**.
4. The site opens at something like `http://127.0.0.1:5500/index.html`.

> **Important:** Always use the same origin (the same `http://127.0.0.1:5500/` address) for all three pages. Opening HTML files directly via `file://` in different tabs may cause `localStorage` to behave inconsistently across pages in some browsers.

### Alternative: Any Local HTTP Server

```bash
# Python 3
cd "path/to/Lab8"
python -m http.server 5500

# Then open: http://localhost:5500
```

---

## How It Works

### Data Storage

Records are stored as a JSON array under the key `personalIndexRecords` in `localStorage`.

Each record has this shape:

```javascript
{
  id:        "IDX-M5Z4K1A2-3F7C",      // unique ID
  fullName:  "Priya Sharma",
  gender:    "Female",
  mobile:    "+91 98765 43210",
  email:     "priya@example.com",
  city:      "Bengaluru",
  state:     "Karnataka",
  country:   "India",
  createdAt: "2026-10-21T14:47:00.000Z"  // ISO timestamp
}
```

### Navigation Between Pages

After a successful form submission, the app saves the record and redirects to:

```
profile.html?id=IDX-XXXXX-XXXX
```

The profile page reads the `id` URL parameter, looks up the record in `localStorage`, and renders it using safe DOM methods (`textContent`, `createElement`). This means the page survives a browser refresh.

The directory page reads all stored records on load, counts them, and renders a filterable table.

### Page Detection

Each HTML page sets a `data-page` attribute on `<body>`:

```html
<body data-page="index">    <!-- or "profile" / "directory" -->
```

`app.js` reads this attribute on `DOMContentLoaded` and calls the right initialization function. This keeps the single shared script file clean and readable.

---

## Features Demonstrated

| Requirement | Implementation |
|---|---|
| HTML form elements | All seven fields with proper `<input>`, `<fieldset>`, `<legend>`, `<label>` |
| CSS styling | Custom design system via CSS variables, editorial typographic hierarchy |
| Responsive layout | Two-column split on desktop, stacked on mobile; responsive table → cards |
| Form validation | Client-side JS, inline error messages, focus management, no-refresh |
| Data persistence | `localStorage` with JSON serialization, survives page refresh and navigation |
| Multi-page navigation | Three separate HTML files, URL query parameter (`?id=...`) |
| Displaying submitted data | `profile.html` reads and renders the saved record using DOM methods |
| Directory / listing | `directory.html` shows all records in a live-searchable table |
| Deletion | Per-record and clear-all with confirmation dialogs |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigation, visible focus states |

---

## Design Notes

The visual identity — called **The Personal Index** — uses:

- **Serif** (Georgia) for headings and record names
- **Sans-serif** (system stack) for labels, body text, and controls
- **Monospace** (Courier New) for metadata, IDs, timestamps, and section labels
- A warm paper palette (`#F4F1E8`) with deep forest ink (`#19392F`) and a terracotta accent (`#D65F43`)
- Thin rules and editorial spacing instead of cards and gradients

---

## Browser Compatibility

Tested with modern browsers (Chrome, Firefox, Edge, Safari).  
Uses `localStorage`, `URLSearchParams`, and standard ES2017 features — no polyfills required.

---

*Web Programming · Lab 08*
