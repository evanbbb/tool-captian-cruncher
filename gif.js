const TOOL_ORDER = ["ffmpeg", "gifski"];
const RUNTIME_TIMESTAMP_SUFFIX = "_$(date +%d%H%M%S)";
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".avi",
  ".mkv",
  ".mpg",
  ".mpeg",
  ".wmv",
  ".m2ts",
  ".mts",
  ".ts",
]);

const DEFAULT_STATE = {
  paths: {
    inputFile: "",
    outputSuffix: RUNTIME_TIMESTAMP_SUFFIX,
  },
  tools: {
    ffmpeg: {
      fps: 15,
      trimStart: 0,
      trimEnd: "",
      extraFlags: "",
    },
    gifski: {
      quality: 90,
      loop: true,
      extraFlags: "",
    },
  },
  shell: {
    setE: true,
    cleanupTemp: true,
    echoDone: false,
  },
};

const FIELD_BINDINGS = [
  { id: "inputFile", path: ["paths", "inputFile"], kind: "text" },
  { id: "outputSuffix", path: ["paths", "outputSuffix"], kind: "text" },
  { id: "gifFps", path: ["tools", "ffmpeg", "fps"], kind: "int" },
  { id: "gifTrimStart", path: ["tools", "ffmpeg", "trimStart"], kind: "floatOrEmpty" },
  { id: "gifTrimEnd", path: ["tools", "ffmpeg", "trimEnd"], kind: "floatOrEmpty" },
  { id: "ffmpegExtraFlags", path: ["tools", "ffmpeg", "extraFlags"], kind: "text" },
  { id: "gifQuality", path: ["tools", "gifski", "quality"], kind: "int" },
  { id: "gifLoop", path: ["tools", "gifski", "loop"], kind: "checkbox" },
  { id: "gifskiExtraFlags", path: ["tools", "gifski", "extraFlags"], kind: "text" },
  { id: "shellSetE", path: ["shell", "setE"], kind: "checkbox" },
  { id: "shellCleanupTemp", path: ["shell", "cleanupTemp"], kind: "checkbox" },
  { id: "shellEchoDone", path: ["shell", "echoDone"], kind: "checkbox" },
];

const dom = {
  derivedOutput: document.getElementById("derivedOutput"),
  validationSummary: document.getElementById("validationSummary"),
  oneLineOutput: document.getElementById("oneLineOutput"),
  stepBreakdown: document.getElementById("stepBreakdown"),
  activeFlags: document.getElementById("activeFlags"),
  copyOneLineButton: document.getElementById("copyOneLineButton"),
  copyBreakdownButton: document.getElementById("copyBreakdownButton"),
  copyFlagsButton: document.getElementById("copyFlagsButton"),
  gifQualityValue: document.getElementById("gifQualityValue"),
  gifFpsValue: document.getElementById("gifFpsValue"),
  gifFpsStat: document.getElementById("gifFpsStat"),
  gifLoopStat: document.getElementById("gifLoopStat"),
  gifTrimStat: document.getElementById("gifTrimStat"),
};

let state = deepClone(DEFAULT_STATE);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAtPath(root, path) {
  return path.reduce((acc, segment) => acc[segment], root);
}

function setAtPath(root, path, value) {
  let cursor = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index]];
  }
  cursor[path[path.length - 1]] = value;
}

function normalizeInputPath(inputPath) {
  const trimmed = inputPath.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const firstCharacter = trimmed[0];
  const lastCharacter = trimmed[trimmed.length - 1];
  if ((firstCharacter === '"' || firstCharacter === "'") && firstCharacter === lastCharacter) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFilePath(inputPath) {
  const normalized = normalizeInputPath(inputPath);
  if (!normalized) {
    return null;
  }

  const slashIndex = normalized.lastIndexOf("/");
  const directory = slashIndex >= 0 ? normalized.slice(0, slashIndex) : "";
  const filename = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const dotIndex = filename.lastIndexOf(".");
  const hasExtension = dotIndex > 0;
  const stem = hasExtension ? filename.slice(0, dotIndex) : filename;
  const extension = hasExtension ? filename.slice(dotIndex) : "";

  return {
    directory,
    filename,
    stem,
    extension,
  };
}

function deriveOutputPath(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return "";
  }

  const outputName = `${parsed.stem}${suffix}.gif`;
  return parsed.directory ? `${parsed.directory}/${outputName}` : outputName;
}

