// Loads the core logic straight out of index.html, so the tests exercise
// exactly the code the page runs.

import { readFileSync } from "node:fs";
import vm from "node:vm";

const htmlPath = new URL("../index.html", import.meta.url);
export const html = readFileSync(htmlPath, "utf8");

const match = html.match(/<script id="core">([\s\S]*?)<\/script>/);
if (!match) throw new Error('index.html has no <script id="core"> block');

vm.runInThisContext(match[1], { filename: "index.html#core" });

export const core = globalThis.PromptEnhancer;
