#!/usr/bin/env node
/**
 * Guess a store platform from an AdsPower profile name.
 *
 *   node guess-platform.mjs --name "Shopee main"
 *   node guess-platform.mjs < names.txt
 *
 * Prints one numbered line per name: guess is shopee, lazada, tiktokshop, or unknown.
 * A name that matches more than one platform is unknown.
 * Does not read the network and does not print profile ids or keys.
 */

import { readFileSync } from "node:fs";

function usage() {
  console.error("usage: node guess-platform.mjs [--name text]...");
}

function guess(name) {
  const text = name.toLowerCase();
  const hits = [];
  if (text.includes("shopee")) hits.push("shopee");
  if (text.includes("lazada")) hits.push("lazada");
  if (text.includes("tiktok") || text.includes("tik tok")) hits.push("tiktokshop");
  return hits.length === 1 ? hits[0] : "unknown";
}

function main() {
  const names = [];
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--help" || args[i] === "-h") {
      usage();
      process.exit(0);
    } else if (args[i] === "--name") {
      if (!args[i + 1]) {
        console.error("--name needs a value");
        process.exit(2);
      }
      names.push(args[i + 1]);
      i += 1;
    } else {
      console.error(`unknown argument: ${args[i]}`);
      usage();
      process.exit(2);
    }
  }
  if (names.length === 0) {
    if (process.stdin.isTTY) {
      usage();
      process.exit(2);
    }
    for (const line of readFileSync(0, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      names.push(trimmed);
    }
  }
  let unknown = 0;
  names.forEach((name, index) => {
    const platform = guess(name);
    if (platform === "unknown") unknown += 1;
    console.log(`${index + 1} guess=${platform} name=${name}`);
  });
  console.log(`count: ${names.length}`);
  console.log(`unknown_count: ${unknown}`);
  console.log("result: OK");
}

main();