function buildOutputAssignmentLines(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return [];
  }

  if (suffix === RUNTIME_TIMESTAMP_SUFFIX) {
    const outputBase = parsed.directory ? `${parsed.directory}/${parsed.stem}` : parsed.stem;
    return [
      'STAMP="$(date +%d%H%M%S)"',
      `OUT_BASE=${shellQuote(outputBase)}`,
      'OUT="${OUT_BASE}${STAMP}.gif"',
    ];
  }

  return [`OUT=${shellQuote(deriveOutputPath(inputPath, suffix))}`];
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function joinArgs(parts) {
  return parts.filter(Boolean).join(" ");
}

function formatNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(2).replace(/\.?0+$/, "");
}

function normalizedTrimStart(settings) {
  return settings.trimStart === "" ? 0 : Number(settings.trimStart);
}

function buildTrimSummary(settings) {
  const trimStart = normalizedTrimStart(settings);
  if (settings.trimEnd !== "") {
    return `${formatNumber(trimStart)}s to ${formatNumber(settings.trimEnd)}s`;
  }

  if (trimStart > 0) {
    return `From ${formatNumber(trimStart)}s`;
  }

  return "Full source";
}

function addIntegerRangeError(errors, label, value, minimum, maximum) {
  if (value === "") {
    return;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    errors.push(`${label} must be an integer.`);
    return;
  }

  if (value < minimum || value > maximum) {
    errors.push(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function addMinimumError(errors, label, value, minimum) {
  if (value === "") {
    return;
  }

  if (!Number.isFinite(value)) {
    errors.push(`${label} must be a number.`);
    return;
  }

  if (value < minimum) {
    errors.push(`${label} must be at least ${minimum}.`);
  }
}

function buildValidation(currentState, outputPath) {
  const errors = [];
  const warnings = [];
  const normalizedInput = normalizeInputPath(currentState.paths.inputFile);
  const trimmedSuffix = currentState.paths.outputSuffix;
  const parsedInput = parseFilePath(normalizedInput);
  const ffmpegSettings = currentState.tools.ffmpeg;
  const gifskiSettings = currentState.tools.gifski;
  const trimStart = normalizedTrimStart(ffmpegSettings);

  if (!normalizedInput) {
    errors.push("Input file path is required.");
  }

  if (!trimmedSuffix) {
    errors.push("Output suffix cannot be empty.");
  }

  if (trimmedSuffix.includes("/")) {
    errors.push("Output suffix cannot contain path separators.");
  }

  addIntegerRangeError(errors, "gifski quality", gifskiSettings.quality, 1, 100);
  addIntegerRangeError(errors, "ffmpeg fps", ffmpegSettings.fps, 2, 30);
  addMinimumError(errors, "Trim start", ffmpegSettings.trimStart, 0);
  addMinimumError(errors, "Trim end", ffmpegSettings.trimEnd, 0);

  if (ffmpegSettings.trimEnd !== "" && Number(ffmpegSettings.trimEnd) <= trimStart) {
    errors.push("Trim end must be greater than trim start.");
  }

  if (normalizedInput && outputPath && normalizedInput === outputPath) {
    errors.push("Derived output path matches the input path.");
  }

  if (
    parsedInput &&
    parsedInput.extension &&
    !VIDEO_EXTENSIONS.has(parsedInput.extension.toLowerCase())
  ) {
    warnings.push("Input path does not look like a common video file. The command is still generated exactly as typed.");
  }

  if (!currentState.shell.cleanupTemp) {
    warnings.push("Cleanup temp files is disabled, so extracted PNG frames will remain in the temporary directory.");
  }

  if (ffmpegSettings.extraFlags.trim() || gifskiSettings.extraFlags.trim()) {
    warnings.push("Extra flags are appended raw and may override structured controls.");
  }

  return { errors, warnings };
}

function buildRuntimeContext(outputPath) {
  return {
    outputPath,
    steps: [
      {
        toolName: "ffmpeg",
        inputRef: "$IN",
        outputRef: "$FRAMES_DIR/frame%04d.png",
        quotedInputRef: '"$IN"',
        quotedOutputRef: '"$FRAMES_DIR/frame%04d.png"',
      },
      {
        toolName: "gifski",
        inputRef: '"$FRAMES_DIR"/frame*.png',
        outputRef: "$OUT",
        quotedInputRef: '"$FRAMES_DIR"/frame*.png',
        quotedOutputRef: '"$OUT"',
      },
    ],
  };
}

function buildFfmpegFilter(settings) {
  return `scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,fps=${settings.fps}`;
}

function buildFfmpegFlagParts(settings) {
  const parts = [];
  const trimStart = normalizedTrimStart(settings);

  if (trimStart > 0) {
    parts.push("-ss", formatNumber(trimStart));
  }

  parts.push("-i", '"$IN"');

  if (settings.trimEnd !== "") {
    parts.push("-to", formatNumber(settings.trimEnd));
  }

  parts.push("-vf", `"${buildFfmpegFilter(settings)}"`);
  parts.push("-y");

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildFfmpegActiveFlagParts(settings) {
  const parts = [];
  const trimStart = normalizedTrimStart(settings);

  if (trimStart > 0) {
    parts.push("-ss", formatNumber(trimStart));
  }

  if (settings.trimEnd !== "") {
    parts.push("-to", formatNumber(settings.trimEnd));
  }

  parts.push("-vf", `"${buildFfmpegFilter(settings)}"`);
  parts.push("-y");

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildFfmpegCommand(settings, step) {
  return joinArgs(["ffmpeg", ...buildFfmpegFlagParts(settings), step.quotedOutputRef]);
}

function buildGifskiFlagParts(currentState) {
  const ffmpegSettings = currentState.tools.ffmpeg;
  const gifskiSettings = currentState.tools.gifski;

  return [
    "--quality",
    String(gifskiSettings.quality),
    "--fps",
    String(ffmpegSettings.fps),
    "--width",
    "9999",
    "--repeat",
    gifskiSettings.loop ? "0" : "-1",
    gifskiSettings.extraFlags.trim(),
  ];
}

function buildGifskiCommand(currentState, step) {
  return joinArgs([
    "gifski",
    ...buildGifskiFlagParts(currentState),
    "--output",
    step.quotedOutputRef,
    step.quotedInputRef,
  ]);
}

function buildStepCommand(step, currentState) {
  if (step.toolName === "ffmpeg") {
    return buildFfmpegCommand(currentState.tools.ffmpeg, step);
  }

  return buildGifskiCommand(currentState, step);
}

function buildRuntimeLines(currentState, context) {
  const lines = [];

  if (currentState.shell.setE) {
    lines.push("set -e");
    lines.push("");
  }

  lines.push(`IN=${shellQuote(normalizeInputPath(currentState.paths.inputFile))}`);
  buildOutputAssignmentLines(currentState.paths.inputFile, currentState.paths.outputSuffix).forEach((line) => {
    lines.push(line);
  });
  lines.push('TMP_DIR="$(mktemp -d -t gifpipe.XXXXXX)"');
  lines.push('FRAMES_DIR="$TMP_DIR/frames"');
  lines.push('mkdir -p "$FRAMES_DIR"');

  if (currentState.shell.cleanupTemp) {
    lines.push('trap \'rm -rf "$TMP_DIR"\' EXIT');
  }

  lines.push("");

  context.steps.forEach((step) => {
    lines.push(buildStepCommand(step, currentState));
  });

  if (currentState.shell.echoDone) {
    lines.push("");
    lines.push('printf \'%s\\n\' "Wrote $OUT"');
  }

  return lines;
}

function buildOneLineOutput(lines) {
  const trimmedLines = lines.filter(Boolean).map((line) => line.trim());
  if (trimmedLines.length === 0) {
    return "( )";
  }

  return `( ${trimmedLines.join("; ")} )`;
}

function buildStepBreakdown(currentState, context) {
  return context.steps
    .map((step, index) => {
      const lines = [
        `${index + 1}. ${step.toolName}`,
        `in:  ${step.inputRef}`,
        `out: ${step.outputRef}`,
        `cmd: ${buildStepCommand(step, currentState)}`,
      ];

      return lines.join("\n");
    })
    .join("\n\n");
}

function buildActiveFlags(currentState) {
  return TOOL_ORDER.map((toolName) => {
    const flags = toolName === "ffmpeg"
      ? buildFfmpegActiveFlagParts(currentState.tools.ffmpeg)
      : buildGifskiFlagParts(currentState);

    return `${toolName}:\n${joinArgs(flags) || "(no flags)"}`;
  }).join("\n\n");
}

function buildStats(currentState) {
  return {
    qualityValue: String(currentState.tools.gifski.quality),
    fpsValue: String(currentState.tools.ffmpeg.fps),
    fpsStat: `${currentState.tools.ffmpeg.fps} fps`,
    loopStat: currentState.tools.gifski.loop ? "Forever" : "No loop",
    trimStat: buildTrimSummary(currentState.tools.ffmpeg),
  };
}

function buildArtifacts(currentState) {
  const outputPath = deriveOutputPath(currentState.paths.inputFile, currentState.paths.outputSuffix);
  const validation = buildValidation(currentState, outputPath);
  const stats = buildStats(currentState);

  if (validation.errors.length > 0) {
    return {
      outputPath,
      validation,
      oneLineOutput: "Resolve the blocking issues on the left to generate a command.",
      stepBreakdown: "Resolve the blocking issues on the left to inspect the pipeline.",
      activeFlags: "Resolve the blocking issues on the left to inspect active flags.",
      stats,
      canCopy: false,
    };
  }

  const context = buildRuntimeContext(outputPath);
  const runtimeLines = buildRuntimeLines(currentState, context);

  return {
    outputPath,
    validation,
    oneLineOutput: buildOneLineOutput(runtimeLines),
    stepBreakdown: buildStepBreakdown(currentState, context),
    activeFlags: buildActiveFlags(currentState),
    stats,
    canCopy: true,
  };
}

function parseFieldValue(element, binding) {
  if (binding.kind === "checkbox") {
    return element.checked;
  }

  if (binding.kind === "int") {
    return element.value === "" ? "" : Number(element.value);
  }

  if (binding.kind === "floatOrEmpty") {
    return element.value === "" ? "" : Number.parseFloat(element.value);
  }

  return element.value;
}

function renderForm() {
  FIELD_BINDINGS.forEach((binding) => {
    const element = document.getElementById(binding.id);
    const value = getAtPath(state, binding.path);

    if (binding.kind === "checkbox") {
      element.checked = Boolean(value);
      return;
    }

    element.value = value === "" ? "" : String(value);
  });
}

function renderValidation(validation) {
  const items = [];

  validation.errors.forEach((message) => {
    items.push({
      kind: "error",
      title: "Blocking issue",
      message,
    });
  });

  validation.warnings.forEach((message) => {
    items.push({
      kind: "warning",
      title: "Warning",
      message,
    });
  });

  if (items.length === 0) {
    items.push({
      kind: "ok",
      title: "Ready",
      message: "The current state compiles into a concrete shell command.",
    });
  }

  dom.validationSummary.innerHTML = items
    .map(
      (item) => `
        <div class="validation-item ${item.kind}">
          <strong>${item.title}</strong>
          <span>${item.message}</span>
        </div>
      `
    )
    .join("");
}

function renderOutputs() {
  const artifacts = buildArtifacts(state);

  dom.derivedOutput.textContent = artifacts.outputPath || "Waiting for input";
  dom.oneLineOutput.textContent = artifacts.oneLineOutput;
  dom.stepBreakdown.textContent = artifacts.stepBreakdown;
  dom.activeFlags.textContent = artifacts.activeFlags;

  dom.copyOneLineButton.disabled = !artifacts.canCopy;
  dom.copyBreakdownButton.disabled = !artifacts.canCopy;
  dom.copyFlagsButton.disabled = !artifacts.canCopy;

  dom.gifQualityValue.textContent = artifacts.stats.qualityValue;
  dom.gifFpsValue.textContent = artifacts.stats.fpsValue;
  dom.gifFpsStat.textContent = artifacts.stats.fpsStat;
  dom.gifLoopStat.textContent = artifacts.stats.loopStat;
  dom.gifTrimStat.textContent = artifacts.stats.trimStat;

  renderValidation(artifacts.validation);
}

function render() {
  renderForm();
  renderOutputs();
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalLabel = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1100);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    const originalLabel = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1100);
  }
}

function bindFields() {
  FIELD_BINDINGS.forEach((binding) => {
    const element = document.getElementById(binding.id);
    const eventName = binding.kind === "checkbox" || element.tagName === "SELECT" ? "change" : "input";

    element.addEventListener(eventName, () => {
      const nextValue = parseFieldValue(element, binding);
      setAtPath(state, binding.path, nextValue);
      render();
    });
  });

  dom.copyOneLineButton.addEventListener("click", () => {
    copyText(dom.oneLineOutput.textContent, dom.copyOneLineButton);
  });

  dom.copyBreakdownButton.addEventListener("click", () => {
    copyText(dom.stepBreakdown.textContent, dom.copyBreakdownButton);
  });

  dom.copyFlagsButton.addEventListener("click", () => {
    copyText(dom.activeFlags.textContent, dom.copyFlagsButton);
  });
}

bindFields();
render();
