#!/usr/bin/env node
// Validates the community package registry: registry/packages/<id>.json, one
// file per approved package. A pull request that adds or changes one must pass
// this check before a moderator reviews it (README.md, and the rules at
// packages.polyth.app/rules/). Zero dependencies; also imported by
// the catalog build (polyth-site scripts/update-packages.mjs).
//
//   node scripts/validate-registry.mjs [registry-dir]   (from registry/)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CATEGORIES = ["agents", "workspace", "engineering", "research", "operations", "finance", "wellbeing", "home", "system"];

const FIELDS = {
  id: true, name: true, summary: true, summary_uk: false, description: false,
  author: true, source: true, version: true, license: true, category: true,
  maturity: false, icon: false, homepage: false, tags: false, permissions: false,
  reviewedAt: true,
};
const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const SPDX = /^[A-Za-z0-9.+-]+(?: (?:OR|AND|WITH) [A-Za-z0-9.+-]+)*$/;
const HTTPS = /^https:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#][^\s]*)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COMMIT = /^[0-9a-f]{40}$/;
// No control characters, no markup: catalog text is rendered as plain text.
const plain = (value) => typeof value === "string" && !/[\u0000-\u001f\u007f<>]/.test(value) && value.trim() === value;

/** The ref a source pins, or null. Polyth installs exactly this ref, so a
 *  reviewed entry must name a release tag or a commit, never a moving branch. */
function pinnedRef(source) {
  let m = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/tree\/([^\s/]+)$/.exec(source);
  if (m) return m[1];
  m = /^https:\/\/gitlab\.com\/[\w.-]+(?:\/[\w.-]+)+\/-\/tree\/([^\s/]+)$/.exec(source);
  if (m) return m[1];
  m = /^https:\/\/[^\s?#]+\.zip$/.exec(source);
  if (m) return "archive";
  return null;
}

export function validateEntry(entry, fileId) {
  const errors = [];
  const bad = (message) => errors.push(`${fileId}.json: ${message}`);
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [`${fileId}.json: not a JSON object`];
  for (const key of Object.keys(entry)) if (!(key in FIELDS)) bad(`unknown field "${key}"`);
  for (const [key, required] of Object.entries(FIELDS)) if (required && entry[key] === undefined) bad(`missing "${key}"`);

  if (entry.id !== fileId) bad(`"id" must equal the file name (${fileId})`);
  if (!SLUG.test(fileId)) bad("the id must be 3–40 lowercase letters, digits or dashes");
  if (!plain(entry.name) || entry.name.length < 2 || entry.name.length > 40) bad('"name" must be plain text, 2–40 characters');
  for (const key of ["summary", "summary_uk"]) {
    if (entry[key] === undefined && key === "summary_uk") continue;
    if (!plain(entry[key]) || entry[key].length < 20 || entry[key].length > 160) bad(`"${key}" must be plain text, 20–160 characters`);
  }
  if (entry.description !== undefined && (typeof entry.description !== "string" || entry.description.length > 2000 || /[<>]/.test(entry.description)))
    bad('"description" must be plain text up to 2000 characters');

  const a = entry.author;
  if (!a || typeof a !== "object" || !plain(a.name) || !a.name || a.name.length > 60) bad('"author.name" is required, plain text up to 60 characters');
  else {
    for (const key of Object.keys(a)) if (key !== "name" && key !== "url") bad(`unknown field "author.${key}"`);
    if (a.url !== undefined && !HTTPS.test(a.url)) bad('"author.url" must be an https:// URL');
  }

  if (typeof entry.source !== "string") bad('"source" must be a string');
  else {
    const ref = pinnedRef(entry.source);
    if (!ref) bad('"source" must be https://github.com/<owner>/<repo>/tree/<tag-or-commit>, https://gitlab.com/<group>/<repo>/-/tree/<tag-or-commit> or an https://….zip URL');
    else if (ref !== "archive" && ref !== `v${entry.version}` && ref !== entry.version && !COMMIT.test(ref))
      bad(`"source" must pin the reviewed release: tag v${entry.version} (or ${entry.version}) or a full 40-character commit, not "${ref}"`);
  }
  if (typeof entry.version !== "string" || !SEMVER.test(entry.version)) bad('"version" must be semver (1.2.3)');
  if (typeof entry.license !== "string" || !SPDX.test(entry.license)) bad('"license" must be an SPDX expression (MIT, Apache-2.0, …)');
  if (!CATEGORIES.includes(entry.category)) bad(`"category" must be one of ${CATEGORIES.join(", ")}`);
  if (entry.maturity !== undefined && entry.maturity !== "stable" && entry.maturity !== "beta") bad('"maturity" must be "stable" or "beta"');
  if (entry.icon !== undefined && !/^[a-z0-9-]{1,40}$/.test(entry.icon)) bad('"icon" must be an icon name like "package"');
  if (entry.homepage !== undefined && !HTTPS.test(entry.homepage)) bad('"homepage" must be an https:// URL');
  for (const key of ["tags", "permissions"]) {
    const list = entry[key];
    if (list === undefined) continue;
    const max = key === "tags" ? [6, 24] : [12, 100];
    if (!Array.isArray(list) || list.length > max[0] || list.some((v) => !plain(v) || !v || v.length > max[1]))
      bad(`"${key}" must be at most ${max[0]} plain strings of up to ${max[1]} characters`);
  }
  if (typeof entry.reviewedAt !== "string" || !DATE.test(entry.reviewedAt) || Number.isNaN(Date.parse(entry.reviewedAt)))
    bad('"reviewedAt" must be the moderator\'s approval date, YYYY-MM-DD');
  return errors;
}

export function loadRegistry(dir) {
  const folder = join(dir, "packages");
  const entries = [];
  const errors = [];
  if (!existsSync(folder)) return { entries, errors };
  for (const name of readdirSync(folder).sort()) {
    if (name === ".gitkeep") continue;
    if (!name.endsWith(".json")) {
      errors.push(`${name}: only <id>.json files belong in registry/packages/`);
      continue;
    }
    const id = name.slice(0, -5);
    let entry;
    try {
      entry = JSON.parse(readFileSync(join(folder, name), "utf8"));
    } catch (error) {
      errors.push(`${name}: invalid JSON (${error.message})`);
      continue;
    }
    const problems = validateEntry(entry, id);
    if (problems.length) errors.push(...problems);
    else entries.push(entry);
  }
  return { entries, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const { entries, errors } = loadRegistry(dir);
  if (errors.length) {
    console.error(`registry check failed:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`registry ok: ${entries.length} package(s)`);
}
