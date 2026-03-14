## App summary

Build a **local single-page “PNG Pipeline Builder”** for macOS that lets one expert user configure `pngquant`, `oxipng`, and `zopflipng` visually, while always exposing the exact raw flags and the exact terminal command that will run. The app’s purpose is **not** to execute compression itself. It is a **command compiler**: you adjust presets, toggles, sliders, and freeform extra flags; the app then generates a shell-ready command or script block that you copy into Terminal. The pipeline is grounded in what the tools are actually good at: `pngquant` handles the major size drop by quantizing PNGs to more efficient 8-bit palette PNGs, `oxipng` handles lossless optimization and metadata stripping, and Zopfli-based PNG optimization is useful for slow final-pass compression. ([GitHub][1])

---

# Product plan

## 1. Product goal

Create a local power-user utility that:

* builds exact shell commands for PNG compression pipelines
* supports presets plus full manual control
* shows a short plain-English description beside each flag
* allows raw extra flags per tool
* supports single-file and batch workflows
* never hides what command will actually be generated

This app is a **configuration surface** for CLI tools, not a beginner wizard.

---

## 2. Core product principles

### Exactness over friendliness

The generated command must always be a faithful output of the UI state. No hidden defaults beyond those explicitly shown in the interface.

### Presets are starting points, not locked modes

A preset populates values. After any edit, the state becomes custom.

### Structured controls plus raw escape hatch

Most flags should be controlled via inputs, but each tool also needs an `Extra flags` field so unusual flags can still be injected.

### Small descriptions, always visible

Each flag should have a one-line description beside it. Short, functional, impact-focused.

### Copy-first workflow

The main user action is:
configure → inspect → copy → paste into Terminal.

---

## 3. Recommended tech approach

Build this first as a **single local HTML app**:

* `index.html`
* `styles.css`
* `app.js`

No framework needed for v1.

Why this is the right choice:

* fast to build
* trivial to open locally in browser
* easy to port later to Electron or Tauri
* simple state model
* no backend

---

## 4. Toolchain assumptions

The app assumes the user will install and run these separately in Terminal:

* `pngquant`
* `oxipng`
* `zopflipng`

Relevant tool facts to reflect in the UI:

* `pngquant` is lossy and usually does the biggest size reduction by converting 24/32-bit PNGs into a more efficient 8-bit PNG format with alpha. ([GitHub][1])
* `oxipng` is a multithreaded PNG optimizer with optimization levels `-o 0` through `-o 6`, and supports metadata stripping with `--strip`. ([GitHub][2])
* Zopfli-based PNG optimization usually gives a modest additional compression gain at a much higher compute cost. ([GitHub][3])

The UI should not pretend these tools are interchangeable. They each have a role.

---

## 5. Intended user workflow

### Main flow

1. Enter input path and output path
2. Choose pipeline preset
3. Adjust tool settings
4. Optionally add raw extra flags
5. Review exact command
6. Copy command
7. Paste into macOS Terminal

### Common expert flow

1. Load saved profile such as `tiny-icons`
2. Adjust two or three flags
3. Inspect multiline script
4. Copy one-line version instead
5. Run in Terminal
6. Save updated profile

---

## 6. Feature scope for v1

## Required features

### A. Pipeline preset selector

Include:

* Balanced
* Small
* Tiny
* Lossless only
* Custom

Behavior:

* selecting a preset loads all field values
* editing any field changes preset label to something like `Custom (from Tiny)`

### B. Tool enable/disable toggles

Per tool:

* Enable `pngquant`
* Enable `oxipng`
* Enable `zopflipng`

### C. Path inputs

Fields:

* Input path
* Output path
* Temp/intermediate path
* Batch input glob or folder path
* Output suffix

### D. Structured controls for flags

Expose the flags you will actually use often.

### E. Per-tool “Extra flags” field

Freeform text appended to that tool’s generated arguments.

### F. Command preview

Three output modes:

* Multiline subshell
* One-line shell command
* Script block with variables

### G. Copy buttons

Buttons for:

* Copy command
* Copy one-line
* Copy script block

