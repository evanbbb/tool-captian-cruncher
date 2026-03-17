const SCORING_IMPORTS = {
  wcag: "https://esm.sh/wcag-contrast@3",
  apca: "https://esm.sh/apca-w3@0.1.9",
};

const PICK_LABELS = {
  foreground: "Foreground",
  background: "Background",
};

const WCAG_THRESHOLDS = {
  normal: 4.5,
  large: 3,
  graphics: 3,
};

const APCA_STRENGTH_LABELS = [
  { minimum: 75, label: "Strong" },
  { minimum: 45, label: "Moderate" },
  { minimum: 0, label: "Weak" },
];

const dom = {
  dropzone: document.getElementById("dropzone"),
  browseButton: document.getElementById("browseButton"),
  clearButton: document.getElementById("clearButton"),
  imageInput: document.getElementById("imageInput"),
  fileStatus: document.getElementById("fileStatus"),
  pickForegroundButton: document.getElementById("pickForegroundButton"),
  pickBackgroundButton: document.getElementById("pickBackgroundButton"),
  pickModeStatus: document.getElementById("pickModeStatus"),
  foregroundSwatch: document.getElementById("foregroundSwatch"),
  foregroundValue: document.getElementById("foregroundValue"),
  foregroundLocation: document.getElementById("foregroundLocation"),
  backgroundSwatch: document.getElementById("backgroundSwatch"),
  backgroundValue: document.getElementById("backgroundValue"),
  backgroundLocation: document.getElementById("backgroundLocation"),
  resultsIntro: document.getElementById("resultsIntro"),
  resultsBlock: document.getElementById("resultsBlock"),
  wcagRatioValue: document.getElementById("wcagRatioValue"),
  apcaValue: document.getElementById("apcaValue"),
  apcaStrength: document.getElementById("apcaStrength"),
  wcagNormalBadge: document.getElementById("wcagNormalBadge"),
  wcagLargeBadge: document.getElementById("wcagLargeBadge"),
  wcagGraphicsBadge: document.getElementById("wcagGraphicsBadge"),
  imageCanvas: document.getElementById("imageCanvas"),
  canvasEmpty: document.getElementById("canvasEmpty"),
};

const state = {
  image: null,
  display: {
    width: 0,
    height: 0,
  },
  activePick: null,
  hoverSample: null,
  foregroundSample: null,
  backgroundSample: null,
  scoring: {
    ready: false,
    error: "",
    wcagRgb: null,
    apcaContrast: null,
    srgbToY: null,
  },
};

const sourceCanvas = document.createElement("canvas");
const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

init();

function init() {
  bindEvents();
  render();
  void loadScoringLibraries();
}

function bindEvents() {
  dom.browseButton.addEventListener("click", () => {
    dom.imageInput.click();
  });

  dom.clearButton.addEventListener("click", () => {
    clearLoadedImage();
  });

  dom.dropzone.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("canvas")) {
      return;
    }

    if (state.image) {
      return;
    }

    dom.imageInput.click();
  });

  dom.imageInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (file) {
      await loadImageFile(file);
    }

    dom.imageInput.value = "";
  });

  dom.dropzone.addEventListener("dragenter", handleDragHover);
  dom.dropzone.addEventListener("dragover", handleDragHover);
  dom.dropzone.addEventListener("dragleave", handleDragLeave);
  dom.dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dom.dropzone.classList.remove("dragover");

    const [file] = event.dataTransfer?.files || [];
    if (file) {
      await loadImageFile(file);
    }
  });

  dom.pickForegroundButton.addEventListener("click", () => {
    setActivePick("foreground");
  });

  dom.pickBackgroundButton.addEventListener("click", () => {
    setActivePick("background");
  });

  dom.imageCanvas.addEventListener("click", (event) => {
    if (!state.image || !state.activePick) {
      return;
    }

    const point = getCanvasPoint(event);
    const sample = sampleMedianColor(point.x, point.y);
    if (!sample) {
      return;
    }

    if (state.activePick === "foreground") {
      state.foregroundSample = sample;
    } else {
      state.backgroundSample = sample;
    }

    render();
  });

  dom.imageCanvas.addEventListener("mouseenter", handleCanvasHover);
  dom.imageCanvas.addEventListener("mousemove", handleCanvasHover);
  dom.imageCanvas.addEventListener("mouseleave", () => {
    if (!state.hoverSample) {
      return;
    }

    state.hoverSample = null;
    renderPreview();
  });

  window.addEventListener("resize", () => {
    if (state.image) {
      renderPreview();
    }
  });
}

function handleDragHover(event) {
  event.preventDefault();
  dom.dropzone.classList.add("dragover");
}

function handleDragLeave(event) {
  if (event.type === "dragleave" && event.currentTarget.contains(event.relatedTarget)) {
    return;
  }

  dom.dropzone.classList.remove("dragover");
}

