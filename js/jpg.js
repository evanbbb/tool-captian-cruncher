const TOOL_ORDER = ["jpegoptim", "jpegtran"];
const RUNTIME_TIMESTAMP_SUFFIX = "_$(date +%d%H%M%S)";

const PRESETS = {
  balanced: {
    presetBase: "balanced",
    paths: {
      inputFile: "",
      outputSuffix: RUNTIME_TIMESTAMP_SUFFIX,
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      jpegoptim: {
        enabled: true,
        maxQuality: 82,
        threshold: "",
        progressiveMode: "auto",
        metadataMode: "strip-all",
        force: false,
        retry: false,
        preserve: false,
        saveExtra: false,
        verbose: false,
        extraFlags: "",
      },
      jpegtran: {
        enabled: true,
        optimize: true,
        progressive: false,
        copyMode: "all",
        verbose: false,
        extraFlags: "",
      },
    },
  },
  small: {
    presetBase: "small",
    paths: {
      inputFile: "",
      outputSuffix: RUNTIME_TIMESTAMP_SUFFIX,
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      jpegoptim: {
        enabled: true,
        maxQuality: 72,
        threshold: "",
        progressiveMode: "all-progressive",
        metadataMode: "strip-all",
        force: false,
        retry: true,
        preserve: false,
        saveExtra: false,
        verbose: false,
        extraFlags: "",
      },
      jpegtran: {
        enabled: true,
        optimize: true,
        progressive: true,
        copyMode: "none",
        verbose: false,
        extraFlags: "",
      },
    },
  },
  tiny: {
    presetBase: "tiny",
    paths: {
      inputFile: "",
      outputSuffix: RUNTIME_TIMESTAMP_SUFFIX,
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      jpegoptim: {
        enabled: true,
        maxQuality: 60,
        threshold: "",
        progressiveMode: "all-progressive",
        metadataMode: "strip-all",
        force: false,
        retry: true,
        preserve: false,
        saveExtra: false,
        verbose: false,
        extraFlags: "",
      },
      jpegtran: {
        enabled: true,
        optimize: true,
        progressive: true,
        copyMode: "none",
        verbose: false,
        extraFlags: "",
      },
    },
  },
  lossless: {
    presetBase: "lossless",
    paths: {
      inputFile: "",
      outputSuffix: RUNTIME_TIMESTAMP_SUFFIX,
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      jpegoptim: {
        enabled: true,
        maxQuality: "",
        threshold: "",
        progressiveMode: "preserve",
        metadataMode: "strip-all",
        force: false,
        retry: false,
        preserve: false,
        saveExtra: false,
        verbose: false,
        extraFlags: "",
      },
      jpegtran: {
        enabled: true,
        optimize: true,
        progressive: false,
        copyMode: "all",
        verbose: false,
        extraFlags: "",
      },
    },
  },
};

const FIELD_BINDINGS = [
  { id: "inputFile", path: ["paths", "inputFile"], kind: "text" },
  { id: "outputSuffix", path: ["paths", "outputSuffix"], kind: "text" },
  { id: "jpegoptimEnabled", path: ["tools", "jpegoptim", "enabled"], kind: "checkbox" },
  { id: "jpegoptimMaxQuality", path: ["tools", "jpegoptim", "maxQuality"], kind: "intOrEmpty" },
  { id: "jpegoptimThreshold", path: ["tools", "jpegoptim", "threshold"], kind: "intOrEmpty" },
  { id: "jpegoptimProgressiveMode", path: ["tools", "jpegoptim", "progressiveMode"], kind: "text" },
  { id: "jpegoptimMetadataMode", path: ["tools", "jpegoptim", "metadataMode"], kind: "text" },
  { id: "jpegoptimForce", path: ["tools", "jpegoptim", "force"], kind: "checkbox" },
  { id: "jpegoptimRetry", path: ["tools", "jpegoptim", "retry"], kind: "checkbox" },
  { id: "jpegoptimPreserve", path: ["tools", "jpegoptim", "preserve"], kind: "checkbox" },
  { id: "jpegoptimSaveExtra", path: ["tools", "jpegoptim", "saveExtra"], kind: "checkbox" },
  { id: "jpegoptimVerbose", path: ["tools", "jpegoptim", "verbose"], kind: "checkbox" },
  { id: "jpegoptimExtraFlags", path: ["tools", "jpegoptim", "extraFlags"], kind: "text" },
  { id: "jpegtranEnabled", path: ["tools", "jpegtran", "enabled"], kind: "checkbox" },
  { id: "jpegtranOptimize", path: ["tools", "jpegtran", "optimize"], kind: "checkbox" },
  { id: "jpegtranProgressive", path: ["tools", "jpegtran", "progressive"], kind: "checkbox" },
  { id: "jpegtranCopyMode", path: ["tools", "jpegtran", "copyMode"], kind: "text" },
  { id: "jpegtranVerbose", path: ["tools", "jpegtran", "verbose"], kind: "checkbox" },
  { id: "jpegtranExtraFlags", path: ["tools", "jpegtran", "extraFlags"], kind: "text" },
  { id: "shellSetE", path: ["shell", "setE"], kind: "checkbox" },
  { id: "shellCleanupTemp", path: ["shell", "cleanupTemp"], kind: "checkbox" },
  { id: "shellEchoDone", path: ["shell", "echoDone"], kind: "checkbox" },
];