### H. Local profile save/load

Use `localStorage`.

### I. Short inline descriptions for flags

Every surfaced flag gets a concise one-line description.

---

## 7. Feature scope for v2

Not needed for first build, but useful later:

* command history
* compare two profiles
* diff from preset
* estimated visual risk labels
* keep/delete intermediate file toggle
* multiple named temp stages
* drag-and-drop file path filling
* import/export profile JSON
* optional actual execution wrapper via native shell

---

## 8. UI structure

## Overall layout

Use a **two-column app layout**.

### Left column: controls

Sections in this order:

1. App header
2. Preset / profile controls
3. Paths
4. Pipeline order display
5. `pngquant`
6. `oxipng`
7. `zopflipng`
8. Output mode
9. Global shell options

### Right column: compiled output

Panels or tabs:

* Full command
* Step breakdown
* One-line command
* Script block
* Active flags summary

This structure matters because the right side should feel like a compiled artifact, not documentation.

---

## 9. UI detail by section

## A. Header

Display:

* app name
* short app description
* note that commands are copied into Terminal
* install hint

Example copy:
“Build exact PNG compression commands for `pngquant`, `oxipng`, and `zopflipng`.”

Optional small install note:
`brew install pngquant oxipng zopfli`

---

## B. Preset / profile section

Controls:

* Preset dropdown
* Profile dropdown
* Save profile
* Save as new profile
* Rename profile
* Delete profile

Display current state label:
`Preset: Tiny`
or
`Preset: Custom (from Tiny)`

---

## C. Paths section

Fields:

* Input path
* Output path
* Temp path
* Batch mode toggle
* Batch source field
* Output suffix
* Auto quote paths toggle
* Keep intermediates toggle

The app should default to quoting paths because spaces in macOS paths are common.

---

## D. Pipeline order section

Read-only display:

`pngquant → oxipng → zopflipng`

Do not allow arbitrary reordering in v1. That would create invalid or pointless flows.

---

## E. pngquant section

### Controls to surface

* Enabled
* Quality min
* Quality max
* Speed
* Strip metadata
* Disable dithering (`--nofs`)
* Floyd amount
* Posterize
* Force overwrite
* Skip if larger
* Verbose
* Output path override
* Extra flags

### Short descriptions

* `--quality=min-max` — acceptable visual quality range
* `--speed` — speed vs compression tradeoff
* `--strip` — remove metadata chunks
* `--nofs` — disable dithering
* `--floyd` — adjust dithering strength
* `--posterize` — reduce color precision first
* `--force` — overwrite output
* `--skip-if-larger` — abort if bigger
* `--verbose` — print compression info
* `--output` — set output file path

Ground the section description in actual behavior:
`pngquant` is the main lossy step and often the biggest size reducer because it converts to a more efficient 8-bit PNG format with alpha. ([GitHub][1])

---

## F. oxipng section

### Controls to surface

* Enabled
* Optimization level
* Strip mode (`none`, `safe`, `all`)
* Optimize alpha
* Interlace
* Fix
* Preserve attributes
* Backup
* Verbose
* Extra flags

### Short descriptions

* `-o N` — optimization effort level
* `--strip safe` — remove safe metadata
* `--strip all` — remove all noncritical metadata
* `--alpha` — optimize transparent pixels
* `--interlace` — enable progressive PNG display
* `--fix` — repair minor PNG issues
* `--preserve` — keep timestamps and attrs
* `--backup` — save original as backup
* `--verbose` — print detailed optimizer info

Grounding:
`oxipng` supports optimization levels from `-o 0` to `-o 6` and exposes metadata stripping via `--strip`. ([GitHub][2])

---

## G. zopflipng section

### Controls to surface

* Enabled
* Max mode
* Iterations
* Lossy transparent
* Lossy 8-bit
* Lossy palette
* Verbose
* Extra flags

### Short descriptions

* `-m` — maximize compression effort
* `--iterations=N` — number of compression trials
* `--lossy_transparent` — discard hidden transparent pixel color
* `--lossy_8bit` — convert 16-bit to 8-bit
* `--lossy_palette` — reduce palette precision
* `--verbose` — print optimization details

