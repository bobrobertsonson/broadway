#!/usr/bin/env node
// Builds "Super Jasmin World 3.html": the whole game in one file (Phaser, code, levels.json,
// styles), so it opens with a double-click from Finder, offline, with no web server.
// A plain file:// page can't load ES modules or fetch levels.json, so the modules are bundled
// into one script and levels.json is embedded as window.__LEVELS (Boot uses it when present).
//
//   node tools/build-single.mjs        (needs network once for esbuild via npx)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const bundle = execFileSync("npx", ["--yes", "esbuild@0.24.0", "src/main.js", "--bundle", "--format=iife", "--minify", "--target=es2020", "--log-level=warning"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const levels = JSON.stringify(JSON.parse(read("levels.json")));
// "</script" inside inlined code would end the script tag early.
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

let html = read("index.html");
html = html.replace(/<link rel="stylesheet" href="style.css">/, () => `<style>\n${read("style.css")}\n</style>`);
html = html.replace(/\s*<!-- Phaser from the CDN[\s\S]*?<script type="module" src="src\/main.js"><\/script>/, () =>
  `\n  <script>${safe(read("vendor/phaser.min.js"))}</script>\n  <script>window.__LEVELS = ${safe(levels)};</script>\n  <script>${safe(bundle)}</script>`);
if (!html.includes("window.__LEVELS")) throw new Error("index.html layout changed: script block not found");

const out = path.join(root, "Super Jasmin World 3.html");
fs.writeFileSync(out, html);
console.log(`wrote ${path.basename(out)} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
