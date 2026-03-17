const TOOL_ORDER = ["ffmpeg", "gifski"];
const RUNTIME_TIMESTAMP_SUFFIX = "_$(date +%d%H%M%S)";
const GENERATED_SUFFIX_PATTERNS = [
  /_\d{8}$/,
  /_\$\(date \+%d%H%M%S\)$/,
  /_Q\d+_M\d+_L\d+$/,
];
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
    outputSuffixMode: "timestamp",
  },
  tools: {
    ffmpeg: {
      fps: 15,
      extraFlags: "",
    },
    gifski: {
      quality: 90,
      motionQuality: 80,
      lossyQuality: 60,
      bounce: false,
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
  { id: "outputSuffixMode", path: ["paths", "outputSuffixMode"], kind: "text" },
  { id: "gifFps", path: ["tools", "ffmpeg", "fps"], kind: "int" },
  { id: "ffmpegExtraFlags", path: ["tools", "ffmpeg", "extraFlags"], kind: "text" },
  { id: "gifQuality", path: ["tools", "gifski", "quality"], kind: "int" },
  { id: "gifMotionQuality", path: ["tools", "gifski", "motionQuality"], kind: "int" },
  { id: "gifLossyQuality", path: ["tools", "gifski", "lossyQuality"], kind: "int" },
  { id: "gifBounce", path: ["tools", "gifski", "bounce"], kind: "checkbox" },
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
  gifTipsPanel: document.getElementById("gifTipsPanel"),
  gifTipsToggle: document.getElementById("gifTipsToggle"),
  gifTipsBody: document.getElementById("gifTipsBody"),
  copyOneLineButton: document.getElementById("copyOneLineButton"),
  copyBreakdownButton: document.getElementById("copyBreakdownButton"),
  copyFlagsButton: document.getElementById("copyFlagsButton"),
  gifQualityValue: document.getElementById("gifQualityValue"),
  gifMotionQualityValue: document.getElementById("gifMotionQualityValue"),
  gifLossyQualityValue: document.getElementById("gifLossyQualityValue"),
  gifFpsValue: document.getElementById("gifFpsValue"),
  gifFpsStat: document.getElementById("gifFpsStat"),
  gifQualityStat: document.getElementById("gifQualityStat"),
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

function stripGeneratedSuffixes(stem) {
  let nextStem = stem;
  let changed = true;

  while (changed && nextStem) {
    changed = false;

    GENERATED_SUFFIX_PATTERNS.forEach((pattern) => {
      if (pattern.test(nextStem)) {
        nextStem = nextStem.replace(pattern, "");
        changed = true;
      }
    });
  }

  return nextStem || stem;
}

function deriveOutputPath(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return "";
  }

  const baseStem = stripGeneratedSuffixes(parsed.stem);
  const outputName = `${baseStem}${suffix}.gif`;
  return parsed.directory ? `${parsed.directory}/${outputName}` : outputName;
}

function buildOutputAssignmentLines(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return [];
  }

  if (suffix === RUNTIME_TIMESTAMP_SUFFIX) {
    const baseStem = stripGeneratedSuffixes(parsed.stem);
    const outputBase = parsed.directory ? `${parsed.directory}/${baseStem}` : baseStem;
    return [
      'STAMP="$(date +%d%H%M%S)"',
      `OUT_BASE=${shellQuote(outputBase)}`,
      'OUT="${OUT_BASE}_${STAMP}.gif"',
    ];
  }

  return [`OUT=${shellQuote(deriveOutputPath(inputPath, suffix))}`];
}

function buildSettingsSuffix(currentState) {
  return [
    `Q${currentState.tools.gifski.quality}`,
    `M${currentState.tools.gifski.motionQuality}`,
    `L${currentState.tools.gifski.lossyQuality}`,
  ].join("_").replace(/^/, "_");
}

