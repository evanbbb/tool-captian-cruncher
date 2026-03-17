# Captain Cruncher — Project Overview

## What it is

A static, client-side web tool that compiles optimized shell commands for image compression. The user configures a pipeline of CLI tools through a browser UI, and the app outputs a ready-to-run terminal command. No images are uploaded or processed in the browser.

## Architecture

Pure static HTML/CSS/JS — no framework, no build step, no server. Each tool has its own page and script:

| Format | Page         | Script  | Tools                          |
|--------|------------- |---------|--------------------------------|
| PNG    | `index.html` | `app.js`| pngquant, oxipng, zopflipng    |
| JPEG   | `jpg.html`   | `jpg.js`| jpegoptim, jpegtran            |
| GIF    | `gif.html`   | `gif.js`| ffmpeg, gifski                 |

Shared styling lives in `styles.css`.

## Key Concepts

- **Presets** — predefined configurations (Balanced, Small, Tiny, Lossless) that set sensible defaults for all tools in the pipeline.
- **Tool pipeline** — each tool runs in a defined order; the output of one feeds into the next.
- **Command compilation** — the app assembles a shell script snippet with `set -e`, temp-file management, and cleanup.

## Design Principles

- Zero network activity — everything runs locally in the browser.
- The browser never reads or processes image files; it only builds the command string.
- No dependencies or build tooling required.

Read docs/harness.md for agent workflow instructions.
