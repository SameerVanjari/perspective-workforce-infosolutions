#!/usr/bin/env node
/**
 * Generates js/config.js (gitignored) from the .env file.
 * Keeps secrets out of source control while still injecting them into the
 * static site at build/deploy time.
 *
 * Usage:
 *   node scripts/generate-config.js
 */

var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var envPath = path.join(root, ".env");
var outPath = path.join(root, "js", "config.js");

function parseEnv(file) {
  var out = {};
  if (!fs.existsSync(file)) return out;
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed || trimmed.charAt(0) === "#") return;
      var eq = trimmed.indexOf("=");
      if (eq === -1) return;
      var key = trimmed.slice(0, eq).trim();
      var val = trimmed.slice(eq + 1).trim();
      if (
        (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
        (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'")
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    });
  return out;
}

var vars = parseEnv(envPath);
var cfg = {
  APPS_SCRIPT_URL: vars.APPS_SCRIPT_URL || ""
};

var content =
  "// GENERATED FILE — do not edit by hand. Run: node scripts/generate-config.js\n" +
  "// This file is gitignored so secrets stay out of source control.\n" +
  "window.APP_CONFIG = " +
  JSON.stringify(cfg, null, 2) +
  ";\n";

fs.writeFileSync(outPath, content);
console.log(
  "Wrote js/config.js (APPS_SCRIPT_URL: " +
    (cfg.APPS_SCRIPT_URL ? "set" : "empty — mailto fallback") +
    ")"
);