async function loadScoringLibraries() {
  try {
    const [wcagModule, apcaModule] = await Promise.all([
      import(SCORING_IMPORTS.wcag),
      import(SCORING_IMPORTS.apca),
    ]);

    const wcagRgb = wcagModule.rgb || wcagModule.default?.rgb || wcagModule.default;
    const apcaContrast = apcaModule.APCAcontrast || apcaModule.default?.APCAcontrast;
    const srgbToY = apcaModule.sRGBtoY || apcaModule.default?.sRGBtoY;

    if (typeof wcagRgb !== "function" || typeof apcaContrast !== "function" || typeof srgbToY !== "function") {
      throw new Error("Contrast scoring libraries loaded with an unexpected API shape.");
    }

    state.scoring.ready = true;
    state.scoring.error = "";
    state.scoring.wcagRgb = wcagRgb;
    state.scoring.apcaContrast = apcaContrast;
    state.scoring.srgbToY = srgbToY;
  } catch (error) {
    state.scoring.ready = false;
    state.scoring.error = error instanceof Error
      ? error.message
      : "Contrast scoring libraries could not be loaded.";
  }

  renderResults();
}

async function loadImageFile(file) {
  if (!file.type.startsWith("image/")) {
    dom.fileStatus.textContent = "That file is not a supported image.";
    return;
  }

  dom.fileStatus.textContent = `Loading ${file.name}...`;
  dom.dropzone.setAttribute("aria-busy", "true");

  let objectUrl = "";

  try {
    objectUrl = URL.createObjectURL(file);
    const image = await loadImageElement(objectUrl);

    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;
    sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceContext.drawImage(image, 0, 0);

    state.image = {
      name: file.name,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    state.activePick = null;
    state.foregroundSample = null;
    state.backgroundSample = null;

    dom.fileStatus.textContent = `${file.name} — ${image.naturalWidth} × ${image.naturalHeight}`;
    render();
  } catch (error) {
    dom.fileStatus.textContent = "That image could not be decoded in the browser.";
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    dom.dropzone.removeAttribute("aria-busy");
  }
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed."));
    image.src = src;
  });
}

function clearLoadedImage() {
  state.image = null;
  state.activePick = null;
  state.hoverSample = null;
  state.foregroundSample = null;
  state.backgroundSample = null;
  state.display.width = 0;
  state.display.height = 0;

  sourceCanvas.width = 0;
  sourceCanvas.height = 0;

  dom.imageInput.value = "";
  dom.fileStatus.textContent = "No image loaded yet.";
  render();
}

function handleCanvasHover(event) {
  if (!state.image || !state.activePick) {
    return;
  }

  const point = getCanvasPoint(event);
  state.hoverSample = sampleMedianColor(point.x, point.y);
  renderPreview();
}

function setActivePick(mode) {
  if (!state.image) {
    return;
  }

  state.activePick = mode;
  render();
}

function getCanvasPoint(event) {
  const rect = dom.imageCanvas.getBoundingClientRect();
  const relativeX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const relativeY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

  return {
    x: clamp(Math.round(relativeX * (state.image.width - 1)), 0, state.image.width - 1),
    y: clamp(Math.round(relativeY * (state.image.height - 1)), 0, state.image.height - 1),
  };
}

function sampleMedianColor(centerX, centerY) {
  if (!state.image) {
    return null;
  }

  const reds = [];
  const greens = [];
  const blues = [];
  const cells = [];

  for (let deltaY = -1; deltaY <= 1; deltaY += 1) {
    for (let deltaX = -1; deltaX <= 1; deltaX += 1) {
      const sampleX = clamp(centerX + deltaX, 0, state.image.width - 1);
      const sampleY = clamp(centerY + deltaY, 0, state.image.height - 1);
      const pixel = sourceContext.getImageData(sampleX, sampleY, 1, 1).data;

      reds.push(pixel[0]);
      greens.push(pixel[1]);
      blues.push(pixel[2]);
      cells.push([pixel[0], pixel[1], pixel[2]]);
    }
  }

  const rgb = [median(reds), median(greens), median(blues)];

  return {
    x: centerX,
    y: centerY,
    cells,
    rgb,
    hex: rgbToHex(rgb),
  };
}

function render() {
  renderMode();
  renderSamples();
  renderResults();
  renderPreview();
}

function renderMode() {
  const hasImage = Boolean(state.image);

  dom.pickForegroundButton.disabled = !hasImage;
  dom.pickBackgroundButton.disabled = !hasImage;
  dom.pickForegroundButton.classList.toggle("active", state.activePick === "foreground");
  dom.pickBackgroundButton.classList.toggle("active", state.activePick === "background");

  if (!hasImage) {
    dom.pickModeStatus.textContent = "Load an image, then choose which point to sample next.";
  } else if (state.activePick) {
    dom.pickModeStatus.textContent = `Next click samples the ${PICK_LABELS[state.activePick].toLowerCase()} color from the image above.`;
  } else {
    dom.pickModeStatus.textContent = "Choose Pick Foreground or Pick Background, then click the image above.";
  }
}

