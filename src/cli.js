#!/usr/bin/env node
// Command-line use:
//   npm run enhance -- "your raw prompt"
//   type prompt.txt | npm run --silent enhance
// Prints only the enhanced prompt to stdout.

import { enhancePrompt, EnhancerError } from "./enhancer.js";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const args = process.argv.slice(2);
const rawPrompt = args.length > 0 ? args.join(" ") : process.stdin.isTTY ? "" : await readStdin();

try {
  process.stdout.write((await enhancePrompt(rawPrompt)) + "\n");
} catch (error) {
  const message = error instanceof EnhancerError ? error.message : String(error?.message ?? error);
  process.stderr.write(`Error: ${message}\n`);
  if (error instanceof EnhancerError && error.code === "EMPTY_INPUT") {
    process.stderr.write('Usage: npm run enhance -- "your raw prompt"\n');
  }
  process.exitCode = 1;
}
