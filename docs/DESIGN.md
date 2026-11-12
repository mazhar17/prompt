# Design notes

## Architecture

```
Browser: index.html  ──HTTPS──▶  Anthropic API (api.anthropic.com)
```

The app is a single static file served by GitHub Pages. It has no server, no build step, and no dependencies. `index.html` holds three parts:

| Part | Where | Responsibility |
|---|---|---|
| Interface | HTML and `<style>` | Input box, output box, settings panel. |
| Core | `<script id="core">` | The rules (system prompt), validation, request building, the API call, output clean-up. No page access. |
| Page behaviour | second `<script>` | Buttons, settings, status messages. Calls the core. |

Keeping the core in its own block with no page access lets the tests load that block from `index.html` and run it in Node.js, so the tested code and the shipped code are the same.

## Flow from input to output

1. The user submits a raw prompt.
2. **Validate.** Empty or whitespace-only input is rejected. Input over 20,000 characters is rejected with a message; it is never silently truncated, because a truncated prompt would lose requirements.
3. **Wrap.** The raw prompt is placed between two marker lines that carry a random 16-character token generated for that request.
4. **Call the model.** The browser sends the constant system prompt and one user message holding the wrapped prompt to the Anthropic API.
5. **Check the result.** A refusal, a cut-off response, or an empty response becomes a clear error rather than a broken output.
6. **Clean.** Wrappers the model may add despite its instructions (a code fence around everything, an "Enhanced prompt:" label, surrounding quotes, echoed marker lines) are removed.
7. Only the enhanced prompt is shown.

## Design decisions

**No server, so each user brings their own key.** A static page cannot keep a secret: any key placed in the file would be readable by every visitor. The page therefore asks each user for their own Anthropic API key and calls the API directly from the browser. The cost of this choice is that every user needs a key and pays for their own usage. A shared, institution-funded key would need a small server or proxy in front of the API.

**Protecting the key.** The key is held in the browser only: in `localStorage` when "Remember" is ticked, otherwise in memory until the page closes. A Content-Security-Policy in the page allows network requests only to `api.anthropic.com` and forbids loading any external script, style, image, or font, so the page cannot send the key elsewhere and has no third-party code that could. Error messages never include the key.

**Direct API calls instead of the SDK.** The page uses the browser's built-in `fetch` rather than Anthropic's SDK, because loading the SDK would require either a build step or a third-party script host, and the file must stay self-contained.

**The user's input is data, never instructions.** Three layers enforce this:

1. *Separation by role.* The rules live only in the system prompt, which is a constant. User text is never inserted into it and only ever appears in the single user message.
2. *Unforgeable delimiters.* The marker token is random per request. Text inside the prompt cannot predict it, so it cannot fake a closing marker and place instructions "outside" the prompt.
3. *Explicit guidance.* The system prompt explains that anything between the markers, including text like "ignore your previous instructions", was written for the other model and must be rewritten like any other sentence: not obeyed, not removed, not commented on.

Removing such text would break the "preserve the original intent" rule, since a user may legitimately be drafting a prompt that contains those words. No delimiter scheme makes a language model fully immune to injection, so the live tests check this behaviour against the real model.

**Same language in, same language out.** The system prompt requires the output to stay in the input's language and script and forbids translation. The code never alters the text on the way in or out, and both text boxes detect right-to-left scripts automatically.

**Short inputs still go to the model.** A greeting such as "hi" is not special-cased in code. It is sent like any other prompt, and the system prompt gives examples of improving a greeting without replying to it.

**Output clean-up is conservative.** A wrapper is removed only when it surrounds the whole output and the raw prompt did not have the same wrapper. Code fences and quotes that are part of the prompt are left alone.

**Model and effort.** The default model is Claude Opus 5.5; the settings panel also offers Claude Sonnet 5.5 and Claude Haiku 5.5. Rewriting is a light task, so requests use low reasoning effort to keep responses fast.

**Refusal fallback.** On models that support it, the request opts into the API's server-side fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): if the model declines a request on policy grounds, the API retries it on a fallback model within the same call. If the API rejects the option itself, the page retries once without it.

## Testing approach

| Suite | Needs API key | What it proves |
|---|---|---|
| `npm test` | No | What the code guarantees: request construction, input isolation, marker integrity, validation, output clean-up, error handling, and that the page is self-contained. |
| `npm run test:live` | Yes | What the model does: fixes errors, keeps facts, stays in the input language, improves greetings, does not answer, and does not obey embedded instructions. |

Model output varies between runs, so the live tests assert properties of a correct enhancement rather than exact text.