const dom = {
  presetSelect: document.getElementById("presetSelect"),
  resetPresetButton: document.getElementById("resetPresetButton"),
  derivedOutput: document.getElementById("derivedOutput"),
  validationSummary: document.getElementById("validationSummary"),
  oneLineOutput: document.getElementById("oneLineOutput"),
  stepBreakdown: document.getElementById("stepBreakdown"),
  activeFlags: document.getElementById("activeFlags"),
  copyOneLineButton: document.getElementById("copyOneLineButton"),
  copyBreakdownButton: document.getElementById("copyBreakdownButton"),
  copyFlagsButton: document.getElementById("copyFlagsButton"),
};

let state = createStateFromPreset("balanced");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStateFromPreset(name) {
  return deepClone(PRESETS[name]);
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

function defaultJpegExtension(parsedPath) {
  if (!parsedPath || !parsedPath.extension) {
    return ".jpg";
  }

  if ([".jpg", ".jpeg", ".jpe"].includes(parsedPath.extension.toLowerCase())) {
    return parsedPath.extension;
  }

  return ".jpg";
}

function deriveOutputPath(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return "";
  }

  const extension = defaultJpegExtension(parsed);
  const outputName = `${parsed.stem}${suffix}${extension}`;
  return parsed.directory ? `${parsed.directory}/${outputName}` : outputName;
}

