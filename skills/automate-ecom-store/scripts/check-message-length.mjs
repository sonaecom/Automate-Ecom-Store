#!/usr/bin/env node
/**
 * Check a seller message against a character limit. Default 200.
 *
 * Counts Unicode code points and UTF-16 code units. Fails if either count
 * is above the limit, so a web counter that uses JavaScript string length
 * cannot be over the limit when this check passes.
 *
 * Usage:
 *   node check-message-length.mjs --file message.txt
 *   node check-message-length.mjs --text "message"
 *   node check-message-length.mjs < message.txt
 *
 * Options:
 *   --max <n>   Limit. Default 200. This skill must not raise it.
 *
 * Exit 0: usable message
 * Exit 1: empty, too long, or still contains a <PLACEHOLDER> token
 * Exit 2: usage or file error
 *
 * The checker strips a leading BOM and one trailing newline only.
 * It does not trim spaces inside the message.
 */

import { readFileSync } from "node:fs";

const DEFAULT_MAX = 200;

function usage() {
  console.error(
    "usage: node check-message-length.mjs [--max 200] (--file path | --text message | stdin)",
  );
}

function parseArgs(argv) {
  let file = null;
  let text = null;
  let max = DEFAULT_MAX;
  let textFromFlag = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") {
      file = argv[i + 1];
      if (!file) return { error: "--file needs a path" };
      i += 1;
    } else if (arg === "--text") {
      text = argv[i + 1];
      textFromFlag = true;
      if (text === undefined) return { error: "--text needs a message" };
      i += 1;
    } else if (arg === "--max") {
      max = Number(argv[i + 1]);
      if (!Number.isInteger(max) || max < 1) return { error: "--max must be a positive integer" };
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else {
      return { error: `unknown argument: ${arg}` };
    }
  }

  if (file && textFromFlag) return { error: "use only one of --file or --text" };
  return { file, text, textFromFlag, max };
}

function stripWrapping(raw) {
  let value = raw.replace(/^\uFEFF/, "");
  if (value.endsWith("\r\n")) value = value.slice(0, -2);
  else if (value.endsWith("\n")) value = value.slice(0, -1);
  return value;
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

  let raw;
  try {
    if (parsed.file) raw = readFileSync(parsed.file, "utf8");
    else if (parsed.textFromFlag) raw = parsed.text;
    else if (process.stdin.isTTY) {
      usage();
      process.exit(2);
    } else {
      raw = readFileSync(0, "utf8");
    }
  } catch (error) {
    console.error(`read_error: ${error.message}`);
    process.exit(2);
  }

  const message = stripWrapping(raw);
  const codePoints = Array.from(message).length;
  const utf16Units = message.length;
  const placeholder = /<[A-Z0-9_]+>/.test(message);
  const limit = parsed.max;

  console.log(`code_points: ${codePoints}`);
  console.log(`utf16_units: ${utf16Units}`);
  console.log(`max: ${limit}`);
  console.log(`placeholders: ${placeholder ? "yes" : "no"}`);

  if (message.trim() === "") {
    console.log("result: EMPTY");
    process.exit(1);
  }
  if (placeholder) {
    console.log("result: PLACEHOLDER");
    process.exit(1);
  }
  if (codePoints > limit || utf16Units > limit) {
    console.log("result: TOO_LONG");
    process.exit(1);
  }
  console.log("result: OK");
}

main();
