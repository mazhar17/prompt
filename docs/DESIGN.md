# Design notes

## Architecture

The app is a single static file, `index.html`, served by GitHub Pages. It has no server, no build step, no dependencies, and makes no network requests. It holds three parts:

| Part | Where | Responsibility |
|---|---|---|
| Interface | HTML and `<style>` | Request box, task chips, optional details, output box. |
| Core | `<script id="core">` | The task table, automatic task selection, and the function that builds the prompt. No page access. |
| Page behaviour | second `<script>` | Buttons, chips, live updates, copy and save. Calls the core. |

Keeping the core in its own block with no page access lets the tests load that block from `index.html` and run it in Node.js, so the tested code and the shipped code are the same.

## Flow from input to output

1. The user writes a request, or clicks an example.
2. **Choose the task.** As the user types, the page guesses the task from keywords in the request. A click on a task chip overrides the guess and is kept until "Start over".
3. **Build.** The prompt is assembled from fixed sections: Role, Context (only if details were chosen), Request (the user's words, unchanged), What to produce, and Rules.
4. **Show.** The result appears in the output box. After the first result, any change to the request or options rebuilds it immediately.

## Design decisions

**Templates instead of an AI service.** Versions 2.x sent the request to an AI service using each user's own API key. In practice that failed too often for non-technical users: keys had to be created, model names changed, and free services were overloaded or out of quota. Version 3 builds the prompt from templates in the browser, so it is instant, free, and cannot fail for reasons outside the page. The cost is that the app no longer rewrites the user's sentences or corrects grammar. That work is left to the AI tool that receives the prompt, which handles rough wording well once the surrounding structure is clear.

**The request is never changed.** Only outer whitespace is trimmed. Names, numbers, dates, code and non-English text pass through exactly, so the app cannot alter the user's meaning. The request is placed between triple-quote lines, with the fixed Role before it and the fixed Rules after it, so text inside the request cannot replace them.

**One screen, three steps.** The interface is a single page with numbered steps and no tabs or settings. The task is chosen automatically so that the shortest path is: type, click the button, copy. Teaching-only options (student level, Bloom's level, OBE alignment) are hidden for tasks where they do not apply.

**Options add lines only when chosen.** "Not specified" adds nothing, so the prompt never states a student level or Bloom's level the user did not pick. Option values are checked against the built-in lists before use.

**Rules guard against invented content.** Every prompt tells the AI to keep the request's facts, to mark missing information with [square brackets] instead of inventing it, and to reply in the request's language.

**Nothing leaves the browser.** The Content-Security-Policy is `default-src 'none'` with only inline script and style allowed, so the page cannot contact any address or load outside code. Nothing is written to browser storage. A test checks both.

**Look and feel.** Navy and gold header, card layout and dark output box, following the department's existing prompt tool so the two feel related.

## Testing approach

`npm test` loads the core block from `index.html` and checks:

- normal requests, for every task,
- very short and greeting inputs,
- multilingual inputs (Bangla, Arabic, Spanish, Japanese, mixed-language, emoji),
- requests containing instructions or markup meant to displace the fixed sections,
- options, including unknown values,
- automatic task selection and the built-in examples,
- that the version matches `package.json`, and that the page is self-contained with no network or storage use.

Screen behaviour (chips, live updates, copy, start over) was checked by hand in a browser.
