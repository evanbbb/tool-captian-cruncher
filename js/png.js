const TOOL_ORDER = ["pngquant", "oxipng", "zopflipng"];
const RUNTIME_TIMESTAMP_SUFFIX = "_$(date +%d%H%M%S)";
const GENERATED_SUFFIX_PATTERNS = [
  /_\d{8}$/,
  /_\$\(date \+%d%H%M%S\)$/,
  /_Q[\d.]+-[\d.]+_opt\d+$/,
  /_Q[\d.]+-[\d.]+$/,
  /_opt\d+$/,
  /_SETTINGS$/,
];

const PRESETS = {
  balanced: {
    presetBase: "balanced",
    paths: {
      inputFile: "",
      outputSuffixMode: "timestamp",
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      pngquant: {
        enabled: true,
        qualityMin: 55,
        qualityMax: 75,
        strip: true,
        nofs: false,
        floyd: "",
        posterize: "",
        skipIfLarger: true,
        verbose: false,
        extraFlags: "",
      },
      oxipng: {
        enabled: true,
        level: 4,
        stripMode: "all",
        alpha: false,
        interlace: "off",
        fix: false,
        preserve: false,
        force: false,
        verbose: false,
        extraFlags: "",
      },
      zopflipng: {
        enabled: false,
        max: false,
        iterations: "",
        lossyTransparent: false,
        lossy8bit: false,
        verbose: false,
        extraFlags: "",
      },
    },
  },
  small: {
    presetBase: "small",
    paths: {
      inputFile: "",
      outputSuffixMode: "timestamp",
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      pngquant: {
        enabled: true,
        qualityMin: 40,
        qualityMax: 65,
        strip: true,
        nofs: false,
        floyd: "",
        posterize: "",
        skipIfLarger: true,
        verbose: false,
        extraFlags: "",
      },
      oxipng: {
        enabled: true,
        level: 6,
        stripMode: "all",
        alpha: false,
        interlace: "off",
        fix: false,
        preserve: false,
        force: false,
        verbose: false,
        extraFlags: "",
      },
      zopflipng: {
        enabled: false,
        max: false,
        iterations: "",
        lossyTransparent: false,
        lossy8bit: false,
        verbose: false,
        extraFlags: "",
      },
    },
  },
  tiny: {
    presetBase: "tiny",
    paths: {
      inputFile: "",
      outputSuffixMode: "timestamp",
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      pngquant: {
        enabled: true,
        qualityMin: 25,
        qualityMax: 50,
        strip: true,
        nofs: false,
        floyd: "",
        posterize: "",
        skipIfLarger: true,
        verbose: false,
        extraFlags: "",
      },
      oxipng: {
        enabled: true,
        level: 6,
        stripMode: "all",
        alpha: true,
        interlace: "off",
        fix: false,
        preserve: false,
        force: false,
        verbose: false,
        extraFlags: "",
      },
      zopflipng: {
        enabled: true,
        max: true,
        iterations: "",
        lossyTransparent: false,
        lossy8bit: false,
        verbose: false,
        extraFlags: "",
      },
    },
  },
  lossless: {
    presetBase: "lossless",
    paths: {
      inputFile: "",
      outputSuffixMode: "timestamp",
    },
    shell: {
      setE: true,
      cleanupTemp: true,
      echoDone: false,
    },
    tools: {
      pngquant: {
        enabled: false,
        qualityMin: 55,
        qualityMax: 75,
        strip: true,
        nofs: false,
        floyd: "",
        posterize: "",
        skipIfLarger: true,
        verbose: false,
        extraFlags: "",
      },
      oxipng: {
        enabled: true,
        level: 6,
        stripMode: "all",
        alpha: false,
        interlace: "off",
        fix: false,
        preserve: false,
        force: false,
        verbose: false,
        extraFlags: "",
      },
      zopflipng: {
        enabled: false,
        max: false,
        iterations: "",
        lossyTransparent: false,
        lossy8bit: false,
        verbose: false,
        extraFlags: "",
      },
    },
  },
};

