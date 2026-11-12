// Minimal web server: serves the UI from /public and exposes POST /api/enhance.
// Uses only Node's built-in http module.

import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { enhancePrompt, EnhancerError, MAX_INPUT_CHARS, DEFAULT_MODEL } from "./enhancer.js";

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const MAX_BODY_BYTES = 256 * 1024;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new EnhancerError("INPUT_TOO_LONG", "The request is too large.", 413));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleEnhance(req, res, enhance) {
  try {
    const body = await readBody(req);
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new EnhancerError("INVALID_JSON", "The request body must be JSON.");
    }
    const enhanced = await enhance(data?.prompt);
    sendJson(res, 200, { enhanced });
  } catch (error) {
    if (error instanceof EnhancerError) {
      sendJson(res, error.status, { error: { code: error.code, message: error.message } });
    } else {
      console.error(error);
      sendJson(res, 500, { error: { code: "INTERNAL", message: "Something went wrong on the server." } });
    }
  }
}

async function serveStatic(pathname, res) {
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relative);
  // Refuse anything that resolves outside /public.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}

/**
 * Creates the HTTP server. `enhance` can be replaced in tests.
 * @param {{ enhance?: (rawPrompt: unknown) => Promise<string> }} [options]
 */
export function createServer({ enhance = enhancePrompt } = {}) {
  return http.createServer(async (req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url, "http://localhost").pathname;
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }

    if (pathname === "/api/enhance") {
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        sendJson(res, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } });
        return;
      }
      await handleEnhance(req, res, enhance);
      return;
    }
    if (pathname === "/api/config" && req.method === "GET") {
      sendJson(res, 200, { maxInputChars: MAX_INPUT_CHARS });
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(pathname, res);
      return;
    }
    res.writeHead(405).end("Method not allowed");
  });
}

// Start the server when this file is run directly (npm start).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, host, () => {
    console.log(`Prompt Enhancer is running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
    console.log(`Model: ${process.env.ENHANCER_MODEL ?? DEFAULT_MODEL}`);
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      console.warn("Warning: ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
    }
  });
}
