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

The examples are illustrative; exact wording varies from run to run.

## How it works

The whole app is one file, [`index.html`](index.html), hosted on GitHub Pages. There is no server and nothing to install. The page sends your prompt straight from your browser to the Anthropic API and shows the result.

Because there is no server to hold a shared key, **each person uses their own Anthropic API key**, and usage is billed to that key.

## Using the app

1. Open <https://mazhar17.github.io/Prompt-Enhancer/>.
2. The first time, open **API key and model**, paste your Anthropic API key, and click **Save**. Create a key in the [Claude Console](https://platform.claude.com/).
3. Type or paste a prompt in the left box.
4. Click **Enhance prompt** (or press `Ctrl + Enter`).
5. Click **Copy** to copy the result, or **Use as input** to enhance it again.

### Settings

| Setting | Purpose |
|---|---|
| Anthropic API key | Your own key. Kept in your browser only. |
| Model | Claude Opus 5.5 (default, best quality), Claude Sonnet 5.5, or Claude Haiku 5.5 (fastest, lowest cost). |
| Remember the key in this browser | Ticked: the key is saved in this browser for next time. Unticked: the key is kept only until you close or reload the page. Untick it on a shared computer. |
| Forget key | Removes the saved key from this browser. |

## Privacy and security

- Your API key is stored only in your own browser and is sent only to `api.anthropic.com`.
- The page's security policy blocks it from contacting any other address or loading any outside code.
- Prompts are sent to the Anthropic API to be rewritten. The app keeps no history.
- The key is readable by anyone who can use your browser profile, so untick "Remember" on shared computers.
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

Runs the offline suite. It needs no API key and makes no network calls. It covers:

- normal inputs,
- very short and greeting inputs (which must still be sent for improvement),
- multilingual inputs (Bangla, Arabic, Spanish, Japanese, mixed-language, emoji),
- inputs containing instructions meant to override the enhancer's role,
- output clean-up, error handling, and that the page is self-contained.

```bash
npm run test:live
```

Runs the live suite against the real model for the same four categories. It reads `ANTHROPIC_API_KEY` from the environment or from a local `.env` file (ignored by Git), uses a small amount of API credit, and is skipped when no key is set.

## Project structure

```
index.html          The whole app: interface, rules, and enhancement logic
test/               Offline tests and live model tests
docs/DESIGN.md      Architecture and design decisions
```
