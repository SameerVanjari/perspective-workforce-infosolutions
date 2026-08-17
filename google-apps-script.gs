/**
 * Perspectives Workforce — Contact form → Google Sheets backend
 * ==========================================================================
 * This script receives form submissions from the website and appends them to
 * a Google Sheet. It runs as a Google Apps Script "Web App".
 *
 * SETUP (one-time):
 *   1. Create a Google Sheet (name the tab "Submissions", or edit SHEET_NAME below).
 *   2. In the Sheet: Extensions → Apps Script.
 *   3. Paste this whole file into the editor (replace any default code).
 *   4. Deploy: Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   5. Copy the Web App URL (looks like https://script.google.com/macros/s/…/exec).
 *   6. Paste that URL into `APPS_SCRIPT_URL` at the top of js/main.js.
 *
 * Sheet columns created (appendRow order):
 *   Timestamp | Form | Name | Email | Phone | Company | Subject/Role |
 *   Message | Experience | Skills | CV
 */

var SHEET_NAME = "Submissions";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return json({ ok: false, error: "invalid_json" });
    }

    // ---- Server-side validation (client can be bypassed, so re-check here) ----
    // Honeypot: hidden field only bots fill in.
    if (String(data.website || "").trim() !== "") {
      return json({ ok: false, error: "spam" });
    }

    var name = String(data.name || "").trim();
    var email = String(data.email || "").trim();
    var phone = String(data.phone || "").trim();
    var message = String(data.message || "").trim();
    var skills = String(data.skills || "").trim();

    if (name.length < 2 || name.length > 80) return json({ ok: false, error: "name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: "email" });
    if (phone) {
      var digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return json({ ok: false, error: "phone" });
    }
    // Quote form requires a message; CV form requires skills.
    if (message.length < 20 && skills.length < 3) return json({ ok: false, error: "content" });
    if (/https?:\/\/|www\./i.test(message) || /https?:\/\/|www\./i.test(skills)) {
      return json({ ok: false, error: "links_not_allowed" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
    }

    sheet.appendRow([
      new Date(),
      String(data._form || ""),
      name,
      email,
      phone,
      String(data.company || ""),
      String(data.subject || ""),
      message,
      String(data.experience || ""),
      skills,
      String(data.cv || "")
    ]);

    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
