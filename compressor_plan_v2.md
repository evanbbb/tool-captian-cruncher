## App summary

Build a local single-page **PNG Pipeline Builder** for macOS that generates exact shell commands for `pngquant`, `oxipng`, and `zopflipng`.

This is a **command compiler**, not an execution wrapper. The user supplies one PNG file path as text, adjusts the pipeline visually, inspects the exact shell output, then copies it into Terminal.

The revised v2 plan is intentionally narrow: **single-file only**. The app runs fully in the browser, keeps its working state in browser memory for the current session, and assumes the user wants to work on one PNG at a time and run the copied command manually from Terminal.

---

# Product plan

## 1. Product goal

Create a local expert utility that:

* builds exact shell commands for PNG compression pipelines
* exposes the real flags that will run
* supports presets plus manual control
* supports a single-file workflow only
* allows per-tool raw extra flags
* makes lossy vs lossless behavior explicit
* keeps app state in browser memory only for v1
* never executes commands itself

The app is for one expert user who already works in Terminal.

---

## 2. Non-goals for v1

Do not include these in the first build:

* actual command execution
* drag-and-drop path detection
* arbitrary shell expressions as path inputs
* batch processing
* profile persistence
* arbitrary tool reordering
* reverse-parsing edited commands back into state
* import/export profile files

These features either complicate command correctness or can wait until the compiler model is proven.

---

## 3. Core product principles

### Exactness over convenience

The generated command must be a faithful representation of visible UI state.

### Constrained inputs beat ambiguous power

Do not accept freeform path behavior where the compiler cannot safely predict shell output.

### Presets are starting points

Selecting a preset populates fields. Any subsequent edit makes the state custom.

### Structured controls plus raw escape hatch

Expose the common flags directly, and provide `Extra flags` for each tool.

### Browser-local state only

The app should not upload, inspect, or retain file contents. It only holds UI state in browser memory during the current session.

### Lossy behavior must be labeled clearly

`pngquant` is lossy. `oxipng --alpha` is technically lossy. `zopflipng --lossy_transparent` and `--lossy_8bit` are lossy. The UI must say so.

### The compiled artifact is the product

The right side of the app should feel like a build output, not a tutorial.

---

## 4. Recommended tech approach

Build v1 as a local static app:

* `index.html`
* `styles.css`
* `app.js`

No framework is needed for the first version.

Why:

* fast to build
* trivial to open locally
* no backend
* easy to port later
* state model is small enough for plain JS

---

## 5. Verified tool roles

The app assumes the user installs these separately:

* `pngquant`
* `oxipng`
* `zopflipng`

Tool roles:

* `pngquant` is the main lossy size-reduction step
* `oxipng` is the main lossless cleanup and metadata step
* `zopflipng` is a slow final-pass optimizer when squeezing the last few KB matters

The UI should reflect that these tools are complementary, not interchangeable.

---

## 6. Supported workflow

v1 supports exactly one operating mode: single-file command generation.

One input PNG becomes one output PNG in the same directory.

Fields:

* Input file
* Output suffix

Rules:

* `Input file` must be an explicit literal path
* `Output suffix` defaults to `-compressed`
* the compiler derives the output path from the input directory and basename
* no arbitrary shell expressions in the path fields

---

## 7. Path and shell model

## Literal paths

Literal paths are always shell-escaped by the compiler.

There is no `autoQuote` toggle in v1. Correct shell escaping is part of the compiler's job.

## Derived output path

The compiler derives the output file path from the input path and suffix.

Example:

* input: `/Users/evanboehm/Desktop/icon.png`
* suffix: `-compressed`
* output: `/Users/evanboehm/Desktop/icon-compressed.png`

## Intermediate files

The compiler owns intermediate stage paths.

If multiple tools are enabled, the generated command may use deterministic temp files such as:

* `${TMP_DIR}/${STEM}.stage1.png`
* `${TMP_DIR}/${STEM}.stage2.png`

These are runtime artifacts created automatically by the copied shell command. The user does not supply them to the app and does not configure them in the UI.

Preferred v1 behavior:

* use `mktemp` in the generated command
* clean up temp files automatically unless the user edits the copied command

## In-place overwrite

Do not support source-file overwrite in v1.

Reasons:

* it complicates safe multi-step pipelines
* behavior differs across tools
* it makes validation and recovery harder

Users can still edit the copied command manually if they want in-place behavior.

---

## 8. High-level user workflow

1. Enter the input file path
2. Confirm or edit the output suffix
3. Choose preset
4. Adjust tool settings
5. Review compiled command
6. Copy script or one-line output
7. Paste into Terminal

---

## 9. V1 feature scope

## Required features

### A. Preset selector

Include:

* Balanced
* Small
* Tiny
* Lossless only

Display current state as:

* `Preset: Tiny`
* `Preset: Custom (from Tiny)`

`Custom` is a derived state label, not a selectable preset loader.

### B. Path inputs

Include:

* Input file
* Output suffix

The app should show the derived output path as a read-only field or preview line.

### C. Tool enable toggles

Per tool:

* Enable `pngquant`
* Enable `oxipng`
* Enable `zopflipng`

### D. Structured tool controls

Expose only commonly used verified flags.

### E. Per-tool `Extra flags`

Freeform text appended last for that tool.

### F. Output panels

Show:

* Script block
* One-line command
* Step breakdown
* Active flags summary

### G. Copy buttons

Buttons for:

* Copy script block
* Copy one-line command

### H. Session-only state

Keep the current working state in browser memory only.

If the page reloads, the state resets in v1.

### I. Inline descriptions

Every surfaced flag gets a short one-line description.

### J. Validation and warning panel

Show blocking errors and non-blocking warnings clearly.

---

## 10. UI structure

Use a two-column layout.

### Left column

Sections:

1. Header
2. Preset
3. Paths
4. Pipeline order
5. `pngquant`
6. `oxipng`
7. `zopflipng`
8. Shell options
9. Validation summary

### Right column

Panels:

* Script block
* One-line output
* Step breakdown
* Active flags summary

The right side should look like a compiler output surface.

---

## 11. Tool sections and supported controls

Only include controls that map cleanly to the current CLI.

## A. pngquant

Section note:
`Main lossy size-reduction step.`

Controls:

* Enabled
* Quality min
* Quality max
* Speed
* Strip metadata
* Disable dithering
* Floyd amount
* Posterize
* Skip if larger
* Verbose
* Extra flags

Descriptions:

* `--quality=min-max` - acceptable visual quality range
* `--speed` - speed vs compression tradeoff
* `--strip` - remove optional metadata chunks
* `--nofs` - disable dithering
* `--floyd=...` - set dithering strength
* `--posterize` - reduce color precision first
* `--skip-if-larger` - do not write worse result
* `--verbose` - print compression details

Notes:

* do not expose per-tool output override in v1
* do not expose raw `--ext` directly in v1 UI
* compiler uses `--output` because it is clearer in generated single-file steps

## B. oxipng

Section note:
`Lossless cleanup and metadata stripping.`

Controls:

* Enabled
* Optimization level
* Strip mode
* Optimize alpha
* Interlace mode
* Fix
* Preserve file attributes
* Force output even if larger
* Verbose
* Extra flags

Descriptions:

* `-o N` - optimization effort level
* `--strip safe` - remove safely removable metadata
* `--strip all` - remove all non-critical metadata
* `--alpha` - better compression for transparent pixels, technically lossy
* `--interlace off|on|keep` - control PNG interlacing
* `--fix` - allow repair of some invalid PNG data
* `--preserve` - keep timestamps and permissions
* `--force` - write output even if larger
* `--verbose` - print detailed optimizer output

Rules:

* `Interlace mode` is an enum, not a boolean
* do not expose nonexistent `Backup`
* do not expose `--zopfli` in v1 because a dedicated `zopflipng` step already exists

## C. zopflipng

Section note:
`Slow final-pass compressor.`

Controls:

* Enabled
* Max mode
* Iterations
* Lossy transparent
* Lossy 8-bit
* Verbose
* Extra flags

