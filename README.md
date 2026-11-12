# Prompt Enhancer

Prompt Enhancer takes a rough prompt and rewrites it into a clear, polished, well-structured prompt for another AI model.

It keeps what you meant and fixes how you wrote it:

- **Preserves** the original intent, meaning, tone, language, facts, constraints, and requirements.
- **Corrects** grammar, spelling, punctuation, and unclear phrasing.
- **Adds structure** (lists, steps, paragraphs) only where your prompt clearly implies it.
- **Never** answers the prompt, asks clarifying questions, or invents information.
- **Outputs only** the enhanced prompt: no explanations, labels, quotes, or code fences.

| You type | You get |
|---|---|
| `write email to students about class cancel tomorrow, make it polite` | `Write a polite email to my students informing them that tomorrow's class is cancelled.` |
| `hi` | `Hello!` |
| `আগামীকাল ক্লাস বাতিল নিয়ে ছাত্রদের একটা ইমেইল লিখে দাও` | An improved prompt, still in Bangla |

The examples are illustrative; exact wording varies from run to run.

## Tech stack

- **Node.js 22+** with no build step and no web framework (built-in `http` server and built-in test runner).
- **Anthropic SDK** (`@anthropic-ai/sdk`), the only dependency, to call a Claude model.
- **Plain HTML, CSS and JavaScript** for the interface.

## Setup

1. Install [Node.js](https://nodejs.org/) version 22 or newer.
2. Install the dependency:

   ```bash
   npm install
   ```

3. Create your configuration file by copying the example:

   ```bash
   cp .env.example .env
   ```

   On Windows Command Prompt use `copy .env.example .env`.

4. Open `.env` and set `ANTHROPIC_API_KEY` to your key from the [Claude Console](https://platform.claude.com/). The `.env` file is ignored by Git, so the key is never committed.

## Run the app locally

```bash
npm start
```

Then open <http://127.0.0.1:3000> in your browser.

1. Type or paste a prompt in the left box.
2. Click **Enhance prompt** (or press `Ctrl + Enter`).
3. Click **Copy** to copy the result, or **Use as input** to enhance it again.

To stop the server, press `Ctrl + C` in the terminal.

### Command line

```bash
npm run --silent enhance -- "write email to students about class cancel tomorrow"
```

The command prints only the enhanced prompt, so it can be piped into other tools. It also reads from standard input when no argument is given.

### HTTP API

`POST /api/enhance` with a JSON body:

```json
{ "prompt": "your raw prompt" }
```

Success returns `{ "enhanced": "..." }`. Failure returns `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status.

## Configuration

All settings are environment variables, read from `.env`.

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | none (required) | Key used to call the model. |
| `ENHANCER_MODEL` | `claude-opus-5-5` | Model used for enhancement. `claude-haiku-5-5` is a cheaper, faster option. |
| `ENHANCER_FALLBACKS` | on | Set to `off` to disable the server-side refusal fallback (see [design notes](docs/DESIGN.md)). |
| `HOST` | `127.0.0.1` | Address the server listens on. |
| `PORT` | `3000` | Port the server listens on. |

The server listens on `127.0.0.1` by default, so it is reachable only from your own computer. It has no login, so do not expose it to a network without adding authentication first.

## Tests

```bash
npm test
```

Runs the offline suite. It needs no API key and makes no network calls: the model is replaced by a stand-in. It covers:

- normal inputs,
- very short and greeting inputs (which must still be sent for improvement),
- multilingual inputs (Bangla, Arabic, Spanish, Japanese, mixed-language, emoji),
- inputs containing instructions meant to override the enhancer's role,
- output clean-up, error handling, and the HTTP layer.

```bash
npm run test:live
```

Runs the live suite against the real model for the same four categories. It needs `ANTHROPIC_API_KEY`, uses a small amount of API credit, and is skipped when no key is set.

## Project structure

```
src/
  systemPrompt.js   The rules the enhancer follows
  enhancer.js       Validation, request building, model call, output clean-up
  server.js         Web server and /api/enhance endpoint
  cli.js            Command-line entry point
public/             Web interface (index.html, style.css, app.js)
test/               Offline tests and live model tests
docs/DESIGN.md      Architecture and design decisions
```

## Privacy

Prompts are sent to the Anthropic API to be rewritten. The app itself stores nothing: there is no database, no history, and prompt text is not written to logs.
