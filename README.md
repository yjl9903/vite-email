# vite-email

[![version](https://img.shields.io/npm/v/vite-email?color=rgb%2850%2C203%2C86%29&label=vite-email)](https://www.npmjs.com/package/vite-email) [![CI](https://github.com/yjl9903/vite-email/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/vite-email/actions/workflows/ci.yml)

Send emails rendered by Vite and Markdown-It automatically.

<img src="./screenshot.png" alt="screenshot">

## Installation

```bash
npm i -D vite-email
```

You can also install it globally.

```bash
npm i -g vite-email
vmail --version
```

## Usage

Create a new workspace.

```bash
vmail init new-workspace
cd new-workspace
npm install
```

The created workspace contains some config files. `data.csv` stores the list of receivers and corresponding information. The `receiver` column specify the email of the receiver. `email.md` is the email content template to be rendered. You can use `{{ ... }}` to insert variable from `data.csv`.

For [example](https://github.com/yjl9903/vite-email/tree/main/example), here is `data.csv`.

```csv
receiver,       name
bot@github.com, Bot
```

Here is `email.md`.

```md
# Hello {{ name }}
```

Then the following content will be rendered to HTML, and then be sent to `bot@github.com`.

```md
# Hello Bot
```

You can start a dev server to preview the content of emails, or preview the output with `--dry-run`.

```bash
vmail dev
# or
vmail send --dry-run
```

If everything is done, send emails with a single command.

```bash
vmail send
```

## License

MIT License © 2022 [XLor](https://github.com/yjl9903)
