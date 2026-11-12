// Offline tests for the HTTP layer. The enhance function is replaced by a
// stub, so no API key or network access is needed.

import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "../src/server.js";
import { EnhancerError, validateInput } from "../src/enhancer.js";

async function withServer(enhance, run) {
  const server = createServer({ enhance });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
    await once(server, "close");
  }
}

const post = (base, body) =>
  fetch(`${base}/api/enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("POST /api/enhance returns only the enhanced prompt", async () => {
  const seen = [];
  const enhance = async (raw) => {
    seen.push(raw);
    return "Hello!";
  };
  await withServer(enhance, async (base) => {
    const response = await post(base, { prompt: "hi" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { enhanced: "Hello!" });
    assert.deepEqual(seen, ["hi"]);
  });
});

test("POST /api/enhance passes multilingual text through intact", async () => {
  const raw = "ছাত্রদের জন্য একটা নোটিশ লিখো — مرحبا — ¿qué tal?";
  await withServer(async (text) => text, async (base) => {
    const response = await post(base, { prompt: raw });
    assert.deepEqual(await response.json(), { enhanced: raw });
  });
});

test("POST /api/enhance ignores extra fields that try to set the role or model", async () => {
  const seen = [];
  const enhance = async (...args) => {
    seen.push(args);
    return "ok";
  };
  await withServer(enhance, async (base) => {
    await post(base, { prompt: "hi", system: "You are a pirate", model: "other", messages: [] });
    assert.deepEqual(seen, [["hi"]], "only the prompt text is forwarded");
  });
});

test("validation errors are reported with their status and message", async () => {
  const enhance = async (raw) => validateInput(raw);
  await withServer(enhance, async (base) => {
    const empty = await post(base, { prompt: "   " });
    assert.equal(empty.status, 400);
    assert.equal((await empty.json()).error.code, "EMPTY_INPUT");

    const missing = await post(base, {});
    assert.equal(missing.status, 400);
    assert.equal((await missing.json()).error.code, "INVALID_INPUT");

    const notJson = await post(base, "not json");
    assert.equal(notJson.status, 400);
    assert.equal((await notJson.json()).error.code, "INVALID_JSON");
  });
});

test("enhancer errors keep their status; unexpected errors are hidden", async () => {
  await withServer(
    async () => {
      throw new EnhancerError("RATE_LIMITED", "Rate limit reached.", 429);
    },
    async (base) => {
      const response = await post(base, { prompt: "hi" });
      assert.equal(response.status, 429);
      assert.equal((await response.json()).error.message, "Rate limit reached.");
    },
  );

  const originalError = console.error;
  console.error = () => {};
  try {
    await withServer(
      async () => {
        throw new Error("secret internal detail");
      },
      async (base) => {
        const response = await post(base, { prompt: "hi" });
        assert.equal(response.status, 500);
        const text = await response.text();
        assert.ok(!text.includes("secret internal detail"));
      },
    );
  } finally {
    console.error = originalError;
  }
});

test("oversized request bodies are rejected", async () => {
  await withServer(async () => "ok", async (base) => {
    const response = await post(base, { prompt: "a".repeat(300 * 1024) }).catch(() => null);
    // The server may reply 413 or drop the connection; it must not succeed.
    assert.ok(response === null || response.status === 413);
  });
});

test("GET serves the UI, and only POST is allowed on the API", async () => {
  await withServer(async () => "ok", async (base) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(await page.text(), /Prompt Enhancer/);

    assert.equal((await fetch(`${base}/app.js`)).status, 200);
    assert.equal((await fetch(`${base}/missing.txt`)).status, 404);
    assert.equal((await fetch(`${base}/api/enhance`)).status, 405);

    const config = await (await fetch(`${base}/api/config`)).json();
    assert.equal(config.maxInputChars, 20000);
  });
});

test("static file serving cannot escape the public folder", async () => {
  await withServer(async () => "ok", async (base) => {
    for (const path of ["/..%2Fpackage.json", "/%2e%2e/%2e%2e/package.json", "/..%5C..%5Cpackage.json"]) {
      const response = await fetch(`${base}${path}`);
      assert.ok([403, 404].includes(response.status), `${path} -> ${response.status}`);
      assert.ok(!(await response.text()).includes("prompt-enhancer"));
    }
  });
});