UI warning:
“Very slow final-pass optimizer. Use when every KB matters.”

Grounding:
Zopfli-style compression is slower but can improve compression slightly over typical zlib/DEFLATE approaches. ([GitHub][3])

---

## H. Output mode section

Radio options:

* Multiline subshell
* One-line chained command
* Script block with variables

Default:
Multiline subshell

---

## I. Global shell options

Controls:

* `set -e`
* auto-quote paths
* cleanup temp file
* echo completion message
* extra shell suffix

Use carefully. Keep shell-level settings visually separate from tool flags.

---

## 10. State model

Use one JS state object.

Example structure:

```js
const state = {
  preset: "tiny",
  presetBase: "tiny",
  profileName: "",
  paths: {
    input: "",
    output: "",
    temp: "",
    batchMode: false,
    batchInput: "",
    outputSuffix: "-compressed",
    autoQuote: true,
    keepIntermediates: false
  },
  tools: {
    pngquant: {
      enabled: true,
      qualityMin: 25,
      qualityMax: 50,
      speed: 1,
      strip: true,
      nofs: false,
      floyd: "",
      posterize: "",
      force: true,
      skipIfLarger: false,
      verbose: false,
      outputOverride: "",
      extraFlags: ""
    },
    oxipng: {
      enabled: true,
      level: 6,
      stripMode: "all",
      alpha: true,
      interlace: false,
      fix: false,
      preserve: false,
      backup: false,
      verbose: false,
      extraFlags: ""
    },
    zopflipng: {
      enabled: false,
      max: true,
      iterations: "",
      lossyTransparent: false,
      lossy8bit: false,
      lossyPalette: false,
      verbose: false,
      extraFlags: ""
    }
  },
  outputMode: "multiline",
  shell: {
    setE: true,
    cleanupTemp: false,
    echoDone: false,
    extraSuffix: ""
  }
};
```

---

## 11. Preset definitions

Create presets as pure state loaders.

### Balanced

* pngquant enabled
* quality 55–75
* speed 3
* strip on
* dithering on
* oxipng enabled
* level 4
* strip all
* alpha on
* zopflipng off

### Small

* pngquant enabled
* quality 40–65
* speed 1
* strip on
* oxipng enabled
* level 6
* strip all
* alpha on
* zopflipng off

### Tiny

* pngquant enabled
* quality 25–50
* speed 1
* strip on
* optional no dithering depending on your taste
* oxipng enabled
* level 6
* strip all
* alpha on
* zopflipng enabled
* max mode on

### Lossless only

* pngquant off
* oxipng on
* level 6
* strip all
* alpha on
* zopflipng optional off by default

### Custom

* generated state, never directly selected as a loader

---

## 12. Command generation rules

## General rule

The command preview is generated from structured state every time the state changes.

## Tool order

Always:

1. `pngquant`
2. `oxipng`
3. `zopflipng`

## Flag ordering within each tool

Use a stable order:

1. required base command
2. main optimization flags
3. metadata flags
4. behavior flags
5. output flags
6. extra flags

This stability is important for trust and debugging.

## Extra flags behavior

Append `extraFlags` last for each tool so you can intentionally override earlier generated flags where the CLI allows it.

## Path quoting

Always quote paths when `autoQuote` is on.

---

## 13. Output formats

## A. Multiline subshell

Best default.

Example shape:

```bash
(
set -e
pngquant ...
oxipng ...
zopflipng ...
)
```

## B. One-line chain

Example shape:

```bash
pngquant ... && oxipng ... && zopflipng ...
```

## C. Script block

Example shape:

```bash
IN="..."
OUT="..."
TMP="..."

pngquant ...
oxipng ...
zopflipng ...
```

The script block is probably the most useful expert format because it is easiest to tweak manually.

---

## 14. Profile storage plan

Use `localStorage`.

Structure:

* app settings version
* saved profiles object
* last active profile
* last unsaved working state

Suggested keys:

* `pngPipelineBuilder.profiles`
* `pngPipelineBuilder.currentProfile`
* `pngPipelineBuilder.workingState`

