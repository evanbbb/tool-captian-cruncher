# Captain Cruncher

A browser-based set of local image utilities. Most pages build image-compression terminal commands from pasted file paths, and the contrast page samples uploaded images locally in-browser for accessibility scoring.

## Formats

- **PNG** — pngquant, oxipng, zopflipng
- **JPEG** — jpegoptim, jpegtran
- **GIF** — ffmpeg, gifski
- **Contrast** — local foreground/background sampling with WCAG and APCA scoring

## Prerequisites

Install the CLI tools separately:

```sh
brew install pngquant oxipng zopfli jpegoptim jpeg-turbo ffmpeg gifski
```

## Usage

Open `index.html` (PNG), `jpg.html` (JPEG), `gif.html` (GIF), or `contrast.html` (Contrast) in any modern browser. No build step or server required.

1. Paste a source file path
2. Choose a preset when available or adjust individual tool settings
3. Copy the generated shell command
4. Run it in your terminal

For the contrast tool:

1. Upload or drop a local image
2. Pick one foreground point and one background point
3. Review WCAG 2.x and APCA scores

## Project Structure

```
index.html    — PNG pipeline builder UI
app.js        — PNG pipeline logic and command generation
jpg.html      — JPEG pipeline builder UI
jpg.js        — JPEG pipeline logic and command generation
gif.html      — GIF builder UI
gif.js        — GIF command generation logic
contrast.html — Contrast accessibility sampler UI
contrast.js   — Contrast image sampling and scoring logic
styles.css    — Shared styles
```
