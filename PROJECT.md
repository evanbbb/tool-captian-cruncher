# Captain Cruncher — Project Overview

## What it is

A static, client-side web toolset for local image work. The PNG, JPEG, and GIF pages compile optimized shell commands for compression pipelines, while the contrast page samples uploaded images in-browser to report accessibility scores.

## Architecture

Pure static HTML/CSS/JS — no framework, no build step, no server. Each tool has its own page and script:

| Format   | Page            | Script        | Tools / Behavior                        |
|----------|-----------------|---------------|-----------------------------------------|
| PNG      | `index.html`    | `app.js`      | pngquant, oxipng, zopflipng             |
| JPEG     | `jpg.html`      | `jpg.js`      | jpegoptim, jpegtran                     |
| GIF      | `gif.html`      | `gif.js`      | ffmpeg, gifski                          |
| Contrast | `contrast.html` | `contrast.js` | Local 3×3 color sampling, WCAG, APCA    |

Shared styling lives in `styles.css`.

## Key Concepts

- **Presets** — predefined configurations (Balanced, Small, Tiny, Lossless) that set sensible defaults for all tools in the pipeline.
- **Tool pipeline** — each tool runs in a defined order; the output of one feeds into the next.
- **Command compilation** — the app assembles a shell script snippet with `set -e`, temp-file management, and cleanup.
- **Local contrast sampling** — the contrast page reads uploaded image pixels via canvas, samples foreground/background colors from 3×3 median regions, and computes accessibility scores.

## Design Principles

- No user files leave the browser; command generation and contrast sampling both stay local.
- The command-builder pages never read or process local files; they only build command strings from pasted paths.
- The contrast page is the explicit exception: it reads uploaded image pixels locally in-browser and does not upload them anywhere.
- No local build tooling or server required.

Read docs/harness.md for agent workflow instructions.
