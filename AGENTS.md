# Agent Instructions

## Writing files
Before writing a file, verify that you have not already written it. Do not repeat the exact content back to the user, unless explicitely asked for, and even then, consider using `cat` from the command line.



## Project

This is a simple static website.

The technology stack is:

- HTML
- CSS
- TypeScript
- Vite
- Playwright

Do not introduce React, Vue, Svelte, Angular, Tailwind, Bootstrap, or
other frontend frameworks unless the user explicitly asks for one.

Prefer simple browser APIs and ordinary HTML/CSS.

## Version control
The project uses `git` as version control. Commit frequently.

## Project structure

- `index.html` contains the page structure.
- `src/main.ts` contains application behavior.
- `src/style.css` contains styles.
- `tests/` contains Playwright browser tests.

Keep this structure unless there is a clear reason to change it.

## TypeScript

Use TypeScript rather than JavaScript.

Keep types simple and useful.

Do not use complicated type-level programming.

Prefer readable code over clever abstractions.

## HTML

Use semantic HTML.

Prefer:

- `header`
- `nav`
- `main`
- `section`
- `article`
- `footer`
- `button`
- `a`

Use accessible labels and meaningful element names.

Do not use clickable `div` elements when a button or link is appropriate.

## CSS

Use ordinary CSS.

Do not add a CSS framework.

Prefer:

- CSS custom properties
- flexbox
- grid
- media queries
- modern responsive CSS

Keep styles in `src/style.css` unless there is a good reason to split them.

## Dependencies

Do not add npm dependencies unless they are genuinely necessary.

Do not replace the existing tooling.

Do not modify package.json, ESLint, Stylelint, Prettier, TypeScript,
or Playwright configuration unless necessary.

## Validation

Before considering a task complete, run:

    npm run check

All checks must pass.

The check includes:

- Prettier
- ESLint
- Stylelint
- TypeScript
- Vite production build
- Playwright

If a check fails, fix the problem and run the check again.

Do not simply report that a check failed.


### Fixing validation
If any linting or testing fails, fix the code rather than editing the linter configuration or tests.
Additionally, don't exclude file from linting or testing with some ignore file or some configuration comment, unless stated by the user


## Browser testing

When changing interactive behavior, add or update a Playwright test.

When changing important UI behavior, verify it in a real browser.

Do not claim that a UI feature works without testing it when browser
testing is practical.

## Completion

A task is complete only when:

1. The requested functionality is implemented.
2. `npm run check` passes.
3. Relevant browser behavior has been tested.
4. No unnecessary dependencies or frameworks were introduced.