function resolveOutputSuffix(currentState) {
  if (currentState.paths.outputSuffixMode === "settings") {
    return buildSettingsSuffix(currentState);
  }

  return RUNTIME_TIMESTAMP_SUFFIX;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function joinArgs(parts) {
  return parts.filter(Boolean).join(" ");
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

function buildValidation(currentState, outputPath) {
  const errors = [];
  const warnings = [];
  const normalizedInput = normalizeInputPath(currentState.paths.inputFile);
  const parsedInput = parseFilePath(normalizedInput);
  const ffmpegSettings = currentState.tools.ffmpeg;
  const gifskiSettings = currentState.tools.gifski;

  if (!normalizedInput) {
    errors.push("Input file path is required.");
  }

  addIntegerRangeError(errors, "gifski quality", gifskiSettings.quality, 1, 100);
  addIntegerRangeError(errors, "gifski motion quality", gifskiSettings.motionQuality, 1, 100);
  addIntegerRangeError(errors, "gifski lossy quality", gifskiSettings.lossyQuality, 1, 100);
  addIntegerRangeError(errors, "ffmpeg fps", ffmpegSettings.fps, 2, 30);

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
  parts.push("-i", '"$IN"');
  parts.push("-vf", `"${buildFfmpegFilter(settings)}"`);
  parts.push("-y");

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildFfmpegActiveFlagParts(settings) {
  const parts = [];
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
    "--motion-quality",
    String(gifskiSettings.motionQuality),
    "--lossy-quality",
    String(gifskiSettings.lossyQuality),
    "--fps",
    String(ffmpegSettings.fps),
    "--width",
    "9999",
    "--repeat",
    "0",
    gifskiSettings.bounce ? "--bounce" : "",
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
  buildOutputAssignmentLines(currentState.paths.inputFile, resolveOutputSuffix(currentState)).forEach((line) => {
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
    motionQualityValue: String(currentState.tools.gifski.motionQuality),
    lossyQualityValue: String(currentState.tools.gifski.lossyQuality),
    fpsValue: String(currentState.tools.ffmpeg.fps),
    fpsStat: `${currentState.tools.ffmpeg.fps} fps`,
    qualityStat: `Q${currentState.tools.gifski.quality} M${currentState.tools.gifski.motionQuality} L${currentState.tools.gifski.lossyQuality}`,
  };
}

function buildArtifacts(currentState) {
  const outputPath = deriveOutputPath(
    currentState.paths.inputFile,
    resolveOutputSuffix(currentState)
  );
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

  dom.derivedOutput.textContent = artifacts.outputPath
    ? artifacts.outputPath.split(/[\\/]/).pop() || artifacts.outputPath
    : "Waiting for input";
  dom.oneLineOutput.textContent = artifacts.oneLineOutput;
  dom.stepBreakdown.textContent = artifacts.stepBreakdown;
  dom.activeFlags.textContent = artifacts.activeFlags;

  dom.copyOneLineButton.disabled = !artifacts.canCopy;
  dom.copyBreakdownButton.disabled = !artifacts.canCopy;
  dom.copyFlagsButton.disabled = !artifacts.canCopy;

  dom.gifQualityValue.textContent = artifacts.stats.qualityValue;
  dom.gifMotionQualityValue.textContent = artifacts.stats.motionQualityValue;
  dom.gifLossyQualityValue.textContent = artifacts.stats.lossyQualityValue;
  dom.gifFpsValue.textContent = artifacts.stats.fpsValue;
  dom.gifFpsStat.textContent = artifacts.stats.fpsStat;
  dom.gifQualityStat.textContent = artifacts.stats.qualityStat;

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

function bindTipsToggle() {
  if (!dom.gifTipsPanel || !dom.gifTipsToggle || !dom.gifTipsBody) {
    return;
  }

  dom.gifTipsToggle.addEventListener("click", () => {
    const nextExpanded = dom.gifTipsToggle.getAttribute("aria-expanded") !== "true";
    dom.gifTipsToggle.setAttribute("aria-expanded", String(nextExpanded));
    dom.gifTipsPanel.dataset.expanded = String(nextExpanded);
    dom.gifTipsBody.hidden = !nextExpanded;
  });
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

bindTipsToggle();
bindFields();
render();
