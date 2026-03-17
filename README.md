# Captain Cruncher

A static browser app for local image workflows. The PNG, JPEG, and GIF pages generate terminal commands for compression pipelines, the Contrast page samples uploaded images locally for accessibility scoring, and the How To page explains the macOS setup flow.

## Pages

- **PNG Builder** — pngquant, oxipng, zopflipng command builder
- **JPEG Builder** — jpegoptim, jpegtran command builder
- **GIF Builder** — ffmpeg, gifski command builder
- **Contrast** — local foreground/background sampling with WCAG and APCA scoring
- **How To** — macOS install and terminal workflow guide

## Prerequisites

Install the CLI tools separately:

```sh
brew install pngquant oxipng zopfli jpegoptim jpeg-turbo ffmpeg gifski
```

## Usage

Open `index.html`, `jpg.html`, `gif.html`, `contrast.html`, or `how-to.html` in any modern browser. No build step or server required.

For the command-builder pages:

1. Paste a source file path
2. Choose a preset when available or adjust the step-level settings
3. Copy the generated one-line command
4. Run it in Terminal

For the contrast page:

1. Drop or choose a local image
2. Click `Pick Foreground` or `Pick Background`
3. Hover the image to inspect the live 3×3 sample
4. Click to lock each sample and review WCAG 2.x and APCA scores

For the How To page:

1. Install Homebrew and the required CLI tools
2. Copy a pathname from Finder
3. Change into the source folder in Terminal
4. Paste and run the generated command

## Project Structure

```
index.html                  — PNG pipeline builder UI
jpg.html                    — JPEG pipeline builder UI
gif.html                    — GIF builder UI
contrast.html               — Contrast accessibility sampler UI
how-to.html                 — macOS setup and usage guide
css/styles.css              — Shared styles
js/png.js                   — PNG pipeline logic and command generation
js/jpg.js                   — JPEG pipeline logic and command generation
js/gif.js                   — GIF command generation logic
js/contrast.js              — Contrast image sampling and scoring logic
assets/icons/favicon.svg    — Shared favicon asset
assets/images/cruncher.png  — Sidebar mascot image
```
