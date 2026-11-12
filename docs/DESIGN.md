# Design notes

## Architecture

```
Browser: index.html  ──HTTPS──▶  the AI provider the user selects
```

The app is a single static file served by GitHub Pages. It has no server, no build step, and no dependencies. `index.html` holds three parts:

| Part | Where | Responsibility |
|---|---|---|
| Interface | HTML and `<style>` | Input box, output box, settings panel. |
| Core | `<script id="core">` | The rules (system prompt), the provider definitions, validation, the API call, output clean-up. No page access. |
| Page behaviour | second `<script>` | Buttons, settings, status messages. Calls the core. |

Keeping the core in its own block with no page access lets the tests load that block from `index.html` and run it in Node.js, so the tested code and the shipped code are the same.

## Flow from input to output

1. The user submits a raw prompt.
2. **Validate.** Empty or whitespace-only input is rejected. Input over 20,000 characters is rejected with a message; it is never silently truncated, because a truncated prompt would lose requirements.
3. **Wrap.** The raw prompt is placed between two marker lines that carry a random 16-character token generated for that request.
4. **Call the model.** The browser sends the constant system prompt and one user message holding the wrapped prompt to the selected provider, in that provider's request format.
5. **Check the result.** A refusal, a cut-off response, or an empty response becomes a clear error rather than a broken output.
6. **Clean.** Wrappers a model may add despite its instructions (printed reasoning in `<think>` tags, a code fence around everything, an "Enhanced prompt:" label, surrounding quotes, echoed marker lines) are removed.
7. Only the enhanced prompt is shown.

## Providers

Each provider is one entry in the `PROVIDERS` table with four functions: build the enhancement request, read the response, build the model-list request, read the model list.

| Provider | Request format | System prompt goes in | Key header |
|---|---|---|---|
| Google Gemini | `generateContent` | `systemInstruction` | `x-goog-api-key` |
| Anthropic | Messages API | `system` | `x-api-key` |
| OpenAI, OpenRouter, Groq, Mistral | Chat completions | a `system` message | `Authorization: Bearer` |

The four chat-completions providers share one implementation and differ only in address, labels, and default model. Adding another provider of that kind takes one table entry plus its address in the page's Content-Security-Policy.

A provider is included only if its API accepts requests sent directly from a web page (CORS). This was checked for each provider in a real browser. Cerebras and GitHub Models were left out because that check failed.

## Design decisions

**No server, so each user brings their own key.** A static page cannot keep a secret: any key placed in the file would be readable by every visitor. The page therefore asks each user for their own API key and calls the provider directly from the browser. The cost of this choice is that every user needs a key. A shared, institution-funded key would need a small server or proxy in front of the API.

**Several providers, including free ones.** Because users supply their own key, the page supports providers with free tiers (Gemini, Groq, Mistral, and OpenRouter's free models) alongside paid ones, so nobody has to pay to use the tool. The same system prompt is sent to every provider.

**Model names are loaded, not hard-coded.** Providers rename and retire models frequently. After a key is saved, the page asks the provider which models that key can use and fills the Model box from the answer. Built-in default names are only a starting point; if a default is not in the loaded list, the page picks a suitable available model instead. The Model box also accepts a typed name.

**Protecting the keys.** Keys are held in the browser only: in `localStorage` when "Remember" is ticked, otherwise in memory until the page closes. Each key is sent only to its own provider, always in a request header and never in a URL. A Content-Security-Policy in the page allows network requests only to the supported providers' addresses and forbids loading any external script, style, image, or font, so the page cannot send a key elsewhere and has no third-party code that could. Error messages never include the key. A test checks that the policy's allowed addresses are exactly the providers' addresses.

**Direct API calls instead of SDKs.** The page uses the browser's built-in `fetch` rather than the providers' SDKs, because loading an SDK would require either a build step or a third-party script host, and the file must stay self-contained.

**The user's input is data, never instructions.** Three layers enforce this, identically for every provider:

1. *Separation by role.* The rules live only in the system prompt, which is a constant. User text is never inserted into it and only ever appears in the single user message.
2. *Unforgeable delimiters.* The marker token is random per request. Text inside the prompt cannot predict it, so it cannot fake a closing marker and place instructions "outside" the prompt.
3. *Explicit guidance.* The system prompt explains that anything between the markers, including text like "ignore your previous instructions", was written for the other model and must be rewritten like any other sentence: not obeyed, not removed, not commented on.

Removing such text would break the "preserve the original intent" rule, since a user may legitimately be drafting a prompt that contains those words. No delimiter scheme makes a language model fully immune to injection, and smaller free models follow such rules less reliably than larger ones, so the live tests check this behaviour against whichever real model is configured.

**Same language in, same language out.** The system prompt requires the output to stay in the input's language and script and forbids translation. The code never alters the text on the way in or out, and both text boxes detect right-to-left scripts automatically.

**Short inputs still go to the model.** A greeting such as "hi" is not special-cased in code. It is sent like any other prompt, and the system prompt gives examples of improving a greeting without replying to it.

**Output clean-up is conservative.** A wrapper is removed only when it surrounds the whole output and the raw prompt did not have the same wrapper. Code fences and quotes that are part of the prompt are left alone.

**Minimal requests.** Chat-completions requests carry only the model name and the two messages, with no optional settings, because the accepted settings differ between providers and models. Anthropic requests add low reasoning effort (rewriting is a light task) and, on models that support it, the server-side refusal fallback; if the API rejects that option, the page retries once without it.

## Testing approach

| Suite | Needs API key | What it proves |
|---|---|---|
| `npm test` | No | What the code guarantees, for every provider: request construction, input isolation, marker integrity, key handling, validation, response and error handling, output clean-up, and that the page is self-contained. |
| `npm run test:live` | Yes | What a real model does: fixes errors, keeps facts, stays in the input language, improves greetings, does not answer, and does not obey embedded instructions. |

Model output varies between runs, so the live tests assert properties of a correct enhancement rather than exact text.