function renderSamples() {
  renderSampleBlock({
    sample: state.foregroundSample,
    swatch: dom.foregroundSwatch,
    value: dom.foregroundValue,
    location: dom.foregroundLocation,
    emptyLabel: "Waiting for sample",
  });

  renderSampleBlock({
    sample: state.backgroundSample,
    swatch: dom.backgroundSwatch,
    value: dom.backgroundValue,
    location: dom.backgroundLocation,
    emptyLabel: "Waiting for sample",
  });
}

function renderSampleBlock({ sample, swatch, value, location, emptyLabel }) {
  if (!sample) {
    swatch.classList.add("empty");
    swatch.style.backgroundColor = "";
    value.textContent = emptyLabel;
    location.textContent = "No point selected yet.";
    return;
  }

  swatch.classList.remove("empty");
  swatch.style.backgroundColor = sample.hex;
  value.textContent = `${sample.hex} · RGB ${sample.rgb.join(", ")}`;
  location.textContent = `x ${sample.x + 1}, y ${sample.y + 1} · 3×3 median sample`;
}

function renderResults() {
  const hasBothSamples = Boolean(state.foregroundSample && state.backgroundSample);

  if (!hasBothSamples) {
    dom.resultsIntro.hidden = false;
    dom.resultsIntro.textContent = "Choose one foreground sample and one background sample to compute the accessibility scores.";
    dom.resultsBlock.hidden = true;
    return;
  }

  if (state.scoring.error) {
    dom.resultsIntro.hidden = false;
    dom.resultsIntro.textContent = `Scores are unavailable because the contrast libraries could not load: ${state.scoring.error}`;
    dom.resultsBlock.hidden = true;
    return;
  }

  if (!state.scoring.ready) {
    dom.resultsIntro.hidden = false;
    dom.resultsIntro.textContent = "Loading contrast scoring libraries...";
    dom.resultsBlock.hidden = true;
    return;
  }

  const wcagRatio = state.scoring.wcagRgb(
    state.foregroundSample.rgb,
    state.backgroundSample.rgb
  );
  const apcaLc = state.scoring.apcaContrast(
    state.scoring.srgbToY([...state.foregroundSample.rgb, 1]),
    state.scoring.srgbToY([...state.backgroundSample.rgb, 1])
  );
  const absoluteLc = Math.abs(apcaLc);
  const apcaStrength = getApcaStrengthLabel(absoluteLc);

  dom.resultsIntro.hidden = true;
  dom.resultsBlock.hidden = false;
  dom.wcagRatioValue.textContent = `${wcagRatio.toFixed(2)} : 1`;
  dom.apcaValue.textContent = apcaLc.toFixed(1);
  dom.apcaStrength.textContent = apcaStrength;

  applyWcagBadge(dom.wcagNormalBadge, wcagRatio >= WCAG_THRESHOLDS.normal);
  applyWcagBadge(dom.wcagLargeBadge, wcagRatio >= WCAG_THRESHOLDS.large);
  applyWcagBadge(dom.wcagGraphicsBadge, wcagRatio >= WCAG_THRESHOLDS.graphics);
}

function applyWcagBadge(element, passes) {
  element.textContent = passes ? "Pass" : "Fail";
  element.classList.toggle("pass", passes);
  element.classList.toggle("fail", !passes);
}

function getApcaStrengthLabel(value) {
  return APCA_STRENGTH_LABELS.find((entry) => value >= entry.minimum).label;
}

function renderPreview() {
  if (!state.image) {
    dom.imageCanvas.hidden = true;
    dom.canvasEmpty.hidden = false;
    dom.clearButton.hidden = true;
    dom.dropzone.classList.remove("ready", "pick-active", "has-image");
    return;
  }

  const availableWidth = Math.max(
    1,
    Math.round((dom.dropzone.clientWidth || state.image.width) - 36)
  );
  const scale = Math.min(1, availableWidth / state.image.width);
  const displayWidth = Math.max(1, Math.round(state.image.width * scale));
  const displayHeight = Math.max(1, Math.round(state.image.height * scale));
  const dpr = window.devicePixelRatio || 1;
  const context = dom.imageCanvas.getContext("2d");

  state.display.width = displayWidth;
  state.display.height = displayHeight;

  dom.imageCanvas.hidden = false;
  dom.canvasEmpty.hidden = true;
  dom.clearButton.hidden = false;
  dom.dropzone.classList.add("ready", "has-image");
  dom.dropzone.classList.toggle("pick-active", Boolean(state.activePick));

  dom.imageCanvas.width = Math.round(displayWidth * dpr);
  dom.imageCanvas.height = Math.round(displayHeight * dpr);
  dom.imageCanvas.style.width = `${displayWidth}px`;
  dom.imageCanvas.style.height = `${displayHeight}px`;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, displayWidth, displayHeight);
  context.imageSmoothingEnabled = scale < 1;
  context.drawImage(sourceCanvas, 0, 0, state.image.width, state.image.height, 0, 0, displayWidth, displayHeight);

  drawSampleMarker(context, state.backgroundSample, "B");
  drawSampleMarker(context, state.foregroundSample, "F");

  if (state.activePick && state.hoverSample) {
    drawHoverSampler(context, state.hoverSample, PICK_LABELS[state.activePick]);
  }
}

