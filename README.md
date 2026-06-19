# Captain Cruncher

Captain Cruncher is a static browser app for local image workflows. It builds
ready-to-run compression commands for PNG, JPEG, and GIF files and includes an
in-browser image contrast checker. There is no backend, account, or build step.

## Pages

- **PNG Builder** — pngquant, oxipng, zopflipng command builder
- **JPEG Builder** — jpegoptim, jpegtran command builder
- **GIF Builder** — ffmpeg, gifski command builder
- **Contrast** — local foreground/background sampling with WCAG and APCA scoring
- **How To** — macOS install and terminal workflow guide

## Quick Start

Clone or download the repository, then open `index.html` in a modern browser.
No local server is required.

The generated commands depend on third-party command-line tools. On macOS,
install all supported tools with Homebrew:

```bash
brew install pngquant oxipng zopfli jpegoptim jpeg-turbo ffmpeg gifski
```

## Usage

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

## Privacy

- PNG, JPEG, and GIF builders only use the file paths you type to generate shell
  commands. They do not open or upload the files.
- The Contrast tool reads the selected image locally with the browser's Canvas
  API. The image never leaves the browser.
- The app has no analytics or backend. It loads its font and icon library from
  third-party CDNs.

## Development

The project is plain HTML, CSS, and JavaScript. Edit the source files and reload
the relevant page in your browser. If your browser restricts local `file://`
resources, serve the repository from a local static server instead:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

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
docs/                       — Design, workflow, and project notes
```

Additional architecture details are documented in [PROJECT.md](PROJECT.md).