const FIELD_BINDINGS = [
  { id: "inputFile", path: ["paths", "inputFile"], kind: "text" },
  { id: "outputSuffixMode", path: ["paths", "outputSuffixMode"], kind: "text" },
  { id: "pngquantEnabled", path: ["tools", "pngquant", "enabled"], kind: "checkbox" },
  { id: "pngquantQualityMin", path: ["tools", "pngquant", "qualityMin"], kind: "int" },
  { id: "pngquantQualityMax", path: ["tools", "pngquant", "qualityMax"], kind: "int" },
  { id: "pngquantStrip", path: ["tools", "pngquant", "strip"], kind: "checkbox" },
  { id: "pngquantNofs", path: ["tools", "pngquant", "nofs"], kind: "checkbox" },
  { id: "pngquantFloyd", path: ["tools", "pngquant", "floyd"], kind: "floatOrEmpty" },
  { id: "pngquantPosterize", path: ["tools", "pngquant", "posterize"], kind: "intOrEmpty" },
  { id: "pngquantSkipIfLarger", path: ["tools", "pngquant", "skipIfLarger"], kind: "checkbox" },
  { id: "pngquantVerbose", path: ["tools", "pngquant", "verbose"], kind: "checkbox" },
  { id: "pngquantExtraFlags", path: ["tools", "pngquant", "extraFlags"], kind: "text" },
  { id: "oxipngEnabled", path: ["tools", "oxipng", "enabled"], kind: "checkbox" },
  { id: "oxipngLevel", path: ["tools", "oxipng", "level"], kind: "int" },
  { id: "oxipngStripMode", path: ["tools", "oxipng", "stripMode"], kind: "text" },
  { id: "oxipngAlpha", path: ["tools", "oxipng", "alpha"], kind: "checkbox" },
  { id: "oxipngInterlace", path: ["tools", "oxipng", "interlace"], kind: "text" },
  { id: "oxipngFix", path: ["tools", "oxipng", "fix"], kind: "checkbox" },
  { id: "oxipngPreserve", path: ["tools", "oxipng", "preserve"], kind: "checkbox" },
  { id: "oxipngForce", path: ["tools", "oxipng", "force"], kind: "checkbox" },
  { id: "oxipngVerbose", path: ["tools", "oxipng", "verbose"], kind: "checkbox" },
  { id: "oxipngExtraFlags", path: ["tools", "oxipng", "extraFlags"], kind: "text" },
  { id: "zopflipngEnabled", path: ["tools", "zopflipng", "enabled"], kind: "checkbox" },
  { id: "zopflipngMax", path: ["tools", "zopflipng", "max"], kind: "checkbox" },
  { id: "zopflipngIterations", path: ["tools", "zopflipng", "iterations"], kind: "intOrEmpty" },
  { id: "zopflipngLossyTransparent", path: ["tools", "zopflipng", "lossyTransparent"], kind: "checkbox" },
  { id: "zopflipngLossy8bit", path: ["tools", "zopflipng", "lossy8bit"], kind: "checkbox" },
  { id: "zopflipngVerbose", path: ["tools", "zopflipng", "verbose"], kind: "checkbox" },
  { id: "zopflipngExtraFlags", path: ["tools", "zopflipng", "extraFlags"], kind: "text" },
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
  const outputName = `${baseStem}${suffix}.png`;
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
      'OUT="${OUT_BASE}_${STAMP}.png"',
    ];
  }

  return [`OUT=${shellQuote(deriveOutputPath(inputPath, suffix))}`];
}

function joinSettingsSuffix(tokens) {
  const activeTokens = tokens.filter(Boolean);
  return activeTokens.length > 0 ? `_${activeTokens.join("_")}` : "_SETTINGS";
}