function drawSampleMarker(context, sample, label) {
  if (!sample || !state.image) {
    return;
  }

  const markerX = ((sample.x + 0.5) / state.image.width) * state.display.width;
  const markerY = ((sample.y + 0.5) / state.image.height) * state.display.height;

  context.save();
  context.beginPath();
  context.arc(markerX, markerY, 14, 0, Math.PI * 2);
  context.fillStyle = "rgba(0, 0, 0, 0.82)";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = "#ffffff";
  context.stroke();

  context.beginPath();
  context.arc(markerX, markerY, 9, 0, Math.PI * 2);
  context.fillStyle = sample.hex;
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = '700 11px "JetBrains Mono", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, markerX, markerY + 0.5);
  context.restore();
}

function drawHoverSampler(context, sample, modeLabel) {
  if (!sample || !state.image) {
    return;
  }

  const centerX = ((sample.x + 0.5) / state.image.width) * state.display.width;
  const centerY = ((sample.y + 0.5) / state.image.height) * state.display.height;
  const sourcePixelWidth = state.display.width / state.image.width;
  const sourcePixelHeight = state.display.height / state.image.height;
  const focusWidth = Math.max(18, sourcePixelWidth * 3);
  const focusHeight = Math.max(18, sourcePixelHeight * 3);
  const focusX = clamp(centerX - focusWidth / 2, 1, state.display.width - focusWidth - 1);
  const focusY = clamp(centerY - focusHeight / 2, 1, state.display.height - focusHeight - 1);

  const panelPadding = 8;
  const cellSize = 12;
  const gridSize = cellSize * 3;
  const panelWidth = gridSize + panelPadding * 2;
  const panelHeight = gridSize + 44;
  let panelX = centerX + 18;
  let panelY = centerY - panelHeight / 2;

  if (panelX + panelWidth > state.display.width - 8) {
    panelX = centerX - panelWidth - 18;
  }

  panelX = clamp(panelX, 8, state.display.width - panelWidth - 8);
  panelY = clamp(panelY, 8, state.display.height - panelHeight - 8);

  context.save();

  context.lineWidth = 2;
  context.strokeStyle = "rgba(255, 255, 255, 0.96)";
  context.strokeRect(focusX, focusY, focusWidth, focusHeight);
  context.lineWidth = 1;
  context.strokeStyle = "rgba(0, 0, 0, 0.88)";
  context.strokeRect(focusX + 2, focusY + 2, Math.max(0, focusWidth - 4), Math.max(0, focusHeight - 4));

  drawRoundedRect(context, panelX, panelY, panelWidth, panelHeight, 12);
  context.fillStyle = "rgba(17, 17, 17, 0.94)";
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.stroke();

  for (let index = 0; index < sample.cells.length; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const cellX = panelX + panelPadding + column * cellSize;
    const cellY = panelY + panelPadding + row * cellSize;
    const cellColor = sample.cells[index];

    context.fillStyle = rgbString(cellColor);
    context.fillRect(cellX, cellY, cellSize, cellSize);
    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.strokeRect(cellX + 0.5, cellY + 0.5, cellSize - 1, cellSize - 1);
  }

  const swatchY = panelY + panelPadding + gridSize + 8;
  context.fillStyle = sample.hex;
  context.fillRect(panelX + panelPadding, swatchY, 18, 18);
  context.strokeStyle = "rgba(255, 255, 255, 0.28)";
  context.strokeRect(panelX + panelPadding + 0.5, swatchY + 0.5, 17, 17);

  context.fillStyle = "#ffffff";
  context.font = '700 10px "JetBrains Mono", monospace';
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(modeLabel, panelX + panelPadding + 24, swatchY + 1);

  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = '500 9px "JetBrains Mono", monospace';
  context.fillText(sample.hex, panelX + panelPadding + 24, swatchY + 12);
  context.restore();
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function rgbString(rgb) {
  return `rgb(${rgb.join(", ")})`;
}
