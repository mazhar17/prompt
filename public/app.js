// Front-end logic: send the raw prompt to /api/enhance and show the result.

const form = document.getElementById("form");
const input = document.getElementById("input");
const output = document.getElementById("output");
const enhanceBtn = document.getElementById("enhance");
const clearBtn = document.getElementById("clear");
const copyBtn = document.getElementById("copy");
const reuseBtn = document.getElementById("reuse");
const count = document.getElementById("count");
const statusEl = document.getElementById("status");

let maxInputChars = 20000;
let busy = false;

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = kind;
}

function refresh() {
  const length = input.value.length;
  const over = length > maxInputChars;
  count.textContent = `${length.toLocaleString("en")} / ${maxInputChars.toLocaleString("en")}`;
  count.classList.toggle("over", over);
  enhanceBtn.disabled = busy || over || input.value.trim() === "";
  const hasOutput = output.value !== "";
  copyBtn.disabled = !hasOutput;
  reuseBtn.disabled = !hasOutput || busy;
}

async function enhance() {
  if (enhanceBtn.disabled) return;
  busy = true;
  enhanceBtn.textContent = "Enhancing…";
  setStatus("");
  refresh();
  try {
    const response = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input.value }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `Request failed (${response.status}).`);
    }
    output.value = data.enhanced;
    setStatus("Done.", "ok");
  } catch (error) {
    const offline = error instanceof TypeError;
    setStatus(offline ? "Could not reach the server. Is it still running?" : error.message, "error");
  } finally {
    busy = false;
    enhanceBtn.textContent = "Enhance prompt";
    refresh();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  enhance();
});

input.addEventListener("input", refresh);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    enhance();
  }
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  output.value = "";
  setStatus("");
  refresh();
  input.focus();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus("Copied to clipboard.", "ok");
  } catch {
    output.select();
    setStatus("Press Ctrl + C to copy the selected text.");
  }
});

reuseBtn.addEventListener("click", () => {
  input.value = output.value;
  output.value = "";
  setStatus("");
  refresh();
  input.focus();
});

fetch("/api/config")
  .then((response) => response.json())
  .then((config) => {
    if (Number.isFinite(config?.maxInputChars)) maxInputChars = config.maxInputChars;
    refresh();
  })
  .catch(() => {});

refresh();