function buildSettingsSuffix(currentState) {
  const tokens = [];
  const pngquantSettings = currentState.tools.pngquant;
  const oxipngSettings = currentState.tools.oxipng;

  if (
    pngquantSettings.enabled &&
    pngquantSettings.qualityMin !== "" &&
    pngquantSettings.qualityMax !== ""
  ) {
    tokens.push(`Q${pngquantSettings.qualityMin}-${pngquantSettings.qualityMax}`);
  }

  if (oxipngSettings.enabled && oxipngSettings.level !== "") {
    tokens.push(`opt${oxipngSettings.level}`);
  }

  return joinSettingsSuffix(tokens);
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

function enabledTools(currentState) {
  return TOOL_ORDER.filter((toolName) => currentState.tools[toolName].enabled);
}

function addRangeError(errors, label, value, minimum, maximum) {
  if (value === "") {
    return;
  }

  if (!Number.isFinite(value)) {
    errors.push(`${label} must be a number.`);
    return;
  }

  if (value < minimum || value > maximum) {
    errors.push(`${label} must be between ${minimum} and ${maximum}.`);
  }
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

function addIntegerMinimumError(errors, label, value, minimum) {
  if (value === "") {
    return;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    errors.push(`${label} must be an integer.`);
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
  const parsedInput = parseFilePath(normalizedInput);
  const activeTools = enabledTools(currentState);
  const pngSettings = currentState.tools.pngquant;
  const oxiSettings = currentState.tools.oxipng;
  const zopfliSettings = currentState.tools.zopflipng;

  if (!normalizedInput) {
    errors.push("Input file path is required.");
  }

  if (activeTools.length === 0) {
    errors.push("Enable at least one pipeline step.");
  }

  if (
    pngSettings.enabled &&
    pngSettings.qualityMin !== "" &&
    pngSettings.qualityMax !== "" &&
    Number(pngSettings.qualityMin) > Number(pngSettings.qualityMax)
  ) {
    errors.push("pngquant quality min must be less than or equal to quality max.");
  }

  if (pngSettings.enabled) {
    addIntegerRangeError(errors, "pngquant quality min", pngSettings.qualityMin, 0, 100);
    addIntegerRangeError(errors, "pngquant quality max", pngSettings.qualityMax, 0, 100);
    addRangeError(errors, "pngquant floyd amount", pngSettings.floyd, 0, 1);
    addIntegerRangeError(errors, "pngquant posterize", pngSettings.posterize, 0, 4);
  }

  if (oxiSettings.enabled) {
    addIntegerRangeError(errors, "oxipng optimization level", oxiSettings.level, 0, 6);
  }

  if (zopfliSettings.enabled) {
    addIntegerMinimumError(errors, "zopflipng iterations", zopfliSettings.iterations, 1);
  }

  if (normalizedInput && outputPath && normalizedInput === outputPath) {
    errors.push("Derived output path matches the input path.");
  }

  if (parsedInput && parsedInput.extension && parsedInput.extension.toLowerCase() !== ".png") {
    warnings.push("Input path does not end in .png. The command is still generated exactly as typed.");
  }

  if (oxiSettings.enabled && oxiSettings.alpha) {
    warnings.push("oxipng alpha optimization is technically lossy.");
  }

  if (
    (pngSettings.enabled && pngSettings.skipIfLarger) ||
    (oxiSettings.enabled && !oxiSettings.force)
  ) {
    warnings.push("If pngquant or oxipng skips writing output, the generated script carries the previous file forward so later steps still have input.");
  }

  if (zopfliSettings.enabled) {
    warnings.push("zopflipng can be very slow on larger files.");
  }

  if (zopfliSettings.enabled && (zopfliSettings.lossyTransparent || zopfliSettings.lossy8bit)) {
    warnings.push("zopflipng lossy options are enabled.");
  }

  if (
    pngSettings.extraFlags.trim() ||
    oxiSettings.extraFlags.trim() ||
    zopfliSettings.extraFlags.trim()
  ) {
    warnings.push("Extra flags are appended raw and may override structured controls.");
  }

  return { errors, warnings };
}

function buildRuntimeContext(currentState, outputPath) {
  const activeTools = enabledTools(currentState);
  const usesTemp = activeTools.length > 1;
  const stageVars = activeTools.slice(0, -1).map((_, index) => `$STAGE${index + 1}`);
  const quotedStageVars = activeTools
    .slice(0, -1)
    .map((_, index) => `"${`$STAGE${index + 1}`}"`);

  const steps = activeTools.map((toolName, index) => {
    const inputRef = index === 0 ? "$IN" : stageVars[index - 1];
    const outputRef = index === activeTools.length - 1 ? "$OUT" : stageVars[index];
    const quotedInputRef = index === 0 ? '"$IN"' : quotedStageVars[index - 1];
    const quotedOutputRef = index === activeTools.length - 1 ? '"$OUT"' : quotedStageVars[index];

    return {
      toolName,
      inputRef,
      outputRef,
      quotedInputRef,
      quotedOutputRef,
    };
  });

  return {
    activeTools,
    usesTemp,
    outputPath,
    steps,
  };
}

function joinArgs(parts) {
  return parts.filter(Boolean).join(" ");
}

function buildPngquantFlagParts(settings) {
  const parts = [];

  if (settings.qualityMin !== "" && settings.qualityMax !== "") {
    parts.push(`--quality=${settings.qualityMin}-${settings.qualityMax}`);
  }

  if (settings.strip) {
    parts.push("--strip");
  }

  if (settings.nofs) {
    parts.push("--nofs");
  }

  if (settings.floyd !== "") {
    parts.push(`--floyd=${settings.floyd}`);
  }

  if (settings.posterize !== "") {
    parts.push("--posterize", String(settings.posterize));
  }

  if (settings.skipIfLarger) {
    parts.push("--skip-if-larger");
  }

  if (settings.verbose) {
    parts.push("--verbose");
  }

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildPngquantCommand(settings, step) {
  const args = ["pngquant", ...buildPngquantFlagParts(settings)];
  args.push("--output", step.quotedOutputRef, "--", step.quotedInputRef);
  return joinArgs(args);
}

function buildOxipngFlagParts(settings) {
  const parts = [];

  if (settings.level !== "") {
    parts.push("-o", String(settings.level));
  }

  if (settings.stripMode === "safe") {
    parts.push("--strip", "safe");
  } else if (settings.stripMode === "all") {
    parts.push("--strip", "all");
  }

  if (settings.alpha) {
    parts.push("--alpha");
  }

  if (settings.interlace) {
    parts.push("--interlace", settings.interlace);
  }

  if (settings.fix) {
    parts.push("--fix");
  }

  if (settings.preserve) {
    parts.push("--preserve");
  }

  if (settings.force) {
    parts.push("--force");
  }

  if (settings.verbose) {
    parts.push("--verbose");
  }

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildOxipngCommand(settings, step) {
  const args = ["oxipng", ...buildOxipngFlagParts(settings)];
  args.push("--out", step.quotedOutputRef, "--", step.quotedInputRef);
  return joinArgs(args);
}

function buildZopflipngFlagParts(settings) {
  const parts = [];

  if (settings.max) {
    parts.push("-m");
  }

  if (settings.iterations !== "") {
    parts.push(`--iterations=${settings.iterations}`);
  }

  if (settings.lossyTransparent) {
    parts.push("--lossy_transparent");
  }

  if (settings.lossy8bit) {
    parts.push("--lossy_8bit");
  }

  if (settings.verbose) {
    parts.push("--verbose");
  }

  if (settings.extraFlags.trim()) {
    parts.push(settings.extraFlags.trim());
  }

  return parts;
}

function buildZopflipngCommand(settings, step) {
  const args = ["zopflipng", ...buildZopflipngFlagParts(settings)];
  args.push(step.quotedInputRef, step.quotedOutputRef);
  return joinArgs(args);
}

function buildStepCommand(step, currentState) {
  if (step.toolName === "pngquant") {
    return buildPngquantCommand(currentState.tools.pngquant, step);
  }

  if (step.toolName === "oxipng") {
    return buildOxipngCommand(currentState.tools.oxipng, step);
  }

  return buildZopflipngCommand(currentState.tools.zopflipng, step);
}

function stepUsesPassThroughFallback(step, currentState) {
  if (step.toolName === "pngquant") {
    return currentState.tools.pngquant.skipIfLarger;
  }

  if (step.toolName === "oxipng") {
    return !currentState.tools.oxipng.force;
  }

  return false;
}

function buildStepExecutionLines(step, currentState) {
  const command = buildStepCommand(step, currentState);

  if (!stepUsesPassThroughFallback(step, currentState)) {
    return [command];
  }

  return [
    `if ${command}; then`,
    "  :",
    "else",
    "  status=$?",
    `  if [ -e ${step.quotedOutputRef} ]; then`,
    '    exit "$status"',
    "  fi",
    "fi",
    `[ -e ${step.quotedOutputRef} ] || cp ${step.quotedInputRef} ${step.quotedOutputRef}`,
  ];
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

  if (context.usesTemp) {
    lines.push('TMP_DIR="$(mktemp -d -t pngpipe.XXXXXX)"');
    context.steps.slice(0, -1).forEach((step, index) => {
      lines.push(`STAGE${index + 1}="$TMP_DIR/stage${index + 1}.png"`);
    });

    if (currentState.shell.cleanupTemp) {
      lines.push('trap \'rm -rf "$TMP_DIR"\' EXIT');
    }
  }

  lines.push("");

  context.steps.forEach((step) => {
    buildStepExecutionLines(step, currentState).forEach((line) => {
      lines.push(line);
    });
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
      const label = `${index + 1}. ${step.toolName}`;
      const command = buildStepCommand(step, currentState);
      const lines = [
        label,
        `in:  ${step.inputRef}`,
        `out: ${step.outputRef}`,
        `cmd: ${command}`,
      ];

      if (stepUsesPassThroughFallback(step, currentState)) {
        lines.push("fallback: if no output file is produced, copy the previous file forward");
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

function buildActiveFlags(currentState, context) {
  return TOOL_ORDER.map((toolName) => {
    if (!context.steps.find((candidate) => candidate.toolName === toolName)) {
      return `${toolName}:\n(disabled)`;
    }

    let flags = [];

    if (toolName === "pngquant") {
      flags = buildPngquantFlagParts(currentState.tools.pngquant);
    } else if (toolName === "oxipng") {
      flags = buildOxipngFlagParts(currentState.tools.oxipng);
    } else {
      flags = buildZopflipngFlagParts(currentState.tools.zopflipng);
    }

    return `${toolName}:\n${joinArgs(flags) || "(no flags)"}`;
  }).join("\n\n");
}

function buildArtifacts(currentState) {
  const outputPath = deriveOutputPath(
    currentState.paths.inputFile,
    resolveOutputSuffix(currentState)
  );
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

  if (binding.kind === "int") {
    return element.value === "" ? "" : Number(element.value);
  }

  if (binding.kind === "intOrEmpty") {
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

  dom.derivedOutput.textContent = artifacts.outputPath
    ? artifacts.outputPath.split(/[\\/]/).pop() || artifacts.outputPath
    : "Waiting for input";
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
  const preservedOutputSuffixMode = state.paths.outputSuffixMode;
  state = createStateFromPreset(name);
  state.paths.inputFile = preservedInput;
  state.paths.outputSuffixMode = preservedOutputSuffixMode;
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