Descriptions:

* `-m` - increase compression effort
* `--iterations=N` - number of optimization iterations
* `--lossy_transparent` - remove hidden transparent pixel colors
* `--lossy_8bit` - reduce 16-bit channels to 8-bit
* `--verbose` - print optimization details

Rules:

* do not expose nonexistent `--lossy_palette`
* show a visible warning that this step is slow

---

## 12. Pipeline order

The order is fixed in v1:

1. `pngquant`
2. `oxipng`
3. `zopflipng`

Do not allow reordering.

This order matches the normal workflow:

* lossy palette reduction first
* then lossless cleanup
* then optional slow final pass

---

## 13. Shell options

Keep shell-level controls small and explicit.

Controls:

* `set -e`
* cleanup temp files
* echo completion message

Do not include:

* auto-quote toggle
* arbitrary shell suffix field

Those add complexity without improving correctness.

---

## 14. Preset definitions

Presets are pure state loaders.

### Balanced

* pngquant enabled
* quality `55-75`
* speed `3`
* strip on
* dithering on
* oxipng enabled
* level `4`
* strip `safe`
* alpha off
* interlace `off`
* zopflipng off

### Small

* pngquant enabled
* quality `40-65`
* speed `2`
* strip on
* oxipng enabled
* level `6`
* strip `all`
* alpha off
* interlace `off`
* zopflipng off

### Tiny

* pngquant enabled
* quality `25-50`
* speed `1`
* strip on
* optional no dithering off by default
* oxipng enabled
* level `6`
* strip `all`
* alpha on
* interlace `off`
* zopflipng enabled
* max mode on

### Lossless only

* pngquant off
* oxipng on
* level `6`
* strip `safe`
* alpha off
* interlace `off`
* zopflipng off

Notes:

* `Lossless only` must not enable technically lossy flags
* `Tiny` is explicitly not lossless

---

## 15. State model

Use one JS state object.

Example shape:

```js
const state = {
  preset: "balanced",
  presetBase: "balanced",
  paths: {
    inputFile: "",
    outputSuffix: "-compressed"
  },
  tools: {
    pngquant: {
      enabled: true,
      qualityMin: 55,
      qualityMax: 75,
      speed: 3,
      strip: true,
      nofs: false,
      floyd: "",
      posterize: "",
      skipIfLarger: true,
      verbose: false,
      extraFlags: ""
    },
    oxipng: {
      enabled: true,
      level: 4,
      stripMode: "safe",
      alpha: false,
      interlace: "off",
      fix: false,
      preserve: false,
      force: false,
      verbose: false,
      extraFlags: ""
    },
    zopflipng: {
      enabled: false,
      max: false,
      iterations: "",
      lossyTransparent: false,
      lossy8bit: false,
      verbose: false,
      extraFlags: ""
    }
  },
  shell: {
    setE: true,
    cleanupTemp: true,
    echoDone: false
  }
};
```

---

## 16. Command generation model

The command preview is generated from structured state on every change.

## Compiler architecture

Use modular builders:

* `buildRuntimeContext(state)`
* `buildPngquantArgs(state, refs)`
* `buildOxipngArgs(state, refs)`
* `buildZopfliArgs(state, refs)`
* `buildScriptBlock(state)`
* `buildOneLineOutput(state)`
* `buildActiveFlagsSummary(state)`

## Runtime references

The compiler should first derive a normalized set of per-step file references.

Single-file example:

* source = input file
* stem = basename without extension
* dir = source directory
* stage1 = temp file if needed
* stage2 = temp file if needed
* final = `${DIR}/${STEM}${SUFFIX}.png`

## Tool rules

For each enabled tool:

1. start with command name
2. append structured flags in stable order
3. append extra flags last
4. append input/output references appropriate to that tool

## Stable flag order

Within each tool:

1. base command
2. core optimization flags
3. metadata flags
4. transformation flags
5. behavior flags
6. verbosity flags
7. extra flags
8. input/output refs

## Extra flags

Append extra flags last so the user can intentionally override earlier generated options where the CLI allows it.

