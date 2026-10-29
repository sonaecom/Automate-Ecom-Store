#!/usr/bin/env node
/**
 * Compare affiliate handles with the private invited CSV.
 *
 * The CSV header is:
 *   handle,name,campaign_id,commission,invited_date,source
 *
 * A missing file means nobody has been invited yet. A handle already in the
 * file (case-insensitive, trimmed) is SKIP. Any other handle is NEW.
 *
 * Usage:
 *   node check-invited.mjs --csv path [--handle h]...
 *   node check-invited.mjs --csv path --handles-file handles.txt
 *   node check-invited.mjs --csv path --list
 *
 * Exit 0: the file was read (or is missing / empty). Read SKIP and NEW lines.
 * Exit 2: usage error, unreadable file, or header missing the handle column.
 *
 * This script never writes the CSV and never contacts the network.
 */

import { readFileSync, existsSync } from "node:fs";

function usage() {
  console.error(
    "usage: node check-invited.mjs --csv path [--handle h]... [--handles-file path] [--list]",
  );
}

function parseArgs(argv) {
  let csv = null;
  const handles = [];
  let handlesFile = null;
  let list = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") {
      csv = argv[i + 1];
      if (!csv) return { error: "--csv needs a path" };
      i += 1;
    } else if (arg === "--handle") {
      const handle = argv[i + 1];
      if (!handle) return { error: "--handle needs a value" };
      handles.push(handle);
      i += 1;
    } else if (arg === "--handles-file") {
      handlesFile = argv[i + 1];
      if (!handlesFile) return { error: "--handles-file needs a path" };
      i += 1;
    } else if (arg === "--list") {
      list = true;
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else {
      return { error: `unknown argument: ${arg}` };
    }
  }

  if (!csv) return { error: "--csv is required" };
  return { csv, handles, handlesFile, list };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function keyOf(handle) {
  return handle.trim().toLowerCase();
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    usage();
    process.exit(0);
  }
  if (parsed.error) {
    console.error(parsed.error);
    usage();
    process.exit(2);
  }

  const wanted = [...parsed.handles];
  if (parsed.handlesFile) {
    let fileText;
    try {
      fileText = readFileSync(parsed.handlesFile, "utf8");
    } catch (error) {
      console.error(`read_error: ${error.message}`);
      process.exit(2);
    }
    for (const line of fileText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      wanted.push(trimmed);
    }
  }

  console.log(`csv_path: ${parsed.csv}`);

  if (!existsSync(parsed.csv)) {
    console.log("csv_status: missing");
    console.log("invited_count: 0");
    for (const handle of wanted) console.log(`NEW ${handle}`);
    console.log(`new_count: ${wanted.length}`);
    console.log("skip_count: 0");
    console.log("result: OK");
    process.exit(0);
  }

  let text;
  try {
    text = readFileSync(parsed.csv, "utf8");
  } catch (error) {
    console.error(`read_error: ${error.message}`);
    process.exit(2);
  }

  if (text.trim() === "") {
    console.log("csv_status: empty");
    console.log("invited_count: 0");
    for (const handle of wanted) console.log(`NEW ${handle}`);
    console.log(`new_count: ${wanted.length}`);
    console.log("skip_count: 0");
    console.log("result: OK");
    process.exit(0);
  }

  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) {
    console.log("csv_status: empty");
    console.log("invited_count: 0");
    for (const handle of wanted) console.log(`NEW ${handle}`);
    console.log(`new_count: ${wanted.length}`);
    console.log("skip_count: 0");
    console.log("result: OK");
    process.exit(0);
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const handleIndex = header.indexOf("handle");
  if (handleIndex === -1) {
    console.error("header_error: the first row must include a handle column");
    process.exit(2);
  }

  const invited = new Map();
  for (const row of rows.slice(1)) {
    const handle = (row[handleIndex] || "").trim();
    if (!handle) continue;
    const key = keyOf(handle);
    if (!invited.has(key)) invited.set(key, handle);
  }

  console.log("csv_status: ok");
  console.log(`invited_count: ${invited.size}`);
  if (parsed.list) {
    for (const handle of invited.values()) console.log(`INVITED ${handle}`);
  }

  let skipCount = 0;
  let newCount = 0;
  for (const handle of wanted) {
    if (invited.has(keyOf(handle))) {
      console.log(`SKIP ${handle}`);
      skipCount += 1;
    } else {
      console.log(`NEW ${handle}`);
      newCount += 1;
    }
  }
  console.log(`new_count: ${newCount}`);
  console.log(`skip_count: ${skipCount}`);
  console.log("result: OK");
}

main();
