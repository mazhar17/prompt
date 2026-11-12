# Prompt Enhancer

**Open the app: <https://mazhar17.github.io/Prompt-Enhancer/>**

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

The examples are illustrative; exact wording varies by model and from run to run.

## How it works

The whole app is one file, [`index.html`](index.html), hosted on GitHub Pages. There is no server and nothing to install. The page sends your prompt straight from your browser to the AI provider you choose and shows the result.

Because there is no server to hold a shared key, **each person uses their own API key**, and any usage is counted against that key.

## Supported AI providers

| Provider | Cost | Where to get a key |
|---|---|---|
| Google Gemini (default) | Free tier available | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI (GPT) | Paid | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic (Claude) | Paid | [Claude Console](https://platform.claude.com/) |
| OpenRouter | Some models free (names ending in `:free`), others paid | [OpenRouter](https://openrouter.ai/keys) |
| Groq (open models such as Llama) | Free tier available | [Groq Console](https://console.groq.com/keys) |
| Mistral | Free tier available | [Mistral Console](https://console.mistral.ai/api-keys) |

Free tiers and their limits are set by each provider and change over time; check the provider's site. Free tiers may also use your prompts to improve their services, so read the provider's terms before entering anything sensitive.

You can save a key for several providers and switch between them at any time.

## Using the app

1. Open <https://mazhar17.github.io/Prompt-Enhancer/>.
2. The first time, open **AI provider and API key**:
   1. Choose a provider.
   2. Paste your API key for that provider and click **Save**.
   3. The page then loads the models your key can use and selects one. To choose another, click in the **Model** box, or click **Load models** to refresh the list.
3. Type or paste a prompt in the left box.
4. Click **Enhance prompt** (or press `Ctrl + Enter`).
5. Click **Copy** to copy the result, or **Use as input** to enhance it again.

### Settings

| Setting | Purpose |
|---|---|
| AI provider | Which service rewrites your prompt. |
| Model | The model to use. Pick from the loaded list or type a model name. |
| Load models | Asks the provider which models your key can use. |
| API key | Your own key for the selected provider. Kept in your browser only. |
| Remember the key in this browser | Ticked: the key is saved in this browser for next time. Unticked: the key is kept only until you close or reload the page. Untick it on a shared computer. |
| Forget this key | Removes the selected provider's saved key from this browser. |

Model names change often. If a model stops working ("Model not found"), click **Load models** and pick a current one.

## Privacy and security

- Your API keys are stored only in your own browser, and each is sent only to its own provider.
- The page's security policy blocks it from contacting any address other than the six providers above, and from loading any outside code.
- Prompts are sent to the provider you select to be rewritten. The app keeps no history.
- Saved keys are readable by anyone who can use your browser profile, so untick "Remember" on shared computers.
- Do not paste confidential or personal data into the prompt.

## Run it locally

Download `index.html` and open it in a browser. It works the same way from your own disk.

## Host your own copy

1. Fork this repository, or copy `index.html` into a repository of your own.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute the page is live at `https://<your-username>.github.io/<repository-name>/`.

## Tests

The tests need [Node.js](https://nodejs.org/) 22 or newer and no other installation. They load the logic directly out of `index.html`, so they exercise exactly the code the page runs.

```bash
npm test
```

Runs the offline suite. It needs no API key and makes no network calls. For every provider it covers:

- normal inputs,
- very short and greeting inputs (which must still be sent for improvement),
- multilingual inputs (Bangla, Arabic, Spanish, Japanese, mixed-language, emoji),
- inputs containing instructions meant to override the enhancer's role,
- response handling, error handling, and model lists.

It also checks output clean-up and that the page is self-contained.

```bash
npm run test:live
```

Runs the live suite against a real model for the same four categories. It is skipped when no key is set. Put the settings in the environment or in a local `.env` file (ignored by Git):

```
ENHANCER_PROVIDER=gemini
ENHANCER_API_KEY=your-key
ENHANCER_MODEL=optional-model-name
```

`ENHANCER_PROVIDER` is one of `gemini`, `openai`, `anthropic`, `openrouter`, `groq`, `mistral`.

## Project structure

```
index.html          The whole app: interface, rules, and enhancement logic
test/               Offline tests and live model tests
docs/DESIGN.md      Architecture and design decisions
```
