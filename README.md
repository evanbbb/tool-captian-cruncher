# Captain Cruncher

A browser-based command builder for image compression pipelines. Paste a file path, tune the settings, and copy the exact terminal command — no files are uploaded or opened by the browser.

## Formats

- **PNG** — pngquant, oxipng, zopflipng
- **JPEG** — jpegoptim, jpegtran
- **GIF** — ffmpeg, gifski

## Prerequisites

Install the CLI tools separately:

```sh
brew install pngquant oxipng zopfli jpegoptim jpeg-turbo ffmpeg gifski
```

## Usage

Open `index.html` (PNG), `jpg.html` (JPEG), or `gif.html` (GIF) in any modern browser. No build step or server required.

1. Paste a source file path
2. Choose a preset when available or adjust individual tool settings
3. Copy the generated shell command
4. Run it in your terminal

## Project Structure

```
index.html   — PNG pipeline builder UI
app.js       — PNG pipeline logic and command generation
jpg.html     — JPEG pipeline builder UI
jpg.js       — JPEG pipeline logic and command generation
gif.html     — GIF builder UI
gif.js       — GIF command generation logic
styles.css   — Shared styles
```
