# Captain Cruncher — Project Overview

## What it is

A static, client-side web toolset for local image work. Most pages compile optimized shell commands for compression pipelines, while the contrast page samples uploaded images in-browser to report accessibility scores and the How To page documents the macOS setup flow.

## Architecture

Pure static HTML/CSS/JS with no framework, build step, or server. The main product pattern is one page plus one script per interactive tool, with shared layout and styling in `css/styles.css`.

| Page Type | Page            | Script        | Behavior                                      |
|-----------|-----------------|---------------|-----------------------------------------------|
| PNG       | `index.html`    | `js/png.js`      | pngquant, oxipng, zopflipng command builder |
| JPEG      | `jpg.html`      | `js/jpg.js`      | jpegoptim, jpegtran command builder         |
| GIF       | `gif.html`      | `js/gif.js`      | ffmpeg, gifski command builder              |
| Contrast  | `contrast.html` | `js/contrast.js` | Local 3×3 color sampling, WCAG, APCA        |
| Guide     | `how-to.html`   | none          | macOS install and terminal usage walkthrough  |

Shared styling lives in `css/styles.css`, and shared image assets now live under `assets/`.

## Key Concepts

- **Presets** — predefined configurations (Balanced, Small, Tiny, Lossless) that set sensible defaults for all tools in the pipeline.
- **Tool pipeline** — each tool runs in a defined order; the output of one feeds into the next.
- **Command compilation** — the app assembles a shell script snippet with `set -e`, temp-file management, and cleanup.
- **Page-per-tool structure** — each major workflow lives on its own static page so UI, validation, and generation logic stay isolated.
- **Local contrast sampling** — the contrast page reads uploaded image pixels via canvas, samples foreground/background colors from 3×3 median regions, shows a live hover sampler, and computes accessibility scores.
- **macOS guide page** — the How To page is static content that explains dependency install, pathname capture, changing folders, and running commands in Terminal.

## Design Principles

- No user files leave the browser; command generation and contrast sampling both stay local.
- The command-builder pages never read or process local files; they only build command strings from pasted paths.
- The contrast page is the explicit exception: it reads uploaded image pixels locally in-browser and does not upload them anywhere.
- No local build tooling or server required.

Read docs/harness.md for agent workflow instructions.
