# Prompt Enhancer

**Open the app: <https://mazhar17.github.io/prompt/>**

Prompt Enhancer turns a rough request into a clear, well-structured prompt that you can paste into ChatGPT, Gemini, Claude or any other AI tool. It is made for university teachers.

It needs no account, no API key and no internet connection once the page is open. The result appears instantly.

## Using the app

1. **Write what you want**, in any language and as roughly as you like. Or click one of the **Try** examples.
2. **Check what it is for.** The page picks a task from your words as you type (for example, "rubric" selects *Rubric*). Click another task to change it.
3. **Add details if you wish.** For teaching tasks you can set the student level, the thinking level (Bloom's taxonomy), and whether to align with OBE / BAETE accreditation.
4. Click **Enhance my prompt**.
5. Click **Copy** and paste the prompt into your AI tool. Replace anything in [square brackets] with your own details first.

After the first result, changing your text or any option updates the prompt straight away. **Save** downloads it as a text file, and **Start over** clears everything.

## What the enhanced prompt contains

| Section | Content |
|---|---|
| Role | Who the AI should act as, chosen by task (for example, a course teacher and examiner). |
| Context | Student level, thinking level and the OBE standard, when you chose them. |
| Request | Your own words, exactly as you wrote them. |
| What to produce | The parts a good answer needs for that task (for example, marks, model answer and marking scheme for exam questions). |
| Rules | Follow the request exactly, do not invent facts or references, and reply in the same language as the request. |

### Tasks

General, Exam questions, Course outcomes (CLOs), Rubric, Lesson plan, Quality report (CQI), Research writing, Student feedback, Email or notice.

## What it does not do

The app does not use an AI model, so it does not rewrite your sentences or correct grammar and spelling. It wraps your request, unchanged, in the structure that helps an AI tool answer it well. The AI tool you paste the prompt into will understand your wording even if it is rough.

## Privacy

Everything happens in your browser. Nothing you type is sent to any server or stored anywhere, and the page's security policy blocks it from contacting any address at all.

## Run it locally

Download `index.html` and open it in a browser. It works the same way from your own disk, with no internet connection.

## Host your own copy

1. Fork this repository, or copy `index.html` into a repository of your own.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute the page is live at `https://<your-username>.github.io/<repository-name>/`.

## Changing the wording

The tasks, their roles and their "what to produce" lists are in the `TASKS` table near the bottom of `index.html`. The student levels, Bloom's levels and examples are in the lists just below it. Edit the text there to suit your department.

## Tests

The tests need [Node.js](https://nodejs.org/) 22 or newer and no other installation. They load the logic directly out of `index.html`, so they exercise exactly the code the page runs.

```bash
npm test
```

They cover normal requests, very short and greeting inputs, multilingual inputs, requests that contain instructions or markup, every task and option, automatic task selection, and that the page is self-contained.

## Versions

The version number is shown beside the title (for example `v3.0.0`), so you can tell which copy of the page you are using. After an update is published, reload with **Ctrl + F5** and check that the number has changed.

When changing the app, update `VERSION` in `index.html` and `version` in `package.json` together; a test fails if they differ.

| Version | Change |
|---|---|
| 3.0.0 | Redesigned as an instant, template-based enhancer with no AI service or API key. |
| 2.x | Rewrote prompts using an AI service (Gemini, OpenAI, Claude and others) with the user's own API key. Available in the Git history. |

## Project structure

```
index.html          The whole app: interface, task table, and prompt-building logic
test/               Tests
docs/DESIGN.md      Architecture and design decisions
```
