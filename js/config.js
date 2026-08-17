// Runtime configuration — committed with EMPTY defaults so the site works on
// any static host (GitHub Pages, Netlify, Vercel, etc.) out of the box.
//
// With an empty APPS_SCRIPT_URL the contact form falls back to opening the
// visitor's email client (no backend required).
//
// To enable the Google Sheets backend later:
//   1. cp .env.example .env  (fill in your real APPS_SCRIPT_URL)
//   2. node scripts/generate-config.js
// IMPORTANT: never commit a generated file that contains a real URL.
window.APP_CONFIG = {
  APPS_SCRIPT_URL: ""
};