function buildOutputAssignmentLines(inputPath, suffix) {
  const parsed = parseFilePath(inputPath);
  if (!parsed) {
    return [];
  }

  const extension = defaultJpegExtension(parsed);

  if (suffix === RUNTIME_TIMESTAMP_SUFFIX) {
    const outputBase = parsed.directory ? `${parsed.directory}/${parsed.stem}` : parsed.stem;
    return [
      'STAMP="$(date +%d%H%M%S)"',
      `OUT_BASE=${shellQuote(outputBase)}`,
      `OUT="\${OUT_BASE}\${STAMP}${extension}"`,
    ];
  }

  return [`OUT=${shellQuote(deriveOutputPath(inputPath, suffix))}`];
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function enabledTools(currentState) {
  return TOOL_ORDER.filter((toolName) => currentState.tools[toolName].enabled);
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
  const trimmedSuffix = currentState.paths.outputSuffix;
  const parsedInput = parseFilePath(normalizedInput);
  const activeTools = enabledTools(currentState);
  const jpegoptimSettings = currentState.tools.jpegoptim;
  const jpegtranSettings = currentState.tools.jpegtran;

  if (!normalizedInput) {
    errors.push("Input file path is required.");
  }

  if (!trimmedSuffix) {
    errors.push("Output suffix cannot be empty.");
  }

  if (trimmedSuffix.includes("/")) {
    errors.push("Output suffix cannot contain path separators.");
  }

  if (activeTools.length === 0) {
    errors.push("Enable at least one pipeline step.");
  }

  if (jpegoptimSettings.enabled) {
    addIntegerRangeError(errors, "jpegoptim max quality", jpegoptimSettings.maxQuality, 0, 100);
    addIntegerRangeError(errors, "jpegoptim threshold", jpegoptimSettings.threshold, 0, 100);
  }

  if (normalizedInput && outputPath && normalizedInput === outputPath) {
    errors.push("Derived output path matches the input path.");
  }

  if (
    parsedInput &&
    parsedInput.extension &&
    ![".jpg", ".jpeg", ".jpe"].includes(parsedInput.extension.toLowerCase())
  ) {
    errors.push("JPEG Builder requires a .jpg, .jpeg, or .jpe input path.");
  }

  if (jpegoptimSettings.enabled && jpegoptimSettings.retry && jpegoptimSettings.maxQuality === "") {
    warnings.push("jpegoptim retry is only effective with a max quality limit.");
  }

  if (jpegtranSettings.enabled && jpegtranSettings.progressive) {
    warnings.push("jpegtran progressive output is still image-lossless, but it changes the JPEG representation.");
  }

  if (
    jpegoptimSettings.extraFlags.trim() ||
    jpegtranSettings.extraFlags.trim()
  ) {
    warnings.push("Extra flags are appended raw and may override structured controls.");
  }

  return { errors, warnings };
}

function buildRuntimeContext(currentState, outputPath) {
  const jpegoptimEnabled = currentState.tools.jpegoptim.enabled;
  const jpegtranEnabled = currentState.tools.jpegtran.enabled;
  const usesTemp = jpegoptimEnabled && jpegtranEnabled;
  const steps = [];

  if (jpegoptimEnabled) {
    steps.push({
      toolName: "jpegoptim",
      inputRef: "$IN",
      outputRef: usesTemp ? "$STAGE1" : "$OUT",
      quotedInputRef: '"$IN"',
      quotedOutputRef: usesTemp ? '"$STAGE1"' : '"$OUT"',
      workRef: usesTemp ? "$STAGE1" : "$OUT",
      quotedWorkRef: usesTemp ? '"$STAGE1"' : '"$OUT"',
    });
  }

  if (jpegtranEnabled) {
    steps.push({
      toolName: "jpegtran",
      inputRef: jpegoptimEnabled ? "$STAGE1" : "$IN",
      outputRef: "$OUT",
      quotedInputRef: jpegoptimEnabled ? '"$STAGE1"' : '"$IN"',
      quotedOutputRef: '"$OUT"',
    });
  }

  return {
    usesTemp,
    outputPath,
    steps,
  };
}

function joinArgs(parts) {
  return parts.filter(Boolean).join(" ");
}

function buildJpegoptimFlagParts(settings) {
  const parts = [];

  if (settings.maxQuality !== "") {
    parts.push(`--max=${settings.maxQuality}`);
  }

  if (settings.threshold !== "") {
    parts.push(`--threshold=${settings.threshold}`);
  }

  if (settings.progressiveMode === "auto") {
    parts.push("--auto-mode");
  } else if (settings.progressiveMode === "all-progressive") {
    parts.push("--all-progressive");
  } else if (settings.progressiveMode === "all-normal") {
    parts.push("--all-normal");
  }

  if (settings.metadataMode === "strip-all") {
    parts.push("--strip-all");
  } else if (settings.metadataMode === "keep-all") {
    parts.push("--strip-none");
  }

  if (settings.force) {
    parts.push("--force");
  }

  if (settings.retry) {
    parts.push("--retry");
  }

  if (settings.preserve) {
    parts.push("--preserve");
  }

  if (settings.saveExtra) {
    parts.push("--save-extra");
  }

  if (settings.verbose) {
    parts.push("--verbose");
  }

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildJpegoptimCommand(settings, step) {
  return joinArgs(["jpegoptim", ...buildJpegoptimFlagParts(settings), step.quotedWorkRef]);
}

function buildJpegtranFlagParts(settings) {
  const parts = [];

  if (settings.optimize) {
    parts.push("-optimize");
  }

  if (settings.progressive) {
    parts.push("-progressive");
  }

  parts.push("-copy", settings.copyMode);

  if (settings.verbose) {
    parts.push("-verbose");
  }

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildJpegtranCommand(settings, step) {
  return joinArgs([
    "jpegtran",
    ...buildJpegtranFlagParts(settings),
    "-outfile",
    step.quotedOutputRef,
    step.quotedInputRef,
  ]);
}

function buildStepCommand(step, currentState) {
  if (step.toolName === "jpegoptim") {
    return buildJpegoptimCommand(currentState.tools.jpegoptim, step);
  }

  return buildJpegtranCommand(currentState.tools.jpegtran, step);
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

  if (context.usesTemp) {
    lines.push('TMP_DIR="$(mktemp -d -t jpgpipe.XXXXXX)"');
    lines.push('STAGE1="$TMP_DIR/stage1.jpg"');

    if (currentState.shell.cleanupTemp) {
      lines.push('trap \'rm -rf "$TMP_DIR"\' EXIT');
    }
  }

  lines.push("");

  context.steps.forEach((step) => {
    if (step.toolName === "jpegoptim") {
      lines.push(`cp ${step.quotedInputRef} ${step.quotedOutputRef}`);
      lines.push(buildJpegoptimCommand(currentState.tools.jpegoptim, step));
    } else {
      lines.push(buildJpegtranCommand(currentState.tools.jpegtran, step));
    }
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

  let output = trimmedLines[0];
  let previousOpensBlock = trimmedLines[0].endsWith("then") || trimmedLines[0] === "else";

  trimmedLines.slice(1).forEach((line) => {
    output += previousOpensBlock ? ` ${line}` : `; ${line}`;
    previousOpensBlock = line.endsWith("then") || line === "else";
  });

  return `( ${output} )`;
}

function buildStepBreakdown(currentState, context) {
  if (context.steps.length === 0) {
    return "No pipeline steps enabled.";
  }

  return context.steps
    .map((step, index) => {
      const command = buildStepCommand(step, currentState);
      const lines = [
        `${index + 1}. ${step.toolName}`,
        `in:  ${step.inputRef}`,
        `out: ${step.outputRef}`,
      ];

      if (step.toolName === "jpegoptim") {
        lines.push(`prep: cp ${step.inputRef} ${step.outputRef}`);
      }

      lines.push(`cmd: ${command}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function buildActiveFlags(currentState, context) {
  return TOOL_ORDER.map((toolName) => {
    if (!context.steps.find((candidate) => candidate.toolName === toolName)) {
      return `${toolName}:\n(disabled)`;
    }

    const flags = toolName === "jpegoptim"
      ? buildJpegoptimFlagParts(currentState.tools.jpegoptim)
      : buildJpegtranFlagParts(currentState.tools.jpegtran);

    return `${toolName}:\n${joinArgs(flags) || "(no flags)"}`;
  }).join("\n\n");
}

function buildArtifacts(currentState) {
  const outputPath = deriveOutputPath(currentState.paths.inputFile, currentState.paths.outputSuffix);
  const validation = buildValidation(currentState, outputPath);

  if (validation.errors.length > 0) {
    return {
      outputPath,
      validation,
      oneLineOutput: "Resolve the blocking issues on the left to generate a command.",
      stepBreakdown: "Resolve the blocking issues on the left to inspect the pipeline.",
      activeFlags: "Resolve the blocking issues on the left to inspect active flags.",
      canCopy: false,
    };
  }

  const context = buildRuntimeContext(currentState, outputPath);
  const runtimeLines = buildRuntimeLines(currentState, context);
  const oneLineOutput = buildOneLineOutput(runtimeLines);
  const stepBreakdown = buildStepBreakdown(currentState, context);
  const activeFlags = buildActiveFlags(currentState, context);

  return {
    outputPath,
    validation,
    oneLineOutput,
    stepBreakdown,
    activeFlags,
    canCopy: true,
  };
}

function parseFieldValue(element, binding) {
  if (binding.kind === "checkbox") {
    return element.checked;
  }

  if (binding.kind === "intOrEmpty") {
    return element.value === "" ? "" : Number(element.value);
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

  dom.presetSelect.value = state.presetBase;
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

  renderValidation(artifacts.validation);
}

function render() {
  renderForm();
  renderOutputs();
}

function loadPreset(name) {
  const preservedInput = state.paths.inputFile;
  state = createStateFromPreset(name);
  state.paths.inputFile = preservedInput;
  render();
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

  dom.presetSelect.addEventListener("change", (event) => {
    loadPreset(event.target.value);
  });

  dom.resetPresetButton.addEventListener("click", () => {
    loadPreset(state.presetBase);
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
