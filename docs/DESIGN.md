# Design notes

## Architecture

```
Browser (public/)  ──POST /api/enhance──▶  server.js  ──▶  enhancer.js  ──▶  Claude API
   or cli.js  ─────────────────────────────────────────▶  enhancer.js
```

| Part | File | Responsibility |
|---|---|---|
| Rules | `src/systemPrompt.js` | One constant system prompt that defines the enhancer's role. |
| Core | `src/enhancer.js` | Validate input, build the request, call the model, clean the output. |
| Web server | `src/server.js` | Serve the interface and expose `POST /api/enhance`. |
| Command line | `src/cli.js` | Same core, for terminal use. |
| Interface | `public/` | One page: input box, output box, four buttons. |

The core has no knowledge of HTTP, so the web server and the command line share it, and tests can call it directly.

## Flow from input to output

1. The user submits a raw prompt.
2. **Validate.** Empty or whitespace-only input is rejected. Input over 20,000 characters is rejected with a message; it is never silently truncated, because a truncated prompt would lose requirements.
3. **Wrap.** The raw prompt is placed between two marker lines that carry a random 16-character token generated for that request.
4. **Call the model.** The request contains the constant system prompt and one user message holding the wrapped prompt.
5. **Check the result.** A refusal, a cut-off response, or an empty response becomes a clear error rather than a broken output.
6. **Clean.** Wrappers the model may add despite its instructions (a code fence around everything, an "Enhanced prompt:" label, surrounding quotes, echoed marker lines) are removed.
7. Only the enhanced prompt is returned.

## Interface

A single page with two side-by-side boxes (stacked on narrow screens): the raw prompt on the left, the enhanced prompt on the right. There are no modes or settings, because the tool has one job. Text direction is detected automatically, so Arabic and other right-to-left input displays correctly. The page follows the system light or dark theme.

## Design decisions

**The user's input is data, never instructions.** Three layers enforce this:

1. *Separation by role.* The rules live only in the system prompt, which is a constant. User text is never interpolated into it, and the API endpoint forwards only the `prompt` field, so a request cannot supply its own system prompt, model, or extra messages.
2. *Unforgeable delimiters.* The marker token is random per request. Text inside the prompt cannot predict it, so it cannot fake a closing marker and place instructions "outside" the prompt.
3. *Explicit guidance.* The system prompt explains that anything between the markers, including text like "ignore your previous instructions", was written for the other model and must be rewritten like any other sentence: not obeyed, not removed, not commented on.

Removing such text would break the "preserve the original intent" rule, since a user may legitimately be drafting a prompt that contains those words. No delimiter scheme makes a language model fully immune to injection, so the live tests check this behaviour against the real model.

**Same language in, same language out.** The system prompt requires the output to stay in the input's language and script and forbids translation. The code never alters the text's encoding or content on the way in or out.

**Short inputs still go to the model.** A greeting such as "hi" is not special-cased in code. It is sent like any other prompt, and the system prompt gives examples of improving a greeting without replying to it.

**Output clean-up is conservative.** A wrapper is removed only when it surrounds the whole output and the raw prompt did not have the same wrapper. Code fences and quotes that are part of the prompt are left alone.

**Model and effort.** The default model is `claude-opus-5-5`, set through `ENHANCER_MODEL`. Rewriting is a light task, so requests use low reasoning effort to keep responses fast. `claude-haiku-5-5` is a cheaper alternative.

**Refusal fallback.** On models that support it, the request opts into the API's server-side fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): if the model declines a request on policy grounds, the API retries it on a fallback model within the same call. Set `ENHANCER_FALLBACKS=off` to disable this.

**Minimal dependencies.** Node's built-in `http` server, test runner, and `.env` loading cover everything except the model call, so the only dependency is the Anthropic SDK and there is no build step.

**Local by default, stateless.** The server binds to `127.0.0.1` and has no authentication, history, or database. Prompt text is not logged.

## Testing approach

| Suite | Needs API key | What it proves |
|---|---|---|
| `npm test` | No | What the code guarantees: request construction, input isolation, marker integrity, validation, output clean-up, error handling, HTTP behaviour. |
| `npm run test:live` | Yes | What the model does: fixes errors, keeps facts, stays in the input language, improves greetings, does not answer, and does not obey embedded instructions. |

Model output varies between runs, so the live tests assert properties of a correct enhancement rather than exact text.