Behavior:

* autosave working state on change
* allow explicit save as named profile
* allow overwrite profile
* confirm before delete

---

## 15. UX details that matter

## Flag descriptions

Each visible flag gets a short always-visible line of helper text.

Pattern:
`flag → control → description`

Descriptions should be:

* under about 8–12 words
* direct
* about outcome, not implementation

## Section notes

At the top of each tool section, include one short line:

* `pngquant` — “Main lossy size-reduction step.”
* `oxipng` — “Lossless cleanup and metadata stripping.”
* `zopflipng` — “Slow final-pass compressor.”

## Active flags summary

Show a small read-only panel like:

```text
pngquant:
--quality=25-50 --speed=1 --strip --force

oxipng:
-o 6 --strip all --alpha

zopflipng:
-m
```

This is very useful for debugging.

---

## 16. Edge cases to handle

### Missing input path

Disable copy or show inline warning.

### Invalid quality range

Ensure min ≤ max.

### Output equals input

Allow only when tool behavior supports it safely, otherwise warn.

### Temp path collisions

Warn if temp and output are identical.

### Batch mode with non-batch-safe output

Warn if output path strategy is ambiguous.

### Extra flags duplication

Do not block. This is a power-user app. Let the user override.

### Disabled tools

Omit them entirely from generated command.

### No tools enabled

Show “No pipeline steps enabled.”

---

## 17. Command generation pseudocode

```text
onStateChange:
  validate state
  compile each enabled tool into args array
  compile paths
  compile shell wrapper
  generate:
    multilineCommand
    oneLineCommand
    scriptBlock
    activeFlagsSummary
  render outputs
  autosave working state
```

### Tool compiler approach

For each tool:

* start with command name
* append flags based on structured values
* append extra flags string
* resolve input and output references
* return complete command string

This should be modular:

* `buildPngquantCommand(state)`
* `buildOxipngCommand(state)`
* `buildZopfliCommand(state)`
* `buildShellOutputs(state)`

---

## 18. File structure recommendation

```text
/png-pipeline-builder
  index.html
  styles.css
  app.js
  /data
    presets.js   (optional)
    flagMeta.js  (optional)
```

If you want cleaner organization:

```text
/app
  state.js
  presets.js
  commands.js
  storage.js
  ui.js
  descriptions.js
```

But for speed, one `app.js` is fine first.

---

## 19. Suggested implementation order

### Phase 1

* static layout
* sections
* basic styling

### Phase 2

* state object
* input binding
* live update loop

### Phase 3

* preset loading
* command generation
* copy buttons

### Phase 4

* per-tool extra flags
* profile save/load
* autosave working state

### Phase 5

* validations
* warnings
* polish

This order keeps the app usable early.

---

## 20. What not to do

* do not try to reverse-parse edited commands back into UI state
* do not expose every obscure CLI flag in v1
* do not support arbitrary tool reordering yet
* do not make the preview “friendly” by omitting real flags
* do not blur tool flags and shell flags in the same inputs

The app becomes fragile when it tries to be too magical.

---

## 21. Final recommendation

Build **v1 as a local single-page HTML/CSS/JS app** with:

* preset-backed state
* full visible core controls
* per-tool raw extra flags
* short descriptions beside each flag
* exact compiled command preview
* copy buttons for multiline, one-line, and script formats
* localStorage profiles

That gives you the right balance of speed, transparency, and expert control.

If you want, the next step is for me to turn this plan into a **Codex-ready implementation brief** with:

1. project files,
2. data structures,
3. UI component list,
4. acceptance criteria,
5. step-by-step build tasks.

[1]: https://github.com/kornelski/pngquant?utm_source=chatgpt.com "kornelski/pngquant: Lossy PNG compressor"
[2]: https://github.com/shssoichiro/oxipng/blob/master/README.md?utm_source=chatgpt.com "oxipng/README.md at master"
[3]: https://github.com/hhoy/python-zopflipng?utm_source=chatgpt.com "hhoy/python-zopflipng: Lossless PNG compressor"
