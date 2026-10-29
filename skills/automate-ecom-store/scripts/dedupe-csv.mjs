#!/usr/bin/env node
/**
 * Compare values with one column of a private CSV.
 *
 * Default column is handle, for affiliate invite lists whose header includes
 * handle. Pass --column to dedupe another list, such as a column of item labels.
 *
 * A missing or empty file means nothing is recorded yet. A value already in
 * the column (trimmed, case-insensitive) is SKIP. Any other value is NEW.
 *
 * Usage:
 *   node dedupe-csv.mjs --csv path [--handle h]...
 *   node dedupe-csv.mjs --csv path --column item_label --value <ITEM_LABEL>
 *   node dedupe-csv.mjs --csv path --values-file path
 *   node dedupe-csv.mjs --csv path --list
 *
 * --handle is shorthand for a value in the handle column.
 * --handles-file is accepted as an alias of --values-file.
 *
 * Exit 0: the file was read (or is missing / empty). Read SKIP and NEW lines.
 * Exit 2: usage error, unreadable file, or header missing the chosen column.
 *
 * This script never writes the CSV and never contacts the network.
 */

import { readFileSync, existsSync } from "node:fs";

function usage() {
  console.error(
    "usage: node dedupe-csv.mjs --csv path [--column name] [--handle h | --value v]... [--values-file path] [--list]",
  );
}

function parseArgs(argv) {
  let csv = null;
  let column = "handle";
  const values = [];
  let valuesFile = null;
  let list = false;
  let sawHandle = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") {
      csv = argv[i + 1];
      if (!csv) return { error: "--csv needs a path" };
      i += 1;
    } else if (arg === "--column") {
      column = argv[i + 1];
      if (!column) return { error: "--column needs a name" };
      i += 1;
    } else if (arg === "--handle") {
      const handle = argv[i + 1];
      if (!handle) return { error: "--handle needs a value" };
      values.push(handle);
      sawHandle = true;
      i += 1;
    } else if (arg === "--value") {
      const value = argv[i + 1];
      if (!value) return { error: "--value needs a value" };
      values.push(value);
      i += 1;
    } else if (arg === "--values-file" || arg === "--handles-file") {
      valuesFile = argv[i + 1];
      if (!valuesFile) return { error: `${arg} needs a path` };
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
  if (sawHandle && column.toLowerCase() !== "handle") {
    return { error: "--handle only checks the handle column; use --value with --column" };
  }
  return { csv, column: column.toLowerCase(), values, valuesFile, list };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");

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

  const wanted = [...parsed.values];
  if (parsed.valuesFile) {
    let fileText;
    try {
      fileText = readFileSync(parsed.valuesFile, "utf8");
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
    console.log(`column: ${parsed.column}`);
    console.log("csv_status: missing");
    console.log("existing_count: 0");
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
    console.log(`column: ${parsed.column}`);
    console.log("csv_status: empty");
    console.log("existing_count: 0");
    for (const handle of wanted) console.log(`NEW ${handle}`);
    console.log(`new_count: ${wanted.length}`);
    console.log("skip_count: 0");
    console.log("result: OK");
    process.exit(0);
  }

  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) {
    console.log(`column: ${parsed.column}`);
    console.log("csv_status: empty");
    console.log("existing_count: 0");
    for (const handle of wanted) console.log(`NEW ${handle}`);
    console.log(`new_count: ${wanted.length}`);
    console.log("skip_count: 0");
    console.log("result: OK");
    process.exit(0);
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const columnIndex = header.indexOf(parsed.column);
  if (columnIndex === -1) {
    console.error(`header_error: the first row must include a ${parsed.column} column`);
    process.exit(2);
  }

  const invited = new Map();
  for (const row of rows.slice(1)) {
    const handle = (row[columnIndex] || "").trim();
    if (!handle) continue;
    const key = keyOf(handle);
    if (!invited.has(key)) invited.set(key, handle);
  }

  console.log(`column: ${parsed.column}`);
  console.log("csv_status: ok");
  console.log(`existing_count: ${invited.size}`);
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