---

## 17. Generated output shapes

## A. Script block

This is the default output mode.

Shape:

```bash
set -e

IN="..."
OUT="..."
SUFFIX="-compressed"

pngquant ...
oxipng ...
zopflipng ...

rm -f ...
```

If more than one tool is enabled, the script also creates temporary stage files automatically with `mktemp` before running the pipeline.

## B. One-line output

Provide a compact one-line version of the same logic.

## C. Step breakdown

Show each enabled tool step separately with resolved input and output refs.

## D. Active flags summary

Example:

```text
pngquant:
--quality=40-65 --speed=2 --strip --skip-if-larger

oxipng:
-o 6 --strip all

zopflipng:
(disabled)
```

---

## 18. Validation and warnings

## Blocking validations

* no tools enabled
* missing required input path(s)
* invalid quality range
* empty output suffix
* derived output path equals input path

When blocking validation exists:

* copy buttons are disabled
* command panels show the validation error instead of fake output

## Non-blocking warnings

* `oxipng --alpha` is technically lossy
* `zopflipng` enabled may be very slow
* extra flags may duplicate structured flags
* output file may already exist

---

## 19. State lifetime

For v1, state lives only in browser memory during the current session.

Behavior:

* changing inputs updates the in-memory state immediately
* reloading the page resets the app
* no browser persistence is required

This keeps the first version aligned with the "browser and local memory only" constraint.

---

## 20. File structure recommendation

For v1 speed:

```text
/png-pipeline-builder
  index.html
  styles.css
  app.js
```

If code starts getting crowded, split into:

```text
/app
  state.js
  presets.js
  commands.js
  storage.js
  validation.js
  ui.js
```

---

## 21. Implementation order

### Phase 1

* static two-column layout
* sections and basic visual hierarchy

### Phase 2

* state object
* field binding
* preset loading
* custom-state detection

### Phase 3

* single-file compiler
* step breakdown
* script block and one-line output

### Phase 4

* deterministic temp-path generation
* active flags summary

### Phase 5

* validation and warnings
* copy buttons
* session-state cleanup

### Phase 6

* polish
* text cleanup
* edge-case testing

---

## 22. Acceptance criteria

The v1 build is acceptable when all of the following are true:

* selecting any preset loads a complete valid state
* editing any controlled value changes the display to `Custom (from X)`
* the app generates exact commands for any enabled subset of the three tools
* all surfaced controls map to current real CLI flags
* invalid states never produce misleading commands
* copy buttons place the exact visible output on the clipboard
* reloading the page resets the app to its default state
* lossy controls are labeled clearly in the UI

---

## 23. Test matrix to design against

Before implementation is considered complete, verify command generation for:

* single-file `pngquant` only
* single-file `oxipng` only
* single-file `zopflipng` only
* single-file `pngquant -> oxipng`
* single-file `pngquant -> oxipng -> zopflipng`
* lossless-only preset
* no-tools-enabled validation
* invalid quality range

---

## 24. What not to do

* do not accept raw full-shell path expressions in v1
* do not expose stale or nonexistent flags
* do not support in-place overwrite in v1
* do not mix shell options and tool flags in one section
* do not generate "friendly" output that hides real flags
* do not allow the UI to imply lossless behavior when lossy flags are active

---

## 25. Final recommendation

Build v1 as a static local app with:

* a single explicit input-file workflow
* constrained and compiler-safe path inputs
* verified tool controls only
* clear lossy/lossless labeling
* exact generated script output
* automatic runtime temp-file handling when needed
* browser-memory-only app state

That gives you a version that is narrower than the original v1 plan, but much more likely to produce commands that are actually trustworthy.

---

## References

Verified against official project docs and source on March 14, 2026:

* `pngquant`: https://github.com/kornelski/pngquant
* `oxipng`: https://github.com/oxipng/oxipng
* `oxipng` manual: https://github.com/oxipng/oxipng/blob/master/MANUAL.txt
* `zopflipng` source/help: https://github.com/google/zopfli/blob/master/src/zopflipng/zopflipng_bin.cc
