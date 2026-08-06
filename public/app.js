const STORAGE_KEY = "local-ai-canvas-state-v2";
const SETTINGS_KEY = "local-ai-canvas-settings-v1";
const API_KEY_SESSION = "local-ai-canvas-api-key";
const SVG_OFFSET = 5000;

const els = {
  stage: document.getElementById("canvasStage"),
  viewport: document.getElementById("canvasViewport"),
  emptyHint: document.getElementById("emptyHint"),
  zoomLabel: document.getElementById("zoomLabel"),
  saveState: document.getElementById("saveState"),
  nodePalette: document.getElementById("nodePalette"),
  addNodeButton: document.getElementById("addNodeButton"),
  returnCanvasTool: document.getElementById("returnCanvasTool"),
  genericPromptLine: document.getElementById("genericPromptLine"),
  commerceTool: document.getElementById("commerceTool"),
  productVideoTool: document.getElementById("productVideoTool"),
  commerceWorkspace: document.getElementById("commerceWorkspace"),
  commerceWorkspaceUploadInput: document.getElementById("commerceWorkspaceUploadInput"),
  commerceWorkspacePromptMode: document.getElementById("commerceWorkspacePromptMode"),
  commerceWorkspacePromptButton: document.getElementById("commerceWorkspacePromptButton"),
  commerceWorkspacePrompt: document.getElementById("commerceWorkspacePrompt"),
  commerceWorkspaceAspect: document.getElementById("commerceWorkspaceAspect"),
  commerceWorkspaceQuality: document.getElementById("commerceWorkspaceQuality"),
  commerceWorkspaceResolution: document.getElementById("commerceWorkspaceResolution"),
  commerceWorkspaceStatus: document.getElementById("commerceWorkspaceStatus"),
  commerceWorkspaceGenerate: document.getElementById("commerceWorkspaceGenerate"),
  commerceAssetLibrary: document.getElementById("commerceAssetLibrary"),
  commerceAssetGrid: document.getElementById("commerceAssetGrid"),
  commerceAssetCount: document.getElementById("commerceAssetCount"),
  commerceCompositionPreview: document.getElementById("commerceCompositionPreview"),
  commerceLayerPanel: document.getElementById("commerceLayerPanel"),
  commerceLayerStatus: document.getElementById("commerceLayerStatus"),
  commerceCopyEditor: document.getElementById("commerceCopyEditor"),
  commerceCopyTitle: document.getElementById("commerceCopyTitle"),
  commerceCopyBenefits: document.getElementById("commerceCopyBenefits"),
  commerceLayerRestore: document.getElementById("commerceLayerRestore"),
  commerceExportButton: document.getElementById("commerceExportButton"),
  productVideoWorkspace: document.getElementById("productVideoWorkspace"),
  productVideoUploadInput: document.getElementById("productVideoUploadInput"),
  productVideoPrompt: document.getElementById("productVideoPrompt"),
  productVideoAspect: document.getElementById("productVideoAspect"),
  productVideoResolution: document.getElementById("productVideoResolution"),
  productVideoDuration: document.getElementById("productVideoDuration"),
  productVideoFps: document.getElementById("productVideoFps"),
  productVideoAudio: document.getElementById("productVideoAudio"),
  productVideoStatus: document.getElementById("productVideoStatus"),
  productVideoGenerate: document.getElementById("productVideoGenerate"),
  productVideoAssetLibrary: document.getElementById("productVideoAssetLibrary"),
  productVideoAssetGrid: document.getElementById("productVideoAssetGrid"),
  productVideoAssetCount: document.getElementById("productVideoAssetCount"),
  shortcutTool: document.getElementById("shortcutTool"),
  contextMenu: document.getElementById("contextMenu"),
  connectionCreateMenu: document.getElementById("connectionCreateMenu"),
  shortcutsModal: document.getElementById("shortcutsModal"),
  nodeControlDock: document.getElementById("nodeControlDock"),
  inspectorEmpty: document.getElementById("inspectorEmpty"),
  inspectorForm: document.getElementById("inspectorForm"),
  generationFields: document.getElementById("generationFields"),
  videoFields: document.getElementById("videoFields"),
  cardTitle: document.getElementById("cardTitle"),
  cardPrompt: document.getElementById("cardPrompt"),
  cardModel: document.getElementById("cardModel"),
  cardSize: document.getElementById("cardSize"),
  sizePicker: document.getElementById("sizePicker"),
  sizePickerButton: document.getElementById("sizePickerButton"),
  sizePickerMenu: document.getElementById("sizePickerMenu"),
  videoFrames: document.getElementById("videoFrames"),
  videoFps: document.getElementById("videoFps"),
  negativePrompt: document.getElementById("negativePrompt"),
  referenceList: document.getElementById("referenceList"),
  generateBtn: document.getElementById("generateBtn"),
  statusBox: document.getElementById("statusBox"),
  resultBox: document.getElementById("resultBox"),
  settingsModal: document.getElementById("settingsModal"),
  provider: document.getElementById("provider"),
  apiKey: document.getElementById("apiKey"),
  imageModel: document.getElementById("imageModel"),
  promptModel: document.getElementById("promptModel"),
  videoModel: document.getElementById("videoModel"),
  imageResponseFormat: document.getElementById("imageResponseFormat"),
  pollInterval: document.getElementById("pollInterval"),
  customEndpoint: document.getElementById("customEndpoint"),
  customMethod: document.getElementById("customMethod"),
  customBody: document.getElementById("customBody"),
  customResultPath: document.getElementById("customResultPath")
};

const state = {
  cards: [],
  edges: [],
  selectedId: null,
  selectedIds: [],
  viewport: { x: 300, y: 160, scale: 1 },
  drag: null,
  pan: null,
  selectionBox: null,
  connecting: null,
  clipboard: null,
  contextWorld: null,
  pendingConnection: null,
  pendingUploadConnection: null,
  suppressNextClick: false,
  workspaceMode: "canvas",
  commerceWorkspace: {
    productRef: null,
    modelRef: null,
    sceneRef: null,
    promptMode: "manual",
    prompt: "",
    promptHint: "",
    lastGeneratedPrompt: "",
    promptGeneration: 0,
    aspect: "3:4",
    quality: "high",
    resolution: "2k",
    status: "idle",
    promptStatus: "idle",
    error: "",
    promptError: "",
    results: [],
    activeResultId: "",
    copy: { title: "", benefits: [], specs: [] }
  },
  productVideoWorkspace: {
    productRef: null,
    prompt: "",
    aspect: "16:9",
    resolution: "720p",
    duration: 5,
    fps: 24,
    generateAudio: false,
    status: "idle",
    progress: 0,
    error: "",
    task: null,
    results: []
  }
};

let saveTimer = null;

const settings = {
  provider: "agnes",
  imageModel: "agnes-image-2.1-flash",
  promptModel: "agnes-2.0-flash",
  videoModel: "agnes-video-v2.0",
  imageResponseFormat: "url",
  pollInterval: 12000,
  customEndpoint: "",
  customMethod: "POST",
  customBody: '{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}"\n}',
  customResultPath: "data.0.url"
};

const MIN_VIDEO_POLL_INTERVAL = 12000;
const MAX_VIDEO_POLL_INTERVAL = 60000;

function normalizePollInterval(value) {
  return Math.max(MIN_VIDEO_POLL_INTERVAL, Number(value || MIN_VIDEO_POLL_INTERVAL));
}
const NODE_DEFS = {
  text: { title: "文本", label: "TEXT", w: 280, h: 240, prompt: "写一段用于生成视觉资产的提示词。" },
  image: { title: "图片", label: "IMAGE", w: 340, h: 270, prompt: "A cinematic banana-themed product photo, black studio background, neon lime rim light, high detail" },
  video: { title: "视频", label: "VIDEO", w: 350, h: 280, prompt: "A cinematic banana spaceship flying through a dark tropical neon city, smooth camera movement" },
  upload: { title: "参考资产", label: "ASSET", w: 310, h: 240, prompt: "上传的参考资产" }
};

const ASPECT_OPTIONS = [
  { id: "auto", label: "自适应", rw: 4, rh: 3 },
  { id: "1:1", label: "1:1", rw: 1, rh: 1 },
  { id: "2:3", label: "2:3", rw: 2, rh: 3 },
  { id: "3:2", label: "3:2", rw: 3, rh: 2 },
  { id: "4:5", label: "4:5", rw: 4, rh: 5 },
  { id: "5:4", label: "5:4", rw: 5, rh: 4 },
  { id: "16:9", label: "16:9", rw: 16, rh: 9 },
  { id: "9:16", label: "9:16", rw: 9, rh: 16 },
  { id: "21:9", label: "21:9", rw: 21, rh: 9 },
  { id: "3:4", label: "3:4", rw: 3, rh: 4 },
  { id: "4:3", label: "4:3", rw: 4, rh: 3 }
];

const IMAGE_QUALITY_OPTIONS = [
  { id: "low", label: "低" },
  { id: "medium", label: "中" },
  { id: "high", label: "高" }
];

const IMAGE_RESOLUTION_OPTIONS = [
  { id: "1k", label: "1k", base: 1024 },
  { id: "2k", label: "2k", base: 2048 },
  { id: "4k", label: "4k", base: 4096 }
];

const VIDEO_RESOLUTION_OPTIONS = [
  { id: "480p", label: "480p", base: 480 },
  { id: "720p", label: "720p", base: 720 },
  { id: "1080p", label: "1080p", base: 1080 },
  { id: "2k", label: "2k", base: 1440 },
  { id: "4k", label: "4k", base: 2160 },
  { id: "native1080p", label: "native1080p", base: 1080 },
  { id: "native4k", label: "native4k", base: 2160 }
];

const VIDEO_DURATION_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function uid(prefix = "card") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getApiKey() {
  return sessionStorage.getItem(API_KEY_SESSION) || "";
}

function setApiKey(value) {
  if (value.trim()) sessionStorage.setItem(API_KEY_SESSION, value.trim());
  else sessionStorage.removeItem(API_KEY_SESSION);
}

function load() {
  try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); } catch {}
  settings.pollInterval = normalizePollInterval(settings.pollInterval);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("local-ai-canvas-state-v1") || "{}");
    if (Array.isArray(saved.cards)) state.cards = saved.cards;
    if (Array.isArray(saved.edges)) state.edges = saved.edges;
    if (saved.viewport) state.viewport = saved.viewport;
    if (saved.commerceWorkspace) state.commerceWorkspace = normalizeCommerceWorkspace(saved.commerceWorkspace);
    if (saved.productVideoWorkspace) state.productVideoWorkspace = normalizeProductVideoWorkspace(saved.productVideoWorkspace);
    if (saved.workspaceMode === "commerce") state.workspaceMode = "commerce";
    if (saved.workspaceMode === "product-video") state.workspaceMode = "product-video";
  } catch {}
  migrateLegacyCommerceNodes();
  state.cards.forEach(card => normalizeCard(card));
  state.edges = state.edges.filter(edge => findCard(edge.from) && findCard(edge.to) && edge.from !== edge.to);
  els.apiKey.value = getApiKey();
  syncSettingsForm();
}

function normalizeCard(card) {
  const def = NODE_DEFS[card.type] || NODE_DEFS.text;
  const migrateCommerceDefaults = card.type === "commerce" && Number(card.commerceQualityVersion || 0) < 1;
  if (migrateCommerceDefaults) {
    if (!card.imageResolution || card.imageResolution === "1k") card.imageResolution = "2k";
    if (!card.aspect || card.aspect === "auto") card.aspect = "3:4";
    card.commerceQualityVersion = 1;
  }
  card.w = Number(card.w || def.w);
  card.h = Number(card.h || def.h);
  card.refs = Array.isArray(card.refs) ? card.refs : [];
  card.status = card.status || "idle";
  card.progress = Number(card.progress || 0);
  card.resultUrl = card.resultUrl || "";
  card.mime = card.mime || "";
  card.prompt = card.prompt || "";
  card.title = card.title || def.title;
  card.model = card.model || (card.type === "video" ? settings.videoModel : settings.imageModel);
  card.aspect = card.aspect || aspectFromSize(card.size || (card.type === "video" ? "1280x720" : "1024x768"));
  card.imageQuality = card.imageQuality || "medium";
  card.imageResolution = card.imageResolution || (card.type === "commerce" ? "2k" : "1k");
  card.videoResolution = card.videoResolution || "720p";
  card.duration = Number(card.duration || Math.max(4, Math.round((Number(card.num_frames || 121) - 1) / Number(card.frame_rate || 24))) || 5);
  card.generate_audio = typeof card.generate_audio === "boolean" ? card.generate_audio : true;
  card.size = card.size || (card.type === "video" ? sizeForVideo(card.aspect, card.videoResolution) : sizeForImage(card.aspect, card.imageResolution));
  card.num_frames = Number(card.num_frames || durationToFrames(card.duration, card.frame_rate || 24));
  card.frame_rate = Number(card.frame_rate || 24);
  card.negative_prompt = card.negative_prompt || "";
  card.productRef = normalizeCommerceRef(card.productRef);
  card.modelRef = normalizeCommerceRef(card.modelRef);
  card.sceneRef = normalizeCommerceRef(card.sceneRef);
  card.commerceActiveSlot = ["product", "model", "scene"].includes(card.commerceActiveSlot) ? card.commerceActiveSlot : "product";
  card.commercePromptMode = card.commercePromptMode === "auto" ? "auto" : "manual";
  card.promptHint = String(card.promptHint || "");
  card.lastGeneratedPrompt = String(card.lastGeneratedPrompt || "");
  card.promptGeneration = Math.max(0, Number(card.promptGeneration || 0));
  card.promptStatus = ["idle", "running", "done", "error"].includes(card.promptStatus) ? card.promptStatus : "idle";
  card.promptError = card.promptError || "";
  card.commerceResultIds = Array.isArray(card.commerceResultIds) ? card.commerceResultIds.filter(id => findCard(id)) : [];
  if (migrateCommerceDefaults && card.size === "1024x768") card.size = sizeForImage(card.aspect, card.imageResolution);
}

function save() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cards: state.cards,
    edges: state.edges,
    viewport: state.viewport,
    workspaceMode: state.workspaceMode,
    commerceWorkspace: state.commerceWorkspace,
    productVideoWorkspace: state.productVideoWorkspace
  }));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  els.saveState.textContent = `已保存 ${new Date().toLocaleTimeString()}`;
}

function normalizeCommerceRef(ref) {
  if (!ref || typeof ref !== "object" || !String(ref.url || "").trim() || !String(ref.mime || "").startsWith("image/")) return null;
  return { url: String(ref.url), name: String(ref.name || "图片"), mime: String(ref.mime) };
}

const COMMERCE_LAYER_TYPES = new Set(["product", "scene", "model", "copy", "decoration"]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function commerceLayer(type, options = {}) {
  const safeType = COMMERCE_LAYER_TYPES.has(type) ? type : "decoration";
  const width = Math.max(1, finiteNumber(options.width, 320));
  const height = Math.max(1, finiteNumber(options.height, 320));
  return {
    id: String(options.id || uid(`commerce-${safeType}`)),
    type: safeType,
    visible: options.visible !== false,
    locked: options.locked === true,
    opacity: Math.max(0, Math.min(1, finiteNumber(options.opacity, 1))),
    x: finiteNumber(options.x, 0),
    y: finiteNumber(options.y, 0),
    width,
    height,
    rotation: finiteNumber(options.rotation, 0),
    z: finiteNumber(options.z, 0),
    src: String(options.src || ""),
    name: String(options.name || ""),
    text: String(options.text || ""),
    fontSize: Math.max(12, finiteNumber(options.fontSize, 46)),
    fontWeight: String(options.fontWeight || "700"),
    color: String(options.color || "#f7f7ee"),
    background: String(options.background || "transparent"),
    align: ["left", "center", "right"].includes(options.align) ? options.align : "left"
  };
}

function commerceCompositionSize(workspace = {}) {
  const size = sizeForImage(workspace.aspect || "3:4", workspace.resolution || "2k");
  const [width, height] = String(size).split("x").map(value => Math.max(1, Math.round(Number(value) || 1)));
  return { width, height };
}

function createCommerceComposition(workspace = {}) {
  const { width, height } = commerceCompositionSize(workspace);
  const product = normalizeCommerceRef(workspace.productRef);
  const productWidth = Math.round(width * 0.68);
  const productHeight = Math.round(height * 0.68);
  return {
    version: 1,
    width,
    height,
    background: "#1a211c",
    sourceProduct: product,
    selectedLayerId: product ? "" : "",
    layers: product ? [commerceLayer("product", {
      src: product.url,
      name: product.name,
      x: Math.round((width - productWidth) / 2),
      y: Math.round((height - productHeight) / 2),
      width: productWidth,
      height: productHeight,
      locked: true,
      z: 20
    })] : []
  };
}

function normalizeCommerceComposition(value, fallback = {}) {
  const base = createCommerceComposition(fallback);
  const source = value && typeof value === "object" ? value : {};
  const width = Math.max(1, Math.round(finiteNumber(source.width, base.width)));
  const height = Math.max(1, Math.round(finiteNumber(source.height, base.height)));
  const sourceProduct = normalizeCommerceRef(source.sourceProduct) || normalizeCommerceRef(fallback.productRef);
  const layers = Array.isArray(source.layers)
    ? source.layers.filter(layer => layer && COMMERCE_LAYER_TYPES.has(layer.type)).map(layer => commerceLayer(layer.type, {
      ...layer,
      x: finiteNumber(layer.x),
      y: finiteNumber(layer.y),
      width: Math.min(width, Math.max(1, finiteNumber(layer.width, 320))),
      height: Math.min(height, Math.max(1, finiteNumber(layer.height, 320)))
    }))
    : base.layers;
  if (sourceProduct && !layers.some(layer => layer.type === "product")) {
    layers.unshift(commerceLayer("product", { src: sourceProduct.url, name: sourceProduct.name, locked: true, z: 20 }));
  }
  return {
    version: 1,
    width,
    height,
    background: String(source.background || base.background),
    sourceProduct,
    selectedLayerId: String(source.selectedLayerId || layers[0]?.id || ""),
    layers: layers.sort((a, b) => a.z - b.z)
  };
}

function commerceCopyLayer(copy = {}, composition = {}) {
  const title = String(copy.title || "").trim();
  const benefits = Array.isArray(copy.benefits) ? copy.benefits.map(item => String(item || "").trim()).filter(Boolean).slice(0, 3) : [];
  if (!title && !benefits.length) return null;
  const width = Math.max(1, finiteNumber(composition.width, 1024));
  const height = Math.max(1, finiteNumber(composition.height, 1280));
  return commerceLayer("copy", {
    id: "commerce-copy",
    text: [title, ...benefits.map(item => `• ${item}`)].filter(Boolean).join("\n"),
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.08),
    width: Math.round(width * 0.52),
    height: Math.round(height * 0.34),
    fontSize: Math.max(30, Math.round(width / 24)),
    color: "#ffffff",
    z: 40
  });
}

function commerceLoadImage(src, label = "图片") {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error(`${label}没有可用图片资源。`));
      return;
    }
    const image = new Image();
    if (!String(src).startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`${label}加载失败，无法导出。`));
    image.src = src;
  });
}

const commerceCutoutCache = new Map();

async function commercePrepareProductImage(src) {
  if (!String(src).startsWith("data:image/")) return src;
  if (commerceCutoutCache.has(src)) return commerceCutoutCache.get(src);
  const image = await commerceLoadImage(src, "产品图");
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  if (!canvas.width || !canvas.height) return src;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = pixels;
  const cornerPoints = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  const corners = cornerPoints.map(([x, y]) => {
    const offset = (y * width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
  });
  const brightCorners = corners.filter(([r, g, b, a]) => a > 0 && (r + g + b) / 3 > 210 && Math.max(r, g, b) - Math.min(r, g, b) < 32);
  if (brightCorners.length < 3) {
    commerceCutoutCache.set(src, src);
    return src;
  }
  const bg = brightCorners.reduce((sum, color) => color.map((value, index) => sum[index] + value), [0, 0, 0, 0]).map(value => value / brightCorners.length);
  const visited = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * 4;
    const distance = Math.abs(data[offset] - bg[0]) + Math.abs(data[offset + 1] - bg[1]) + Math.abs(data[offset + 2] - bg[2]);
    if (data[offset + 3] === 0 || distance <= 72) {
      visited[index] = 1;
      queue.push(index);
    }
  };
  for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
  for (let y = 1; y < height - 1; y += 1) { push(0, y); push(width - 1, y); }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }
  ctx.putImageData(pixels, 0, 0);
  const prepared = canvas.toDataURL("image/png");
  commerceCutoutCache.set(src, prepared);
  return prepared;
}

function commerceDrawText(ctx, layer) {
  const lines = String(layer.text || "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return;
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
  ctx.rotate(layer.rotation * Math.PI / 180);
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
  ctx.fillStyle = layer.color;
  const startX = layer.align === "left" ? -layer.width / 2 : layer.align === "right" ? layer.width / 2 : 0;
  let y = -layer.height / 2;
  lines.slice(0, 6).forEach((line, index) => {
    const text = line.slice(0, index === 0 ? 28 : 32);
    ctx.fillText(text, startX, y, layer.width);
    y += layer.fontSize * (index === 0 ? 1.28 : 1.12);
  });
  ctx.restore();
}

async function renderCommerceComposition(composition, target) {
  if (!target || typeof target.getContext !== "function") throw new Error("合成预览画布不可用。");
  const safe = normalizeCommerceComposition(composition);
  const ctx = target.getContext("2d");
  target.width = safe.width;
  target.height = safe.height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, safe.width, safe.height);
  ctx.fillStyle = safe.background;
  ctx.fillRect(0, 0, safe.width, safe.height);
  const layers = safe.layers.filter(layer => layer.visible).sort((a, b) => a.z - b.z);
  for (const layer of layers) {
    if (layer.type === "copy") {
      commerceDrawText(ctx, layer);
      continue;
    }
    if (!layer.src) continue;
    const imageSrc = layer.type === "product" ? await commercePrepareProductImage(layer.src) : layer.src;
    const image = await commerceLoadImage(imageSrc, layer.name || layer.type);
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.drawImage(image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    ctx.restore();
  }
  return target;
}

function normalizeCommerceWorkspace(workspace = {}) {
  const validStatus = ["idle", "running", "done", "error"];
  return {
    ...state.commerceWorkspace,
    ...workspace,
    productRef: normalizeCommerceRef(workspace.productRef),
    modelRef: normalizeCommerceRef(workspace.modelRef),
    sceneRef: normalizeCommerceRef(workspace.sceneRef),
    promptMode: workspace.promptMode === "auto" ? "auto" : "manual",
    prompt: String(workspace.prompt || ""),
    promptHint: String(workspace.promptHint || ""),
    lastGeneratedPrompt: String(workspace.lastGeneratedPrompt || ""),
    promptGeneration: Math.max(0, Number(workspace.promptGeneration || 0)),
    aspect: ASPECT_OPTIONS.some(option => option.id === workspace.aspect) ? workspace.aspect : "3:4",
    quality: IMAGE_QUALITY_OPTIONS.some(option => option.id === workspace.quality) ? workspace.quality : "high",
    resolution: IMAGE_RESOLUTION_OPTIONS.some(option => option.id === workspace.resolution) ? workspace.resolution : "2k",
    status: validStatus.includes(workspace.status) ? workspace.status : "idle",
    promptStatus: validStatus.includes(workspace.promptStatus) ? workspace.promptStatus : "idle",
    error: String(workspace.error || ""),
    promptError: String(workspace.promptError || ""),
    activeResultId: String(workspace.activeResultId || ""),
    copy: normalizeCommerceCopy(workspace.copy),
    results: Array.isArray(workspace.results) ? workspace.results.filter(result => result?.url).map(result => ({
      id: String(result.id || uid("commerce-result")),
      url: String(result.url),
      previewUrl: String(result.previewUrl || result.url),
      mime: String(result.mime || "image/png"),
      prompt: String(result.prompt || ""),
      createdAt: Number(result.createdAt || Date.now()),
      status: "done",
      copy: normalizeCommerceCopy(result.copy),
      composition: normalizeCommerceComposition(result.composition, workspace)
    })) : []
  };
}

function normalizeCommerceCopy(copy = {}) {
  const source = copy && typeof copy === "object" ? copy : {};
  return {
    title: String(source.title || "").trim().slice(0, 28),
    benefits: Array.isArray(source.benefits) ? source.benefits.map(item => String(item || "").trim()).filter(Boolean).slice(0, 3) : [],
    specs: Array.isArray(source.specs) ? source.specs.map(item => String(item || "").trim()).filter(Boolean).slice(0, 5) : []
  };
}

function normalizeProductVideoWorkspace(workspace = {}) {
  const validStatus = ["idle", "running", "done", "error"];
  const validResolutions = ["480p", "720p", "1080p"];
  const task = workspace.task && typeof workspace.task === "object"
    ? {
      video_id: String(workspace.task.video_id || ""),
      task_id: String(workspace.task.task_id || "")
    }
    : null;
  return {
    ...state.productVideoWorkspace,
    ...workspace,
    productRef: normalizeCommerceRef(workspace.productRef),
    prompt: String(workspace.prompt || ""),
    aspect: ASPECT_OPTIONS.some(option => option.id === workspace.aspect) ? workspace.aspect : "16:9",
    resolution: validResolutions.includes(workspace.resolution) ? workspace.resolution : "720p",
    duration: [4, 5, 6, 8].includes(Number(workspace.duration)) ? Number(workspace.duration) : 5,
    fps: [24, 30].includes(Number(workspace.fps)) ? Number(workspace.fps) : 24,
    generateAudio: workspace.generateAudio === true,
    status: validStatus.includes(workspace.status) ? workspace.status : "idle",
    progress: Math.max(0, Math.min(100, Number(workspace.progress || 0))),
    error: String(workspace.error || ""),
    task: task?.video_id || task?.task_id ? task : null,
    results: Array.isArray(workspace.results) ? workspace.results.filter(result => result?.url).map(result => ({
      id: String(result.id || uid("product-video-result")),
      url: String(result.url),
      mime: String(result.mime || "video/mp4"),
      prompt: String(result.prompt || ""),
      createdAt: Number(result.createdAt || Date.now()),
      status: "done"
    })) : []
  };
}

function migrateLegacyCommerceNodes() {
  const legacy = state.cards.filter(card => card.type === "commerce");
  if (!legacy.length) return;
  const source = legacy[0];
  const workspace = state.commerceWorkspace;
  workspace.productRef = workspace.productRef || normalizeCommerceRef(source.productRef);
  workspace.modelRef = workspace.modelRef || normalizeCommerceRef(source.modelRef);
  workspace.sceneRef = workspace.sceneRef || normalizeCommerceRef(source.sceneRef);
  workspace.prompt = workspace.prompt || String(source.prompt || "");
  workspace.promptMode = source.commercePromptMode === "auto" ? "auto" : workspace.promptMode;
  const legacyIds = new Set(legacy.map(card => card.id));
  state.cards = state.cards.filter(card => !legacyIds.has(card.id));
  state.edges = state.edges.filter(edge => !legacyIds.has(edge.from) && !legacyIds.has(edge.to));
}


function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

function syncSettingsForm() {
  els.provider.value = settings.provider;
  els.imageModel.value = settings.imageModel;
  els.promptModel.value = settings.promptModel || "agnes-2.0-flash";
  els.videoModel.value = settings.videoModel;
  els.imageResponseFormat.value = settings.imageResponseFormat;
  settings.pollInterval = normalizePollInterval(settings.pollInterval);
  els.pollInterval.value = String(settings.pollInterval);
  els.customEndpoint.value = settings.customEndpoint;
  els.customMethod.value = settings.customMethod;
  els.customBody.value = settings.customBody;
  els.customResultPath.value = settings.customResultPath;
}

function collectSettings() {
  settings.provider = els.provider.value;
  settings.imageModel = els.imageModel.value;
  settings.promptModel = els.promptModel.value.trim() || "agnes-2.0-flash";
  settings.videoModel = els.videoModel.value.trim() || "agnes-video-v2.0";
  settings.imageResponseFormat = els.imageResponseFormat.value;
  settings.pollInterval = normalizePollInterval(els.pollInterval.value);
  settings.customEndpoint = els.customEndpoint.value.trim();
  settings.customMethod = els.customMethod.value;
  settings.customBody = els.customBody.value;
  settings.customResultPath = els.customResultPath.value.trim();
  setApiKey(els.apiKey.value);
  save();
}

function findCard(id) {
  return state.cards.find(card => card.id === id) || null;
}

function selectedCard() {
  return findCard(state.selectedId);
}

function optionById(options, id, fallbackId) {
  return options.find(option => option.id === id) || options.find(option => option.id === fallbackId) || options[0];
}

function even(value) {
  return Math.max(64, Math.round(Number(value || 64) / 2) * 2);
}

function aspectFromSize(size) {
  const [width, height] = String(size || "").split("x").map(Number);
  if (!width || !height) return "auto";
  const ratio = width / height;
  const found = ASPECT_OPTIONS.find(option => option.id !== "auto" && Math.abs(option.rw / option.rh - ratio) < 0.025);
  return found?.id || "auto";
}

function sizeForImage(aspectId = "auto", resolutionId = "1k") {
  const aspect = optionById(ASPECT_OPTIONS, aspectId, "auto");
  const resolution = optionById(IMAGE_RESOLUTION_OPTIONS, resolutionId, "1k");
  const width = resolution.base;
  const height = width * aspect.rh / aspect.rw;
  return `${even(width)}x${even(height)}`;
}

function agnesImageSize(resolutionId = "1k") {
  return ({ "1k": "1K", "2k": "2K", "4k": "4K" }[resolutionId] || "1K");
}

function agnesImageRatio(aspectId = "auto", fallback = "1:1") {
  const supported = new Set(["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"]);
  const aliases = { auto: fallback, "4:5": "3:4", "5:4": "4:3" };
  const ratio = aliases[aspectId] || aspectId;
  return supported.has(ratio) ? ratio : fallback;
}

const COMMERCE_IMAGE_GUARDRAILS = [
  "商品身份锁定：第一张参考图是唯一权威商品，只允许改变背景、光线和构图，不得重设计、重新建模、拉伸、液化或改变商品比例。",
  "完整保留商品的外形轮廓、数量、结构、材质、颜色、接口、按键、包装、标识位置和可见细节；不得添加、删除、合并或替换部件。",
  "模特图和场景图仅用于人物展示方式、环境和光线，不能替换或改造商品；商品要清晰、完整、占主要视觉面积，避免手部遮挡和复杂动作。",
  "不要生成任何可读文字、中文、英文、数字、字母、标签、标题、logo、水印或界面元素；所有卖点用产品细节、使用动作和构图来表达，并为后期中文排版保留干净留白。"
].join("\n");

const COMMERCE_SCENE_GUARDRAILS = [
  "scene-only：只生成有色彩、有层次、有商业摄影光影的背景与环境，不要生成商品、产品包装、人物手中的产品或任何重复主体。",
  "允许使用品牌色、渐变、真实道具、材质对比、生活方式场景和方向性光线；不要默认纯白背景，除非用户明确要求白底。",
  "为后续叠加真实产品和中文文案预留自然的构图空间；不要生成任何可读文字、中文、英文、数字、字母、logo、水印或界面元素。"
].join("\n");

function commerceImagePrompt(prompt, sceneOnly = false) {
  return [String(prompt || "").trim(), sceneOnly ? COMMERCE_SCENE_GUARDRAILS : COMMERCE_IMAGE_GUARDRAILS].filter(Boolean).join("\n");
}

function agnesImageRequest(card, apiKey, prompt, imageRefs = [], imageRoles = []) {
  const model = card.model || settings.imageModel;
  const request = {
    apiKey,
    model,
    prompt: card.type === "commerce" ? commerceImagePrompt(prompt, card.sceneOnly === true) : prompt,
    quality: card.imageQuality || "medium",
    responseFormat: settings.imageResponseFormat,
    imageRefs,
    imageRoles,
    workflow: card.type || undefined,
    sceneOnly: card.sceneOnly === true ? true : undefined
  };
  if (model === "agnes-image-2.1-flash") {
    request.size = agnesImageSize(card.imageResolution || "1k");
    request.ratio = agnesImageRatio(card.aspect, card.type === "commerce" ? "3:4" : "1:1");
  } else {
    request.size = card.size || "1024x768";
  }
  return request;
}

function commerceOutputSize(card) {
  const aspect = card.aspect === "auto" ? "3:4" : card.aspect;
  return sizeForImage(aspect, card.imageResolution || "1k");
}

function sizeForVideo(aspectId = "auto", resolutionId = "720p") {
  const aspect = optionById(ASPECT_OPTIONS, aspectId, "auto");
  const resolution = optionById(VIDEO_RESOLUTION_OPTIONS, resolutionId, "720p");
  if (aspect.rw >= aspect.rh) {
    return `${even(resolution.base * aspect.rw / aspect.rh)}x${even(resolution.base)}`;
  }
  return `${even(resolution.base)}x${even(resolution.base * aspect.rh / aspect.rw)}`;
}

function durationToFrames(duration, fps = 24) {
  return Math.max(9, Math.round(Number(duration || 5) * Number(fps || 24)) + 1);
}

function labelFor(options, id, fallbackId) {
  return optionById(options, id, fallbackId).label;
}

function selectedIds() {
  const ids = Array.isArray(state.selectedIds) ? state.selectedIds.filter(id => findCard(id)) : [];
  if (state.selectedId && findCard(state.selectedId) && !ids.includes(state.selectedId)) ids.unshift(state.selectedId);
  return [...new Set(ids)];
}

function setSelected(ids) {
  const unique = [...new Set((ids || []).filter(id => findCard(id)))];
  state.selectedIds = unique;
  state.selectedId = unique[0] || null;
}

function selectSingle(id) {
  setSelected(id ? [id] : []);
}

function isCardSelected(id) {
  return selectedIds().includes(id);
}

function clientToWorld(clientX, clientY) {
  const rect = els.viewport.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.viewport.x) / state.viewport.scale,
    y: (clientY - rect.top - state.viewport.y) / state.viewport.scale
  };
}

function viewportCenter() {
  const rect = els.viewport.getBoundingClientRect();
  return clientToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function applyViewport() {
  const { x, y, scale } = state.viewport;
  els.stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  els.zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

function normalizedSelectionRect(box) {
  if (!box) return null;
  const left = Math.min(box.startWorld.x, box.currentWorld.x);
  const top = Math.min(box.startWorld.y, box.currentWorld.y);
  const right = Math.max(box.startWorld.x, box.currentWorld.x);
  const bottom = Math.max(box.startWorld.y, box.currentWorld.y);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function selectionHitCards(rect) {
  if (!rect) return [];
  return state.cards.filter(card => !(
    card.x + card.w < rect.left ||
    card.x > rect.right ||
    card.y + card.h < rect.top ||
    card.y > rect.bottom
  ));
}

function renderSelectionBox() {
  const rect = normalizedSelectionRect(state.selectionBox);
  if (!rect) return "";
  return `<div class="selection-box" style="left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px"></div>`;
}

function createCard(type, options = {}) {
  const def = NODE_DEFS[type] || NODE_DEFS.text;
  const center = viewportCenter();
  const defaultX = center.x - def.w / 2 + state.cards.length * 18;
  const defaultY = center.y - def.h / 2 + state.cards.length * 18;
  const defaultAspect = type === "commerce" ? "3:4" : "auto";
  const defaultImageResolution = type === "commerce" ? "2k" : "1k";
  const card = {
    id: uid(type),
    type,
    x: Math.round(Number.isFinite(options.x) ? options.x : defaultX),
    y: Math.round(Number.isFinite(options.y) ? options.y : defaultY),
    w: def.w,
    h: def.h,
    title: options.title || def.title,
    prompt: options.prompt || def.prompt || "",
    status: "idle",
    progress: 0,
    resultUrl: options.resultUrl || "",
    mime: options.mime || "",
    refs: [],
    aspect: defaultAspect,
    imageQuality: "medium",
    imageResolution: defaultImageResolution,
    videoResolution: "720p",
    duration: 5,
    generate_audio: true,
    size: type === "video" ? sizeForVideo("auto", "720p") : sizeForImage(defaultAspect, defaultImageResolution),
    model: type === "video" ? settings.videoModel : settings.imageModel,
    num_frames: durationToFrames(5, 24),
    frame_rate: 24,
    negative_prompt: "",
    productRef: null,
    modelRef: null,
    sceneRef: null,
    commerceActiveSlot: "product",
    commercePromptMode: "manual",
    promptHint: "",
    lastGeneratedPrompt: "",
    promptGeneration: 0,
    promptStatus: "idle",
    promptError: "",
    commerceResultIds: [],
    commerceQualityVersion: type === "commerce" ? 1 : 0,
    task: null,
    error: ""
  };
  state.cards.push(card);
  selectSingle(card.id);
  els.nodePalette.classList.add("hidden");
  render();
  save();
  return card;
}

function rectsOverlap(a, b, gap = 28) {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function resultSiblings(source) {
  return state.edges
    .filter(edge => edge.from === source.id)
    .map(edge => findCard(edge.to))
    .filter(card => card && card.type === "upload" && card.resultUrl);
}

function resultPosition(source, resultType, w, h) {
  const siblings = resultSiblings(source);
  const startSlot = siblings.length;
  const columns = 3;
  const gapX = 42;
  const gapY = 34;
  for (let step = 0; step < 36; step += 1) {
    const slot = startSlot + step;
    const col = slot % columns;
    const row = Math.floor(slot / columns);
    const candidate = {
      x: source.x + source.w + 70 + col * (w + gapX),
      y: source.y + row * (h + gapY),
      w,
      h
    };
    const blocked = state.cards.some(card => card.id !== source.id && rectsOverlap(candidate, card));
    if (!blocked) return candidate;
  }
  return {
    x: source.x + source.w + 70,
    y: source.y + (startSlot + 1) * (h + gapY),
    w,
    h
  };
}

function duplicateResultCard(source, resultType, resultUrl, mime) {
  const w = resultType === "video" ? 340 : 310;
  const h = resultType === "video" ? 260 : 240;
  const position = resultPosition(source, resultType, w, h);
  const index = resultSiblings(source).length + 1;
  const card = {
    ...source,
    id: uid(resultType),
    type: "upload",
    title: `${resultType === "video" ? "生成视频" : "生成图片"} ${index}`,
    x: position.x,
    y: position.y,
    w,
    h,
    status: "done",
    progress: 100,
    resultUrl,
    mime,
    prompt: source.prompt,
    refs: [],
    task: null,
    error: ""
  };
  state.cards.push(card);
  state.edges.push({ id: uid("edge"), from: source.id, to: card.id });
}

function commerceResultPosition(source, w, h) {
  const start = {
    x: source.x + source.w + 70,
    y: source.y,
    w,
    h
  };
  for (let step = 0; step < 40; step += 1) {
    const col = step % 3;
    const row = Math.floor(step / 3);
    const candidate = {
      x: start.x + col * (w + 42),
      y: start.y + row * (h + 34),
      w,
      h
    };
    if (!state.cards.some(card => rectsOverlap(candidate, card))) return candidate;
  }
  return { x: start.x, y: start.y + state.cards.length * 24, w, h };
}

function createCommerceResultCard(source, resultUrl, prompt, mime = "image/png") {
  const w = 310;
  const h = 240;
  const position = commerceResultPosition(source, w, h);
  const index = source.commerceResultIds.length + 1;
  const card = createCard("upload", {
    x: position.x,
    y: position.y,
    title: `电商宣传图 ${index}`,
    resultUrl,
    mime
  });
  Object.assign(card, {
    w,
    h,
    status: "done",
    progress: 100,
    prompt,
    error: "",
    sourceWorkflow: "commerce"
  });
  source.commerceResultIds.push(card.id);
  selectSingle(source.id);
  render();
  save();
  return card;
}

function typeLabel(type) {
  return (NODE_DEFS[type] && NODE_DEFS[type].label) || type.toUpperCase();
}

function statusLabel(card) {
  if (card.status === "running") return "生成中";
  if (card.status === "done") return "完成";
  if (card.status === "error") return "失败";
  if (card.status === "queued") return "排队";
  return typeLabel(card.type);
}

function statusClass(card) {
  if (card.status === "running" || card.status === "queued") return "running";
  if (card.status === "done") return "done";
  if (card.status === "error") return "error";
  return "";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function selectedCommerceCard() {
  const card = selectedCard();
  return card?.type === "commerce" ? card : null;
}

function commerceWorkspaceRefFor(role) {
  return state.commerceWorkspace?.[`${role}Ref`] || null;
}

function commerceWorkspaceReferences() {
  const roles = ["product", "model", "scene"];
  const refs = roles.map(role => commerceWorkspaceRefFor(role)).filter(Boolean);
  return {
    imageRefs: refs.map(ref => ref.url),
    imageRoles: roles.filter(role => commerceWorkspaceRefFor(role))
  };
}

function commerceWorkspaceSceneReferences() {
  const roles = ["model", "scene"];
  const refs = roles.map(role => commerceWorkspaceRefFor(role)).filter(Boolean);
  return {
    imageRefs: refs.map(ref => ref.url),
    imageRoles: roles.filter(role => commerceWorkspaceRefFor(role))
  };
}

function commerceWorkspaceSlotMarkup(role, label, required) {
  const ref = commerceWorkspaceRefFor(role);
  const media = ref
    ? `<img src="${escapeAttr(ref.url)}" alt="${escapeAttr(ref.name)}" draggable="false"><span class="slot-remove" data-commerce-workspace-remove="${role}" title="移除">×</span>`
    : `<span class="slot-plus">＋</span>`;
  return `<span class="slot-media">${media}</span><strong>${escapeHtml(ref?.name || label)}</strong><em>${ref ? "点击替换" : required ? "必填" : "可选"}</em>`;
}

function commerceWorkspaceStatusText() {
  const workspace = state.commerceWorkspace;
  if (workspace.promptStatus === "running") return "Agnes 正在根据参考图提炼卖点和画面提示词…";
  if (workspace.promptStatus === "error") return workspace.promptError || "提示词生成失败，请重试。";
  if (workspace.status === "running") return "正在生成电商宣传图，请稍候…";
  if (workspace.status === "error") return workspace.error || "生成失败，请检查设置后重试。";
  if (!workspace.productRef) return "先上传商品图，再开始生成。";
  if (workspace.promptMode === "auto" && !workspace.prompt) return "已开启自动提示词，请先点击 Agnes 写提示词。";
  if (workspace.results.length) return `已生成 ${workspace.results.length} 个临时结果，可加入无限画布或下载。`;
  return "提示词准备好后，点击生成宣传图。";
}

function renderCommerceWorkspace() {
  const workspace = state.commerceWorkspace;
  if (!els.commerceWorkspace || !workspace) return;
  els.commerceWorkspacePromptMode.checked = workspace.promptMode === "auto";
  els.commerceWorkspacePromptButton.disabled = workspace.promptMode !== "auto" || workspace.promptStatus === "running" || workspace.status === "running";
  if (document.activeElement !== els.commerceWorkspacePrompt) els.commerceWorkspacePrompt.value = workspace.prompt || "";
  els.commerceWorkspaceAspect.value = workspace.aspect;
  els.commerceWorkspaceQuality.value = workspace.quality;
  els.commerceWorkspaceResolution.value = workspace.resolution;
  els.commerceWorkspaceStatus.textContent = commerceWorkspaceStatusText();
  els.commerceWorkspaceStatus.className = `commerce-workspace-status ${workspace.status === "error" || workspace.promptStatus === "error" ? "error" : workspace.status === "running" || workspace.promptStatus === "running" ? "running" : workspace.results.length ? "success" : ""}`;
  els.commerceWorkspaceGenerate.disabled = workspace.status === "running" || workspace.promptStatus === "running" || !workspace.productRef || (workspace.promptMode === "auto" && !workspace.prompt.trim());
  els.commerceAssetCount.textContent = `${workspace.results.length} 个结果`;
  document.querySelectorAll("[data-commerce-workspace-slot]").forEach(button => {
    const role = button.dataset.commerceWorkspaceSlot;
    button.classList.toggle("required", role === "product");
    button.classList.toggle("error", role === "product" && workspace.status === "error" && !commerceWorkspaceRefFor(role));
    button.innerHTML = commerceWorkspaceSlotMarkup(role, role === "product" ? "商品图" : role === "model" ? "模特图" : "场景图", role === "product");
  });
  const activeResult = activeCommerceWorkspaceResult();
  if (activeResult && workspace.activeResultId !== activeResult.id) workspace.activeResultId = activeResult.id;
  renderCommerceLayerPanel(activeResult);
  syncCommerceCopyEditor(activeResult);
  if (els.commerceLayerRestore) els.commerceLayerRestore.disabled = !activeResult?.composition?.sourceProduct;
  if (els.commerceExportButton) els.commerceExportButton.disabled = !activeResult?.composition;
  renderActiveCommerceComposition(activeResult);
  els.commerceAssetGrid.innerHTML = workspace.results.length
    ? workspace.results.map(result => `
      <article class="commerce-asset-card ${result.id === workspace.activeResultId ? "active" : ""}" data-commerce-result-id="${escapeAttr(result.id)}">
        <div class="commerce-asset-media"><img src="${escapeAttr(result.previewUrl || result.url)}" alt="电商宣传图" draggable="false">
          <div class="commerce-asset-overlay"><button type="button" data-commerce-preview-action="add" data-commerce-result-id="${escapeAttr(result.id)}">加入画布</button><button type="button" data-commerce-preview-action="download" data-commerce-result-id="${escapeAttr(result.id)}">下载本地</button></div>
          <div class="commerce-asset-large"><img src="${escapeAttr(result.previewUrl || result.url)}" alt="电商宣传图大图" draggable="false"></div>
        </div>
        <div class="commerce-asset-meta"><strong>电商宣传图</strong><span>${new Date(result.createdAt).toLocaleTimeString()}</span></div>
      </article>`).join("")
    : `<div class="commerce-assets-empty"><span>🍌</span><strong>临时资产库还是空的</strong><em>生成结果会显示在这里，加入画布前不会改变无限画布。</em></div>`;
}

function productVideoSlotMarkup() {
  const ref = state.productVideoWorkspace.productRef;
  const media = ref
    ? `<img src="${escapeAttr(ref.url)}" alt="${escapeAttr(ref.name)}" draggable="false"><span class="slot-remove" data-product-video-remove="product" title="移除">×</span>`
    : `<span class="slot-plus">＋</span>`;
  return `<span class="slot-media">${media}</span><strong>${escapeHtml(ref?.name || "上传产品图")}</strong><em>${ref ? "点击替换" : "必填"}</em>`;
}

function productVideoPrompt() {
  const custom = String(state.productVideoWorkspace.prompt || "").trim();
  return [
    custom,
    "Create one continuous e-commerce product showcase video in a single coherent scene.",
    "Keep the uploaded product exactly unchanged, centered, fully visible, and faithful to its shape, material, color, logo, and visible details.",
    "Use smooth commercial camera motion, realistic studio lighting, clean composition, subtle natural product movement, and clear emphasis on visible product features.",
    "Do not create multiple shots, split screens, storyboards, long text overlays, unsupported claims, dangerous actions, or sensitive content."
  ].filter(Boolean).join("\n");
}

function productVideoStatusText() {
  const workspace = state.productVideoWorkspace;
  if (workspace.status === "running") return workspace.error || (workspace.progress ? `正在生成产品视频… ${Math.round(workspace.progress)}%` : "正在创建产品视频任务…");
  if (workspace.status === "error") return workspace.error || "产品视频生成失败，请重试。";
  if (!workspace.productRef) return "先上传产品图，再开始生成。";
  if (workspace.results.length) return `已生成 ${workspace.results.length} 个视频结果，可加入无限画布或下载。`;
  return "参数准备好后，点击生成产品视频。";
}

function renderProductVideoWorkspace() {
  const workspace = state.productVideoWorkspace;
  if (!els.productVideoWorkspace || !workspace) return;
  if (document.activeElement !== els.productVideoPrompt) els.productVideoPrompt.value = workspace.prompt || "";
  els.productVideoAspect.value = workspace.aspect;
  els.productVideoResolution.value = workspace.resolution;
  els.productVideoDuration.value = String(workspace.duration);
  els.productVideoFps.value = String(workspace.fps);
  els.productVideoAudio.value = String(workspace.generateAudio);
  els.productVideoStatus.textContent = productVideoStatusText();
  els.productVideoStatus.className = `commerce-workspace-status ${workspace.status === "error" ? "error" : workspace.status === "running" ? "running" : workspace.results.length ? "success" : ""}`;
  els.productVideoGenerate.disabled = workspace.status === "running" || !workspace.productRef;
  document.querySelectorAll("[data-product-video-slot]").forEach(button => {
    button.classList.toggle("error", workspace.status === "error" && !workspace.productRef);
    button.innerHTML = productVideoSlotMarkup();
  });
  els.productVideoAssetCount.textContent = `${workspace.results.length} 个结果`;
  els.productVideoAssetGrid.innerHTML = workspace.results.length
    ? workspace.results.map(result => `
      <article class="commerce-asset-card product-video-asset-card" data-product-video-result-id="${escapeAttr(result.id)}">
        <div class="commerce-asset-media"><video src="${escapeAttr(result.url)}" controls preload="metadata" playsinline></video>
          <div class="commerce-asset-overlay"><button type="button" data-product-video-action="add" data-product-video-result-id="${escapeAttr(result.id)}">加入画布</button><button type="button" data-product-video-action="download" data-product-video-result-id="${escapeAttr(result.id)}">下载本地</button></div>
        </div>
        <div class="commerce-asset-meta"><strong>产品宣传视频</strong><span>${new Date(result.createdAt).toLocaleTimeString()}</span></div>
      </article>`).join("")
    : `<div class="commerce-assets-empty"><span>▶</span><strong>临时视频资产库还是空的</strong><em>生成结果会显示在这里，加入画布前不会改变无限画布。</em></div>`;
}

function productVideoResult(id) {
  return state.productVideoWorkspace.results.find(result => result.id === id) || null;
}

function addProductVideoResultToCanvas(id) {
  const result = productVideoResult(id);
  if (!result) return;
  setWorkspaceMode("canvas");
  const card = createCard("upload", {
    title: "产品宣传视频",
    resultUrl: result.url,
    mime: result.mime || "video/mp4",
    x: viewportCenter().x - 155,
    y: viewportCenter().y - 120
  });
  card.prompt = result.prompt;
  selectSingle(card.id);
  render();
  save();
}

async function downloadProductVideoResult(id) {
  const result = productVideoResult(id);
  if (!result) return;
  const link = document.createElement("a");
  const filename = `banana-product-video-${Date.now()}.mp4`;
  try {
    const response = await fetch(result.url);
    if (!response.ok) throw new Error("download failed");
    link.href = URL.createObjectURL(await response.blob());
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch {
    link.href = result.url;
    link.download = filename;
    link.rel = "noreferrer";
    link.click();
  }
}

function handleProductVideoUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    state.productVideoWorkspace.status = "error";
    state.productVideoWorkspace.error = "产品视频只支持图片文件。";
    renderProductVideoWorkspace();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.productVideoWorkspace.productRef = { url: reader.result, name: file.name, mime: file.type };
    state.productVideoWorkspace.status = "idle";
    state.productVideoWorkspace.progress = 0;
    state.productVideoWorkspace.error = "";
    state.productVideoWorkspace.task = null;
    renderProductVideoWorkspace();
    save();
  };
  reader.readAsDataURL(file);
}

function productVideoRequest(apiKey) {
  const workspace = state.productVideoWorkspace;
  const { width, height } = parseSize(sizeForVideo(workspace.aspect, workspace.resolution));
  return {
    apiKey,
    model: settings.videoModel,
    prompt: productVideoPrompt(),
    imageRefs: [workspace.productRef.url],
    imageRoles: ["product"],
    width,
    height,
    num_frames: durationToFrames(workspace.duration, workspace.fps),
    frame_rate: workspace.fps,
    negative_prompt: "multiple shots, split screen, long text overlays, unsupported claims, unsafe actions",
    generate_audio: workspace.generateAudio
  };
}

function storeProductVideoResult(url, prompt) {
  const workspace = state.productVideoWorkspace;
  workspace.results.unshift({ id: uid("product-video-result"), url, mime: "video/mp4", prompt, createdAt: Date.now(), status: "done" });
  workspace.status = "done";
  workspace.progress = 100;
  workspace.error = "";
  workspace.task = null;
}

async function generateProductVideo() {
  const workspace = state.productVideoWorkspace;
  if (!workspace.productRef || workspace.status === "running") return;
  collectSettings();
  if (settings.provider !== "agnes") {
    workspace.status = "error";
    workspace.error = "产品视频工作台目前需要 Agnes 视频 API，请在 API 设置中选择 Agnes。";
    renderProductVideoWorkspace();
    return;
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    workspace.status = "error";
    workspace.error = "请先在 API 设置中填写 API Key。";
    renderProductVideoWorkspace();
    els.settingsModal.classList.remove("hidden");
    return;
  }
  workspace.status = "running";
  workspace.progress = 8;
  workspace.error = "";
  renderProductVideoWorkspace();
  save();
  try {
    const created = await postJson("/api/agnes/video", productVideoRequest(apiKey));
    const response = created.response || {};
    const directUrl = response.url || response.video_url || response.result?.url;
    if (directUrl) {
      storeProductVideoResult(directUrl, productVideoPrompt());
    } else {
      const task = { video_id: response.video_id, task_id: response.task_id || response.id };
      if (!task.video_id && !task.task_id) throw new Error("Agnes 视频 API 未返回任务 ID。 ");
      workspace.task = task;
      workspace.progress = Number(response.progress || 12);
      await pollProductVideo(apiKey);
    }
  } catch (error) {
    workspace.status = "error";
    workspace.error = error.message || "产品视频生成失败。";
    workspace.task = null;
  } finally {
    renderProductVideoWorkspace();
    save();
  }
}

async function pollProductVideo(apiKey) {
  const workspace = state.productVideoWorkspace;
  const maxAttempts = 120;
  let delay = normalizePollInterval(settings.pollInterval);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!workspace.task) return;
    await sleep(delay);
    let data;
    try {
      data = await postJson("/api/agnes/video-result", { apiKey, model: settings.videoModel, video_id: workspace.task.video_id, task_id: workspace.task.task_id });
    } catch (error) {
      if (isRateLimitError(error)) {
        delay = Math.min(MAX_VIDEO_POLL_INTERVAL, Math.max(Math.round(delay * 1.8), 15000));
        workspace.status = "running";
        workspace.error = rateLimitMessage(delay);
        renderProductVideoWorkspace();
        continue;
      }
      throw error;
    }
    delay = normalizePollInterval(settings.pollInterval);
    const result = data.response || {};
    const status = result.status || "running";
    workspace.status = status === "completed" ? "running" : status;
    workspace.progress = Number(result.progress ?? Math.min(95, 20 + attempt * 3));
    workspace.error = "";
    if (status === "completed" && result.url) {
      storeProductVideoResult(result.url, productVideoPrompt());
      return;
    }
    if (status === "failed") throw new Error(result.error ? JSON.stringify(result.error) : "Agnes 产品视频生成失败。");
    renderProductVideoWorkspace();
    save();
  }
  throw new Error("产品视频生成轮询超时。可稍后重试或查看 Agnes 控制台。");
}

function setWorkspaceMode(mode) {
  state.workspaceMode = ["commerce", "product-video"].includes(mode) ? mode : "canvas";
  els.viewport.classList.toggle("hidden", state.workspaceMode !== "canvas");
  els.commerceWorkspace.classList.toggle("hidden", state.workspaceMode !== "commerce");
  els.productVideoWorkspace.classList.toggle("hidden", state.workspaceMode !== "product-video");
  document.querySelectorAll(".tool[data-tool]").forEach(button => button.classList.toggle("active", button.dataset.tool === state.workspaceMode));
  if (state.workspaceMode === "commerce") renderCommerceWorkspace();
  else if (state.workspaceMode === "product-video") renderProductVideoWorkspace();
  else render();
  save();
}

function commerceRefFor(card, role) {
  return card?.[`${role}Ref`] || null;
}

function commerceSlotMarkup(card, role, label, required) {
  const ref = commerceRefFor(card, role);
  const isProductError = role === "product" && card?.error && !ref;
  const media = ref
    ? `<img src="${escapeAttr(ref.url)}" alt="${escapeAttr(ref.name)}" draggable="false"><span class="slot-remove" data-commerce-remove="${role}" title="移除">×</span>`
    : `<span class="slot-plus">＋</span>`;
  const hint = ref ? "点击替换" : (required ? "必填" : "可选");
  return `<span class="slot-media">${media}</span><strong>${escapeHtml(ref?.name || label)}</strong><em>${hint}</em>${isProductError ? `<small class="slot-error">请先上传商品图</small>` : ""}`;
}

function renderCommerceDock(card) {
  const isCommerce = card?.type === "commerce";
  els.commerceDockFields.classList.toggle("hidden", !isCommerce);
  els.genericPromptLine.classList.toggle("hidden", isCommerce);
  if (!isCommerce) return;
  els.commerceDockPrompt.value = card.prompt || "";
  els.commercePromptMode.checked = card.commercePromptMode === "auto";
  els.commercePromptGenerateButton.disabled = card.commercePromptMode !== "auto" || card.promptStatus === "running" || card.status === "running";
  els.commerceDockFields.querySelectorAll("[data-commerce-slot]").forEach(button => {
    const role = button.dataset.commerceSlot;
    const required = role === "product";
    button.classList.toggle("required", required);
    button.classList.toggle("error", required && Boolean(card.error) && !commerceRefFor(card, role));
    button.innerHTML = commerceSlotMarkup(card, role, role === "product" ? "商品图" : role === "model" ? "模特图" : "场景图", required);
  });
  const status = card.promptStatus === "running"
    ? "Agnes 正在根据参考图写提示词，请稍候…"
    : card.promptStatus === "error"
      ? card.promptError || "提示词生成失败，请重试。"
      : card.status === "running"
        ? "正在生成电商主视觉，请稍候…"
        : card.status === "done"
          ? "已生成新的宣传图节点。"
          : card.error || (card.commercePromptMode === "auto" && !card.prompt ? "上传商品图后，点击 Agnes 写提示词。" : "上传商品图后即可生成。");
  els.commerceDockStatus.textContent = status;
  els.commerceDockStatus.className = `commerce-status ${card.promptStatus === "error" || card.status === "error" ? "error" : card.promptStatus === "done" || card.status === "done" ? "success" : ""}`;
  els.commerceDockGenerateButton.disabled = card.status === "running" || card.promptStatus === "running";
}

function setCommerceSlot(card, role, ref) {
  if (!card || card.type !== "commerce") return;
  card[`${role}Ref`] = ref;
  card.status = "idle";
  card.error = "";
  card.promptStatus = "idle";
  card.promptError = "";
  render();
  save();
}

function handleCommerceUpload(event) {
  const file = event.target.files?.[0];
  const card = selectedCommerceCard();
  const role = card?.commerceActiveSlot || "product";
  event.target.value = "";
  if (!file || !card) return;
  if (!file.type.startsWith("image/")) {
    card.status = "error";
    card.error = "仅支持图片文件。";
    render();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setCommerceSlot(card, role, { url: reader.result, name: file.name, mime: file.type });
  reader.onerror = () => {
    card.status = "error";
    card.error = "读取图片失败，请重新选择。";
    render();
  };
  reader.readAsDataURL(file);
}

function isImageAsset(card) {
  return card && card.resultUrl && !card.mime.startsWith("video/") && !card.resultUrl.includes(".mp4");
}

function isTextLike(card) {
  return card.type === "text";
}

function incomingCards(card) {
  return state.edges.filter(edge => edge.to === card.id).map(edge => findCard(edge.from)).filter(Boolean);
}

function outgoingCards(card) {
  return state.edges.filter(edge => edge.from === card.id).map(edge => findCard(edge.to)).filter(Boolean);
}

function connectedIds(card) {
  const ids = new Set();
  state.edges.forEach(edge => {
    if (edge.from === card.id) ids.add(edge.to);
    if (edge.to === card.id) ids.add(edge.from);
  });
  return ids;
}

function combinedPrompt(card) {
  const upstreamText = incomingCards(card)
    .filter(isTextLike)
    .map(item => item.prompt)
    .filter(Boolean)
    .join("\n");
  return [upstreamText, card.prompt].filter(Boolean).join("\n").trim();
}

function cardRefs(card) {
  const manual = (card.refs || []).map(id => findCard(id)).filter(isImageAsset);
  const upstream = incomingCards(card).filter(isImageAsset);
  const refs = [...manual, ...upstream].map(item => item.resultUrl).filter(Boolean);
  return Array.from(new Set(refs));
}

function cardPreview(card) {
  if (card.resultUrl && (card.mime.startsWith("video/") || card.resultUrl.includes(".mp4"))) {
    return `<video src="${escapeAttr(card.resultUrl)}" controls draggable="false"></video>`;
  }
  if (card.resultUrl) return `<img src="${escapeAttr(card.resultUrl)}" alt="${escapeAttr(card.title)}" draggable="false">`;
  if (card.type === "text") return `<div class="node-options"><div>✎ 编写提示词</div><div>→ 连接到图片/视频节点作为输入</div></div>`;
  if (card.type === "image") return `<div class="placeholder">已连接，点击选中配置参数</div>`;
  if (card.type === "video") return `<div class="placeholder">连接文本或图片后生成视频</div>`;
  if (card.type === "commerce") return `<div class="commerce-node-preview"><strong>商品图 + 模特图 + 场景图</strong><span>选中节点后在下方上传并生成</span></div>`;
  return `<div class="placeholder">上传或生成的资产</div>`;
}

function portPoint(card, side) {
  const layoutHeight = card.layoutH ?? card.h;
  return {
    x: side === "out" ? card.x + card.w : card.x,
    y: card.y + layoutHeight / 2
  };
}

function edgePath(fromPoint, toPoint) {
  const dx = Math.max(80, Math.abs(toPoint.x - fromPoint.x) * 0.5);
  const x1 = fromPoint.x + SVG_OFFSET;
  const y1 = fromPoint.y + SVG_OFFSET;
  const x2 = toPoint.x + SVG_OFFSET;
  const y2 = toPoint.y + SVG_OFFSET;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function renderEdges() {
  const paths = state.edges.map(edge => {
    const from = findCard(edge.from);
    const to = findCard(edge.to);
    if (!from || !to) return "";
    return `<path class="connection-path" d="${edgePath(portPoint(from, "out"), portPoint(to, "in"))}"></path>`;
  }).join("");
  const draft = state.connecting
    ? `<path class="connection-path dim" d="${edgePath(portPoint(findCard(state.connecting.from), "out"), state.connecting.to)}"></path>`
    : "";
  return `<svg class="connection-svg" aria-hidden="true">${paths}${draft}</svg>`;
}

function syncCardLayoutMetrics() {
  state.cards.forEach(card => {
    const node = els.stage.querySelector(`.card[data-id="${card.id}"]`);
    if (node) card.layoutH = node.offsetHeight;
  });
}

function refreshLayoutGeometry() {
  syncCardLayoutMetrics();
  const currentEdges = els.stage.querySelector(".connection-svg");
  if (currentEdges) currentEdges.outerHTML = renderEdges();
  const card = selectedCard();
  if (card) positionNodeDock(card);
}

function render() {
  applyViewport();
  els.viewport.classList.toggle("hidden", state.workspaceMode !== "canvas");
  els.commerceWorkspace.classList.toggle("hidden", state.workspaceMode !== "commerce");
  els.emptyHint.classList.toggle("hidden", state.cards.length > 0);
  const cardsHtml = state.cards.map(card => {
    const connected = connectedIds(card).size > 0;
    return `
      <article class="card ${isCardSelected(card.id) ? "selected" : ""} ${connected ? "connected" : ""}" data-id="${card.id}" style="left:${card.x}px;top:${card.y}px;width:${card.w}px;min-height:${card.h}px">
        <button class="port input" data-port="input" data-id="${card.id}" title="输入"></button>
        <button class="port output" data-port="output" data-id="${card.id}" title="输出"></button>
        <div class="card-head">
          <div class="card-title">${escapeHtml(card.title)}</div>
          <span class="badge ${statusClass(card)}">${statusLabel(card)}</span>
        </div>
        <div class="card-body">
          <div class="asset-preview">${cardPreview(card)}</div>
          <div class="prompt-preview">${escapeHtml(card.error || card.prompt || "未填写提示词")}</div>
          ${(card.status === "running" || card.status === "queued") ? `<div class="progress-line"><span style="width:${Number(card.progress || 8)}%"></span></div>` : ""}
        </div>
      </article>`;
  }).join("");
  els.stage.innerHTML = `${renderSelectionBox()}${cardsHtml}`;
  syncCardLayoutMetrics();
  els.stage.insertAdjacentHTML("afterbegin", renderEdges());
  renderInspector();
  if (state.workspaceMode === "commerce") renderCommerceWorkspace();
}

function positionNodeDock(card) {
  const dock = els.nodeControlDock;
  const viewportRect = els.viewport.getBoundingClientRect();
  const scale = state.viewport.scale;
  const gap = 30;
  const margin = 12;
  const maxWidth = Math.min(920, Math.max(320, viewportRect.width - margin * 2));
  dock.style.width = `${maxWidth}px`;
  dock.style.maxHeight = `${Math.max(220, viewportRect.height - margin * 2)}px`;

  const nodeCenterX = state.viewport.x + (card.x + card.w / 2) * scale;
  const nodeBottom = state.viewport.y + (card.y + (card.layoutH ?? card.h)) * scale;
  const dockRect = dock.getBoundingClientRect();
  const dockWidth = dockRect.width || maxWidth;

  const left = nodeCenterX - dockWidth / 2;
  const top = nodeBottom + gap;

  dock.style.left = `${Math.round(left)}px`;
  dock.style.top = `${Math.round(top)}px`;
}
function aspectButton(option, current) {
  return `<button type="button" class="size-choice aspect-choice ${option.id === current ? "selected" : ""}" data-size-action="aspect" data-value="${escapeAttr(option.id)}"><span class="aspect-icon-frame"><span class="aspect-icon" style="${aspectIconStyle(option)}"></span></span><strong>${escapeHtml(option.label)}</strong></button>`;
}

function aspectIconStyle(option) {
  if (option.id === "auto") return "--aspect-w:22px;--aspect-h:22px";
  const maxW = 30;
  const maxH = 24;
  const ratio = option.rw / option.rh;
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return `--aspect-w:${Math.max(8, Math.round(width))}px;--aspect-h:${Math.max(8, Math.round(height))}px`;
}

function renderImageSizeMenu(card) {
  const aspect = card.aspect || "auto";
  const quality = card.imageQuality || "medium";
  const resolution = card.imageResolution || "1k";
  return `<section class="size-section image-aspect-section"><h3>比例</h3><div class="aspect-grid image-aspect-grid">${ASPECT_OPTIONS.map(option => aspectButton(option, aspect)).join("")}</div></section>
    <section class="size-section"><h3>图像质量</h3><div class="segmented-row">${IMAGE_QUALITY_OPTIONS.map(option => `<button type="button" class="size-choice ${option.id === quality ? "selected" : ""}" data-size-action="imageQuality" data-value="${escapeAttr(option.id)}">${escapeHtml(option.label)}</button>`).join("")}</div></section>
    <section class="size-section"><h3>分辨率</h3><div class="segmented-row">${IMAGE_RESOLUTION_OPTIONS.map(option => `<button type="button" class="size-choice ${option.id === resolution ? "selected" : ""}" data-size-action="imageResolution" data-value="${escapeAttr(option.id)}">${escapeHtml(option.label)}</button>`).join("")}</div></section>`;
}

function renderVideoSizeMenu(card) {
  const resolution = card.videoResolution || "720p";
  const duration = Number(card.duration || 5);
  const audio = card.generate_audio !== false;
  const aspect = card.aspect || "auto";
  const videoAspects = ASPECT_OPTIONS.filter(option => ["auto", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"].includes(option.id));
  return `<section class="size-section"><h3>分辨率</h3><div class="video-resolution-grid">${VIDEO_RESOLUTION_OPTIONS.map(option => `<button type="button" class="size-choice ${option.id === resolution ? "selected" : ""}" data-size-action="videoResolution" data-value="${escapeAttr(option.id)}">${escapeHtml(option.label)}</button>`).join("")}</div></section>
    <section class="size-section"><h3>生成时长</h3><div class="duration-grid">${VIDEO_DURATION_OPTIONS.map(value => `<button type="button" class="size-choice ${value === duration ? "selected" : ""}" data-size-action="duration" data-value="${value}">${value}s</button>`).join("")}</div></section>
    <section class="size-section"><h3>生成视频音频</h3><div class="segmented-row two"><button type="button" class="size-choice ${audio ? "selected" : ""}" data-size-action="generate_audio" data-value="true">是</button><button type="button" class="size-choice ${!audio ? "selected" : ""}" data-size-action="generate_audio" data-value="false">否</button></div></section>
    <section class="size-section"><h3>比例</h3><div class="aspect-grid video-aspect-grid">${videoAspects.map(option => aspectButton(option, aspect)).join("")}</div></section>`;
}

function sizePickerSummary(card) {
  if (card.type === "video") {
    return `${labelFor(VIDEO_RESOLUTION_OPTIONS, card.videoResolution, "720p")} / ${Number(card.duration || 5)}s / ${card.generate_audio === false ? "否" : "是"} / ${labelFor(ASPECT_OPTIONS, card.aspect, "auto")}`;
  }
  return `${labelFor(ASPECT_OPTIONS, card.aspect, "auto")} / ${labelFor(IMAGE_QUALITY_OPTIONS, card.imageQuality, "medium")} / ${labelFor(IMAGE_RESOLUTION_OPTIONS, card.imageResolution, "1k")}`;
}

function renderSizePicker(card) {
  els.sizePicker.classList.toggle("hidden", !["image", "video"].includes(card.type));
  if (!["image", "video"].includes(card.type)) return;
  els.sizePicker.dataset.mode = card.type;
  els.sizePickerButton.textContent = sizePickerSummary(card);
  els.sizePickerMenu.innerHTML = card.type === "video" ? renderVideoSizeMenu(card) : renderImageSizeMenu(card);
  els.cardSize.innerHTML = `<option value="${escapeAttr(card.size)}">${escapeHtml(sizePickerSummary(card))}</option>`;
  els.cardSize.value = card.size;
}

function applySizePickerAction(card, action, value) {
  const patch = {};
  if (action === "aspect") {
    patch.aspect = value;
    patch.size = card.type === "video" ? sizeForVideo(value, card.videoResolution || "720p") : sizeForImage(value, card.imageResolution || "1k");
  }
  if (action === "imageQuality") patch.imageQuality = value;
  if (action === "imageResolution") {
    patch.imageResolution = value;
    patch.size = sizeForImage(card.aspect || "auto", value);
  }
  if (action === "videoResolution") {
    patch.videoResolution = value;
    patch.size = sizeForVideo(card.aspect || "auto", value);
  }
  if (action === "duration") {
    patch.duration = Number(value);
    patch.num_frames = durationToFrames(Number(value), card.frame_rate || 24);
  }
  if (action === "generate_audio") patch.generate_audio = value === "true";
  return patch;
}

function renderInspector() {
  const card = selectedCard();
  const hasCard = Boolean(card);
  els.nodeControlDock.classList.toggle("hidden", !hasCard);
  els.inspectorEmpty.classList.add("hidden");
  els.inspectorForm.classList.toggle("hidden", !hasCard);
  document.getElementById("deleteCard").disabled = !hasCard;
  if (!card) return;
  positionNodeDock(card);

  els.cardTitle.value = card.title || "";
  els.cardPrompt.value = card.prompt || "";
  const canGenerate = ["image", "video"].includes(card.type);
  els.generationFields.classList.toggle("hidden", !canGenerate);
  els.videoFields.classList.add("hidden");
  renderSizePicker(card);
  els.videoFrames.value = card.num_frames || 121;
  els.videoFps.value = card.frame_rate || 24;
  els.negativePrompt.value = card.negative_prompt || "";

  const modelOptions = card.type === "video" ? [settings.videoModel || "agnes-video-v2.0"] : ["agnes-image-2.1-flash", "agnes-image-2.0-flash"];
  els.cardModel.innerHTML = modelOptions.map(model => `<option value="${escapeAttr(model)}">${escapeHtml(model)}</option>`).join("");
  els.cardModel.value = card.model || modelOptions[0];

  const upstream = incomingCards(card);
  const upstreamText = upstream.filter(isTextLike).length;
  const upstreamImages = upstream.filter(isImageAsset).length;
  const upstreamIds = new Set(upstream.filter(isImageAsset).map(item => item.id));
  const referencedIds = new Set([...upstreamIds, ...card.refs]);
  const refCards = state.cards.filter(item => item.id !== card.id && referencedIds.has(item.id) && isImageAsset(item));
  const upstreamInfo = `<div class="ref-summary">已连接上游：${upstreamText} 个文本，${upstreamImages} 个图片参考。</div>`;
  const manualRefs = refCards.length
    ? `<div class="ref-thumb-grid">${refCards.map(item => {
        const checked = card.refs.includes(item.id) || upstreamIds.has(item.id);
        const locked = upstreamIds.has(item.id);
        return `<label class="ref-thumb ${checked ? "selected" : ""} ${locked ? "locked" : ""}" title="${escapeAttr(item.title)}">
          <input type="checkbox" data-ref="${item.id}" ${checked ? "checked" : ""} ${locked ? "disabled" : ""}>
          <img src="${escapeAttr(item.resultUrl)}" alt="${escapeAttr(item.title)}" draggable="false">
          <span>${escapeHtml(item.title || "图片")}</span>
          <b>${locked ? "已连接" : "参考"}</b>
          <i><img src="${escapeAttr(item.resultUrl)}" alt="${escapeAttr(item.title)}" draggable="false"><a class="ref-open" href="${escapeAttr(item.resultUrl)}" target="_blank" rel="noreferrer">查看原图</a></i>
        </label>`;
      }).join("")}</div>`
    : `<div class="status-box">暂无参考图。请把图片或上传资产节点连到此节点作为参考。</div>`;
  els.referenceList.innerHTML = `${upstreamInfo}${manualRefs}`;

  const statusText = card.error || taskText(card);
  els.statusBox.textContent = statusText;
  els.statusBox.classList.toggle("error", card.status === "error");
  els.resultBox.innerHTML = card.resultUrl ? `<a href="${escapeAttr(card.resultUrl)}" target="_blank" rel="noreferrer">打开生成结果</a>` : "";
  requestAnimationFrame(() => {
    if (state.selectedId === card.id) positionNodeDock(card);
  });
}

function taskText(card) {
  if (card.status === "queued") return "任务已创建，等待生成。";
  if (card.status === "running") return `生成中，进度 ${Number(card.progress || 0)}%。`;
  if (card.status === "done") return "生成完成，结果已写回画布。";
  return "";
}

function updateCardNode(card) {
  const node = els.stage.querySelector(`[data-id="${card.id}"]`);
  if (!node) return;
  const title = node.querySelector(".card-title");
  const prompt = node.querySelector(".prompt-preview");
  if (title) title.textContent = card.title || "未命名";
  if (prompt) prompt.textContent = card.error || card.prompt || "未填写提示词";
}

function updateSelected(patch, options = {}) {
  const card = selectedCard();
  if (!card) return;
  Object.assign(card, patch);
  if (options.render === false) {
    updateCardNode(card);
    positionNodeDock(card);
  } else {
    render();
  }
  if (options.deferSave) scheduleSave();
  else save();
}

function setupSizePicker() {
  els.sizePickerMenu.addEventListener("click", event => {
    const button = event.target.closest("button[data-size-action]");
    const card = selectedCard();
    if (!button || !card) return;
    const patch = applySizePickerAction(card, button.dataset.sizeAction, button.dataset.value);
    updateSelected(patch, { render: false });
    renderInspector();
  });
}

function bindInputs() {
  setupSizePicker();
  const mappings = [[els.cardTitle, "title"], [els.cardPrompt, "prompt"], [els.cardModel, "model"], [els.videoFrames, "num_frames", Number], [els.videoFps, "frame_rate", Number], [els.negativePrompt, "negative_prompt"]];
  mappings.forEach(([el, key, normalize]) => {
    const readValue = () => ({ [key]: normalize ? normalize(el.value) : el.value });
    el.addEventListener("input", () => updateSelected(readValue(), { render: false, deferSave: true }));
    el.addEventListener("change", () => updateSelected(readValue(), { render: false }));
  });
  els.referenceList.addEventListener("change", event => {
    const card = selectedCard();
    if (!card || !event.target.dataset.ref || event.target.disabled) return;
    const refs = new Set(card.refs);
    if (event.target.checked) refs.add(event.target.dataset.ref);
    else refs.delete(event.target.dataset.ref);
    updateSelected({ refs: Array.from(refs) });
  });
  els.referenceList.addEventListener("click", event => {
    if (event.target.closest(".ref-open")) event.stopPropagation();
  });
  els.referenceList.addEventListener("pointermove", event => {
    const thumb = event.target.closest(".ref-thumb");
    if (!thumb) return;
    const rect = thumb.getBoundingClientRect();
    const width = Math.min(280, Math.max(220, window.innerWidth * 0.34));
    const overflowsRight = rect.right + width + 18 > window.innerWidth;
    const left = overflowsRight ? Math.min(0, rect.left - width - 6) : rect.width + 6;
    thumb.style.setProperty("--preview-width", `${width}px`);
    thumb.style.setProperty("--preview-left", `${left}px`);
    thumb.dataset.previewSide = overflowsRight ? "left" : "right";
  });
}

function setTool(button) {
  document.querySelectorAll(".tool").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
}

function setupToolbar() {
  document.querySelectorAll("[data-create]").forEach(button => {
    button.addEventListener("click", () => createCard(button.dataset.create));
  });
  els.returnCanvasTool.addEventListener("click", () => setWorkspaceMode("canvas"));
  els.commerceTool.addEventListener("click", () => {
    setWorkspaceMode("commerce");
  });
  els.productVideoTool.addEventListener("click", () => {
    setWorkspaceMode("product-video");
  });
  els.addNodeButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    hideContextMenu();
    hideConnectionCreateMenu();
    els.nodePalette.classList.remove("hidden");
  });
  document.querySelectorAll("[data-commerce-workspace-slot]").forEach(button => {
    button.addEventListener("click", event => {
      const removeButton = event.target.closest("[data-commerce-workspace-remove]");
      const role = button.dataset.commerceWorkspaceSlot;
      if (removeButton) {
        state.commerceWorkspace[`${role}Ref`] = null;
        state.commerceWorkspace.promptStatus = "idle";
        state.commerceWorkspace.promptError = "";
        renderCommerceWorkspace();
        save();
        return;
      }
      state.commerceWorkspace.activeSlot = role;
      els.commerceWorkspaceUploadInput.click();
    });
  });
  els.commerceWorkspaceUploadInput.addEventListener("change", handleCommerceWorkspaceUpload);
  els.commerceWorkspacePromptMode.addEventListener("change", event => {
    state.commerceWorkspace.promptMode = event.target.checked ? "auto" : "manual";
    state.commerceWorkspace.promptStatus = "idle";
    state.commerceWorkspace.promptError = "";
    renderCommerceWorkspace();
    save();
  });
  els.commerceWorkspacePrompt.addEventListener("input", event => {
    state.commerceWorkspace.prompt = event.target.value;
    if (state.commerceWorkspace.promptMode === "auto" && event.target.value.trim() !== state.commerceWorkspace.lastGeneratedPrompt) {
      state.commerceWorkspace.promptHint = event.target.value;
    }
    if (state.commerceWorkspace.promptMode === "auto") state.commerceWorkspace.promptStatus = event.target.value.trim() ? "done" : "idle";
    state.commerceWorkspace.error = "";
    scheduleSave();
  });
  [els.commerceWorkspaceAspect, els.commerceWorkspaceQuality, els.commerceWorkspaceResolution].forEach(input => {
    input.addEventListener("change", event => {
      state.commerceWorkspace[{ commerceWorkspaceAspect: "aspect", commerceWorkspaceQuality: "quality", commerceWorkspaceResolution: "resolution" }[event.target.id]] = event.target.value;
      scheduleSave();
    });
  });
  els.commerceWorkspacePromptButton.addEventListener("click", generateCommerceWorkspacePrompt);
  els.commerceWorkspaceGenerate.addEventListener("click", generateCommerceWorkspacePromo);
  els.commerceAssetGrid.addEventListener("click", event => {
    const card = event.target.closest("[data-commerce-result-id]");
    if (card) selectCommerceResult(card.dataset.commerceResultId);
    const action = event.target.closest("[data-commerce-preview-action]");
    if (!action) return;
    const id = action.dataset.commerceResultId;
    if (action.dataset.commercePreviewAction === "add") addCommerceWorkspaceResultToCanvas(id);
    if (action.dataset.commercePreviewAction === "download") downloadCommerceWorkspaceResult(id);
  });
  els.commerceLayerPanel.addEventListener("click", event => {
    const row = event.target.closest("[data-commerce-layer-id]");
    if (!row) return;
    const result = activeCommerceWorkspaceResult();
    const id = row.dataset.commerceLayerId;
    const layer = result?.composition?.layers.find(item => item.id === id);
    if (!layer) return;
    const action = event.target.closest("[data-commerce-layer-action]");
    if (action?.dataset.commerceLayerAction === "visibility") layer.visible = !layer.visible;
    else if (action?.dataset.commerceLayerAction === "lock") layer.locked = !layer.locked;
    else if (action?.dataset.commerceLayerAction === "scale-down") return scaleCommerceLayer(id, 0.9);
    else if (action?.dataset.commerceLayerAction === "scale-up") return scaleCommerceLayer(id, 1.1);
    else result.composition.selectedLayerId = id;
    renderCommerceWorkspace();
    save();
  });
  [els.commerceCopyTitle, els.commerceCopyBenefits].forEach(input => {
    input.addEventListener("input", () => {
      const result = activeCommerceWorkspaceResult();
      if (!result) return;
      result.copy = result.copy || { title: "", benefits: [], specs: [] };
      result.copy.title = els.commerceCopyTitle.value.trim().slice(0, 28);
      result.copy.benefits = els.commerceCopyBenefits.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean).slice(0, 3);
      syncCommerceCopyLayer(result);
      renderCommerceLayerPanel(result);
      renderActiveCommerceComposition(result);
      scheduleSave();
    });
  });
  els.commerceLayerRestore.addEventListener("click", () => {
    const result = activeCommerceWorkspaceResult();
    const product = result?.composition?.layers.find(layer => layer.type === "product");
    if (!result?.composition?.sourceProduct || !product) return;
    product.src = result.composition.sourceProduct.url;
    product.name = result.composition.sourceProduct.name;
    product.locked = true;
    result.composition.selectedLayerId = product.id;
    renderCommerceWorkspace();
    save();
  });
  els.commerceExportButton.addEventListener("click", () => exportActiveCommerceComposition());
  setupCommerceComposerInteractions();
  document.querySelectorAll("[data-product-video-slot]").forEach(button => {
    button.addEventListener("click", event => {
      if (event.target.closest("[data-product-video-remove]")) {
        state.productVideoWorkspace.productRef = null;
        state.productVideoWorkspace.status = "idle";
        state.productVideoWorkspace.error = "";
        renderProductVideoWorkspace();
        save();
        return;
      }
      els.productVideoUploadInput.click();
    });
  });
  els.productVideoUploadInput.addEventListener("change", handleProductVideoUpload);
  els.productVideoPrompt.addEventListener("input", event => {
    state.productVideoWorkspace.prompt = event.target.value;
    state.productVideoWorkspace.error = "";
    scheduleSave();
  });
  [els.productVideoAspect, els.productVideoResolution, els.productVideoDuration, els.productVideoFps, els.productVideoAudio].forEach(input => {
    input.addEventListener("change", event => {
      const key = {
        productVideoAspect: "aspect",
        productVideoResolution: "resolution",
        productVideoDuration: "duration",
        productVideoFps: "fps",
        productVideoAudio: "generateAudio"
      }[event.target.id];
      state.productVideoWorkspace[key] = ["duration", "fps"].includes(key) ? Number(event.target.value) : key === "generateAudio" ? event.target.value === "true" : event.target.value;
      scheduleSave();
    });
  });
  els.productVideoGenerate.addEventListener("click", generateProductVideo);
  els.productVideoAssetGrid.addEventListener("click", event => {
    const action = event.target.closest("[data-product-video-action]");
    if (!action) return;
    const id = action.dataset.productVideoResultId;
    if (action.dataset.productVideoAction === "add") addProductVideoResultToCanvas(id);
    if (action.dataset.productVideoAction === "download") downloadProductVideoResult(id);
  });
  document.getElementById("paletteUpload").addEventListener("click", () => document.getElementById("uploadInput").click());
  document.getElementById("uploadInput").addEventListener("change", handleUpload);
}

function handleUpload(event) {
  const pending = state.pendingUploadConnection;
  Array.from(event.target.files || []).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = () => {
      const options = { title: file.name, resultUrl: reader.result, mime: file.type };
      if (pending) {
        const def = NODE_DEFS.upload;
        options.x = pending.world.x + index * 24;
        options.y = pending.world.y - def.h / 2 + index * 24;
      }
      const card = createCard("upload", options);
      if (pending?.from) addEdge(pending.from, card.id);
      state.pendingUploadConnection = null;
      hideConnectionCreateMenu();
      render();
      save();
    };
    reader.readAsDataURL(file);
  });
  if (!(event.target.files || []).length) state.pendingUploadConnection = null;
  event.target.value = "";
}

function setupCanvasEvents() {
  els.viewport.addEventListener("wheel", event => {
    if (event.target.closest(".node-control-dock")) return;
    event.preventDefault();
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? els.viewport.clientHeight : 1;
    state.viewport.x -= Number(event.deltaX || 0) * multiplier;
    state.viewport.y -= Number(event.deltaY || 0) * multiplier;
    render();
    save();
  }, { passive: false });

  els.viewport.addEventListener("pointerdown", event => {
    if (event.button === 1) {
      event.preventDefault();
      hideContextMenu();
      hideConnectionCreateMenu();
      state.drag = null;
      state.connecting = null;
      state.selectionBox = null;
      state.pan = { startX: event.clientX, startY: event.clientY, viewX: state.viewport.x, viewY: state.viewport.y };
      els.viewport.setPointerCapture(event.pointerId);
      return;
    }
    if (event.target.closest(".context-menu") || event.target.closest(".node-control-dock") || event.target.closest(".connection-create-menu") || event.target.closest(".node-palette")) return;
    if (event.button === 2) {
      showContextMenu(event);
      return;
    }
    if (event.button !== 0) return;
    hideContextMenu();
    hideConnectionCreateMenu();
    const output = event.target.closest(".port.output");
    if (output) {
      event.preventDefault();
      event.stopPropagation();
      state.connecting = { from: output.dataset.id, to: clientToWorld(event.clientX, event.clientY) };
      render();
      return;
    }

    const cardEl = event.target.closest(".card");
    if (cardEl) {
      event.preventDefault();
      const card = findCard(cardEl.dataset.id);
      if (!card) return;
      if (!isCardSelected(card.id)) selectSingle(card.id);
      const start = clientToWorld(event.clientX, event.clientY);
      const dragIds = isCardSelected(card.id) ? selectedIds() : [card.id];
      state.drag = {
        id: card.id,
        dx: start.x - card.x,
        dy: start.y - card.y,
        start,
        ids: dragIds,
        origins: dragIds.map(id => {
          const item = findCard(id);
          return { id, x: item.x, y: item.y };
        })
      };
      cardEl.setPointerCapture(event.pointerId);
      render();
      return;
    }

    if (!event.target.closest(".node-palette")) els.nodePalette.classList.add("hidden");
    const point = clientToWorld(event.clientX, event.clientY);
    setSelected([]);
    state.selectionBox = {
      startWorld: point,
      currentWorld: point,
      startClientX: event.clientX,
      startClientY: event.clientY,
      currentClientX: event.clientX,
      currentClientY: event.clientY
    };
    els.viewport.setPointerCapture(event.pointerId);
    render();
  });

  window.addEventListener("pointermove", event => {
    if (state.connecting) {
      state.connecting.to = clientToWorld(event.clientX, event.clientY);
      render();
      return;
    }
    if (state.drag) {
      const card = findCard(state.drag.id);
      if (!card) return;
      const point = clientToWorld(event.clientX, event.clientY);
      if (state.drag.origins?.length) {
        const deltaX = point.x - state.drag.start.x;
        const deltaY = point.y - state.drag.start.y;
        state.drag.origins.forEach(origin => {
          const item = findCard(origin.id);
          if (!item) return;
          item.x = Math.round(origin.x + deltaX);
          item.y = Math.round(origin.y + deltaY);
        });
      } else {
        card.x = Math.round(point.x - state.drag.dx);
        card.y = Math.round(point.y - state.drag.dy);
      }
      render();
      return;
    }
    if (state.selectionBox) {
      const point = clientToWorld(event.clientX, event.clientY);
      state.selectionBox.currentWorld = point;
      state.selectionBox.currentClientX = event.clientX;
      state.selectionBox.currentClientY = event.clientY;
      setSelected(selectionHitCards(normalizedSelectionRect(state.selectionBox)).map(card => card.id));
      render();
      return;
    }
    if (state.pan) {
      state.viewport.x = state.pan.viewX + event.clientX - state.pan.startX;
      state.viewport.y = state.pan.viewY + event.clientY - state.pan.startY;
      applyViewport();
      const card = selectedCard();
      if (card) positionNodeDock(card);
    }
  });

  window.addEventListener("resize", () => {
    if (state.selectedId) render();
  });

  els.viewport.addEventListener("dragstart", event => {
    if (event.target.closest(".card")) event.preventDefault();
  });
  els.stage.addEventListener("load", event => {
    if (!event.target.matches("img, video")) return;
    requestAnimationFrame(refreshLayoutGeometry);
  }, true);
  els.stage.addEventListener("loadedmetadata", event => {
    if (!event.target.matches("video")) return;
    requestAnimationFrame(refreshLayoutGeometry);
  }, true);
  els.viewport.addEventListener("auxclick", event => {
    if (event.button === 1) event.preventDefault();
  });

  window.addEventListener("pointerup", event => {
    if (state.connecting) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const input = element && element.closest(".port.input");
      const from = state.connecting.from;
      if (input && input.dataset.id !== from) {
        addEdge(from, input.dataset.id);
        state.connecting = null;
        render();
        save();
        return;
      }
      showConnectionCreateMenu(from, event.clientX, event.clientY);
      state.connecting = null;
      render();
      return;
    }
    if (state.selectionBox) {
      const movedX = Math.abs(state.selectionBox.currentClientX - state.selectionBox.startClientX);
      const movedY = Math.abs(state.selectionBox.currentClientY - state.selectionBox.startClientY);
      if (movedX < 4 && movedY < 4) {
        setSelected([]);
      } else {
        setSelected(selectionHitCards(normalizedSelectionRect(state.selectionBox)).map(card => card.id));
      }
      state.selectionBox = null;
      render();
      return;
    }
    if (state.drag || state.pan) save();
    state.drag = null;
    state.pan = null;
  });
}

function addEdge(from, to) {
  if (!findCard(from) || !findCard(to) || from === to) return;
  if (state.edges.some(edge => edge.from === from && edge.to === to)) return;
  state.edges = state.edges.filter(edge => !(edge.from === to && edge.to === from));
  state.edges.push({ id: uid("edge"), from, to });
  selectSingle(to);
}

function setupTopbar() {
  document.getElementById("zoomIn").addEventListener("click", () => { state.viewport.scale = Math.min(2.5, state.viewport.scale * 1.15); render(); save(); });
  document.getElementById("zoomOut").addEventListener("click", () => { state.viewport.scale = Math.max(0.25, state.viewport.scale / 1.15); render(); save(); });
  document.getElementById("fitView").addEventListener("click", fitView);
  document.getElementById("exportJson").addEventListener("click", exportJson);
  document.getElementById("importJson").addEventListener("change", importJson);
}

function fitView() {
  if (!state.cards.length) {
    state.viewport = { x: 300, y: 160, scale: 1 };
    render();
    save();
    return;
  }
  const rect = els.viewport.getBoundingClientRect();
  const minX = Math.min(...state.cards.map(card => card.x));
  const minY = Math.min(...state.cards.map(card => card.y));
  const maxX = Math.max(...state.cards.map(card => card.x + card.w));
  const maxY = Math.max(...state.cards.map(card => card.y + card.h));
  const scale = Math.min(1.15, Math.max(0.35, Math.min(rect.width / (maxX - minX + 260), rect.height / (maxY - minY + 260))));
  state.viewport.scale = scale;
  state.viewport.x = Math.round((rect.width - (maxX - minX) * scale) / 2 - minX * scale);
  state.viewport.y = Math.round((rect.height - (maxY - minY) * scale) / 2 - minY * scale);
  render();
  save();
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ cards: state.cards, edges: state.edges, viewport: state.viewport, settings, commerceWorkspace: state.commerceWorkspace, productVideoWorkspace: state.productVideoWorkspace }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `banana-canvas-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.cards)) state.cards = data.cards;
      if (Array.isArray(data.edges)) state.edges = data.edges;
      if (data.viewport) state.viewport = data.viewport;
      if (data.settings) Object.assign(settings, data.settings);
      if (data.commerceWorkspace) state.commerceWorkspace = normalizeCommerceWorkspace(data.commerceWorkspace);
      if (data.productVideoWorkspace) state.productVideoWorkspace = normalizeProductVideoWorkspace(data.productVideoWorkspace);
      migrateLegacyCommerceNodes();
      state.cards.forEach(card => normalizeCard(card));
      setSelected([]);
      syncSettingsForm();
      render();
      save();
    } catch (error) { alert(`导入失败：${error.message}`); }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function setupSettings() {
  document.getElementById("openSettings").addEventListener("click", () => { els.apiKey.value = getApiKey(); syncSettingsForm(); els.settingsModal.classList.remove("hidden"); });
  document.getElementById("closeSettings").addEventListener("click", () => els.settingsModal.classList.add("hidden"));
  document.getElementById("saveSettings").addEventListener("click", () => { collectSettings(); els.settingsModal.classList.add("hidden"); render(); });
  els.settingsModal.addEventListener("click", event => { if (event.target === els.settingsModal) els.settingsModal.classList.add("hidden"); });
}

async function postJson(url, body) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message = data.error || `HTTP ${response.status}`;
    const details = data.details ? `\n${JSON.stringify(data.details, null, 2)}` : "";
    const error = new Error(message + details);
    error.status = response.status;
    error.data = data;
    error.upstreamStatus = data.details?.status;
    error.upstreamCode = data.details?.response?.error?.code || data.details?.response?.error?.type || "";
    error.upstreamMessage = typeof data.details?.response === "string"
      ? data.details.response.trim()
      : data.details?.response?.error?.message || data.details?.response?.message || "";
    if (isUpstreamTimeout(error)) error.message = "Agnes 上游响应超时，请稍后重试。";
    throw error;
  }
  return data;
}

function isContentPolicyViolation(error) {
  return error?.upstreamCode === "content_policy_violation" ||
    /content_policy_violation/i.test(String(error?.message || "")) ||
    /content policy/i.test(String(error?.upstreamMessage || ""));
}

function commercePolicyErrorMessage() {
  return "Agnes 拒绝了这段提示词，触发了内容安全限制。请移除成人、未成年人、暴力、危险行为、医疗功效或无法确认的宣传内容后重试。";
}

function pathGet(object, path) {
  if (!path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  return parts.reduce((value, key) => value == null ? undefined : value[key], object);
}

function parseSize(size) {
  const [width, height] = String(size || "1152x768").split("x").map(Number);
  return { width: width || 1152, height: height || 768 };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  const message = `${error.message || ""} ${error.upstreamMessage || ""}`;
  return error.status === 429 || error.upstreamStatus === 429 || /429|rate limit|too many/i.test(message);
}

function isUpstreamTimeout(error) {
  const message = `${error?.message || ""} ${error?.upstreamMessage || ""}`;
  return error?.status === 504 || error?.upstreamStatus === 504 || /504|gateway timeout|upstream.*timed out/i.test(message);
}

function upstreamTimeoutMessage() {
  return "Agnes 上游响应超时，已自动重试一次；仍然超时，请稍后重试或检查代理网络。";
}

async function requestAgnesPrompt(body) {
  try {
    return await postJson("/api/agnes/prompt", body);
  } catch (error) {
    if (!isUpstreamTimeout(error)) throw error;
    await sleep(1500);
    try {
      return await postJson("/api/agnes/prompt", body);
    } catch (retryError) {
      if (isUpstreamTimeout(retryError)) retryError.message = upstreamTimeoutMessage();
      throw retryError;
    }
  }
}

function rateLimitMessage(delay) {
  return `Agnes 状态查询限流，已自动放慢到 ${Math.round(delay / 1000)} 秒后继续查询。任务没有失败，请不要重复提交。`;
}

function commerceReferencePayload(card) {
  const slots = [
    ["product", card?.productRef],
    ["model", card?.modelRef],
    ["scene", card?.sceneRef]
  ].filter(([, ref]) => ref?.url);
  return { imageRefs: slots.map(([, ref]) => ref.url), imageRoles: slots.map(([role]) => role) };
}

function commerceWorkspacePrompt() {
  const custom = String(state.commerceWorkspace.prompt || "").trim();
  if (state.commerceWorkspace.promptMode === "auto") return custom;
  return [
    "Create a polished single-screen e-commerce background scene for online retail.",
    "Generate a scene-only visual: rich brand color, tasteful gradient or real lifestyle environment, premium commercial lighting, material contrast, and clear negative space for the real product and Chinese copy to be composited later.",
    "Do not generate any product, packaging, person holding a product, readable text, Chinese, English, numbers, logo, watermark, collage, or split-screen layout.",
    "Express selling points through the scene's lighting, props, color story, and intended use context; do not ask the image model to draw copy.",
    custom
  ].filter(Boolean).join("\n");
}

function commerceWorkspaceImageRequest(apiKey, prompt) {
  const workspace = state.commerceWorkspace;
  const refs = commerceWorkspaceSceneReferences();
  const requestCard = {
    type: "commerce",
    sceneOnly: true,
    model: settings.imageModel,
    imageQuality: workspace.quality,
    imageResolution: workspace.resolution,
    aspect: workspace.aspect,
    size: sizeForImage(workspace.aspect, workspace.resolution)
  };
  return agnesImageRequest(requestCard, apiKey, prompt, refs.imageRefs, refs.imageRoles);
}

function commerceWorkspaceResult(id) {
  return state.commerceWorkspace.results.find(result => result.id === id) || null;
}

function activeCommerceWorkspaceResult() {
  const workspace = state.commerceWorkspace;
  return commerceWorkspaceResult(workspace.activeResultId) || workspace.results[0] || null;
}

function createCommerceWorkspaceResult(url, mime, prompt, copy = {}) {
  const workspace = state.commerceWorkspace;
  const composition = createCommerceComposition(workspace);
  const sceneWidth = composition.width;
  const sceneHeight = composition.height;
  composition.layers.unshift(commerceLayer("scene", {
    src: url,
    name: "AI 场景",
    x: 0,
    y: 0,
    width: sceneWidth,
    height: sceneHeight,
    z: 0
  }));
  const normalizedCopy = normalizeCommerceCopy(copy);
  const copyLayer = commerceCopyLayer(normalizedCopy, composition);
  if (copyLayer) composition.layers.push(copyLayer);
  composition.layers.sort((a, b) => a.z - b.z);
  return {
    id: uid("commerce-result"),
    url,
    previewUrl: url,
    mime: mime || "image/png",
    prompt: String(prompt || ""),
    copy: normalizedCopy,
    composition,
    createdAt: Date.now(),
    status: "done"
  };
}

function commerceLayerLabel(layer) {
  return ({ product: "产品", scene: "场景", model: "模特", copy: "中文文案", decoration: "装饰" }[layer.type] || "图层");
}

function renderCommerceLayerPanel(result) {
  if (!els.commerceLayerPanel) return;
  const composition = result?.composition;
  const layers = composition?.layers || [];
  if (!layers.length) {
    els.commerceLayerPanel.innerHTML = `<div class="commerce-layer-empty">生成结果后，这里会显示可编辑图层。</div>`;
    return;
  }
  els.commerceLayerPanel.innerHTML = [...layers].sort((a, b) => b.z - a.z).map(layer => `
    <div class="commerce-layer-row ${composition.selectedLayerId === layer.id ? "active" : ""}" data-commerce-layer-id="${escapeAttr(layer.id)}">
      <strong>${escapeHtml(commerceLayerLabel(layer))}</strong><small>${layer.locked ? "已锁定" : "可编辑"}</small>
      <button type="button" data-commerce-layer-action="visibility" data-commerce-layer-id="${escapeAttr(layer.id)}" title="显示/隐藏">${layer.visible ? "显" : "隐"}</button>
      <button type="button" data-commerce-layer-action="lock" data-commerce-layer-id="${escapeAttr(layer.id)}" title="锁定/解锁">${layer.locked ? "锁" : "开"}</button>
      <button type="button" data-commerce-layer-action="scale-down" data-commerce-layer-id="${escapeAttr(layer.id)}" title="缩小">−</button>
      <button type="button" data-commerce-layer-action="scale-up" data-commerce-layer-id="${escapeAttr(layer.id)}" title="放大">＋</button>
    </div>`).join("");
}

function syncCommerceCopyEditor(result) {
  if (!els.commerceCopyEditor) return;
  const copy = result?.copy || { title: "", benefits: [] };
  els.commerceCopyTitle.value = copy.title || "";
  els.commerceCopyBenefits.value = (copy.benefits || []).join("\n");
  els.commerceCopyEditor.classList.toggle("hidden", !result);
}

function syncCommerceCopyLayer(result) {
  if (!result?.composition) return;
  const layers = result.composition.layers;
  const copyLayer = layers.find(layer => layer.type === "copy");
  const next = commerceCopyLayer(result.copy || {}, result.composition);
  if (next && copyLayer) Object.assign(copyLayer, next, { id: copyLayer.id, locked: false, z: copyLayer.z });
  else if (next) layers.push(next);
  else if (copyLayer) result.composition.layers = layers.filter(layer => layer !== copyLayer);
  result.composition.layers.sort((a, b) => a.z - b.z);
}

function selectCommerceResult(id) {
  if (!commerceWorkspaceResult(id)) return;
  state.commerceWorkspace.activeResultId = id;
  renderCommerceWorkspace();
  save();
}

function updateCommerceLayer(id, changes) {
  const result = activeCommerceWorkspaceResult();
  const layer = result?.composition?.layers.find(item => item.id === id);
  if (!layer || layer.locked) return;
  Object.assign(layer, changes);
  result.composition.selectedLayerId = id;
  renderCommerceWorkspace();
  save();
}

function commerceCanvasPoint(event, composition) {
  const rect = els.commerceCompositionPreview?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return null;
  return {
    x: (event.clientX - rect.left) * composition.width / rect.width,
    y: (event.clientY - rect.top) * composition.height / rect.height
  };
}

function commerceLayerAtPoint(composition, point) {
  return [...(composition?.layers || [])]
    .filter(layer => layer.visible && point.x >= layer.x && point.x <= layer.x + layer.width && point.y >= layer.y && point.y <= layer.y + layer.height)
    .sort((a, b) => b.z - a.z)[0] || null;
}

function scaleCommerceLayer(id, factor) {
  const result = activeCommerceWorkspaceResult();
  const layer = result?.composition?.layers.find(item => item.id === id);
  if (!layer || layer.locked) return;
  const composition = result.composition;
  const nextWidth = Math.max(48, Math.min(composition.width, layer.width * factor));
  const nextHeight = Math.max(48, Math.min(composition.height, layer.height * factor));
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  layer.width = Math.round(nextWidth);
  layer.height = Math.round(nextHeight);
  layer.x = Math.round(Math.max(0, Math.min(composition.width - layer.width, centerX - layer.width / 2)));
  layer.y = Math.round(Math.max(0, Math.min(composition.height - layer.height, centerY - layer.height / 2)));
  composition.selectedLayerId = id;
  renderCommerceWorkspace();
  save();
}

function setupCommerceComposerInteractions() {
  const canvas = els.commerceCompositionPreview;
  if (!canvas || canvas.dataset.interactionsReady === "true") return;
  canvas.dataset.interactionsReady = "true";
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const result = activeCommerceWorkspaceResult();
    const composition = result?.composition;
    const point = composition ? commerceCanvasPoint(event, composition) : null;
    const hit = point ? commerceLayerAtPoint(composition, point) : null;
    if (!composition || !hit) return;
    composition.selectedLayerId = hit.id;
    renderCommerceLayerPanel(result);
    if (hit.locked) {
      event.preventDefault();
      return;
    }
    state.commerceLayerDrag = {
      id: hit.id,
      pointerId: event.pointerId,
      start: point,
      origin: { x: hit.x, y: hit.y }
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", event => {
    const drag = state.commerceLayerDrag;
    const result = activeCommerceWorkspaceResult();
    const composition = result?.composition;
    if (!drag || !composition || drag.pointerId !== event.pointerId) return;
    const point = commerceCanvasPoint(event, composition);
    const layer = composition.layers.find(item => item.id === drag.id);
    if (!point || !layer || layer.locked) return;
    const scaleX = (point.x - drag.start.x);
    const scaleY = (point.y - drag.start.y);
    layer.x = Math.round(Math.max(0, Math.min(composition.width - layer.width, drag.origin.x + scaleX)));
    layer.y = Math.round(Math.max(0, Math.min(composition.height - layer.height, drag.origin.y + scaleY)));
    renderActiveCommerceComposition(result);
    scheduleSave();
    event.preventDefault();
  });
  const finishDrag = event => {
    if (!state.commerceLayerDrag || state.commerceLayerDrag.pointerId !== event.pointerId) return;
    state.commerceLayerDrag = null;
    canvas.classList.remove("dragging");
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* pointer may already be released */ }
    save();
  };
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("dragstart", event => event.preventDefault());
}

async function renderActiveCommerceComposition(result) {
  if (!els.commerceCompositionPreview) return;
  if (!result?.composition) {
    const ctx = els.commerceCompositionPreview.getContext("2d");
    els.commerceCompositionPreview.width = 1;
    els.commerceCompositionPreview.height = 1;
    ctx.clearRect(0, 0, 1, 1);
    if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = "选择一个生成结果开始编辑";
    return;
  }
  const renderToken = uid("commerce-preview");
  state.commercePreviewToken = renderToken;
  if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = "正在合成预览…";
  try {
    await renderCommerceComposition(result.composition, els.commerceCompositionPreview);
    if (state.commercePreviewToken !== renderToken) return;
    if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = `${result.composition.layers.length} 个图层，可单独编辑`;
  } catch (error) {
    if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = error.message || "图层预览失败";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("无法读取导出的 PNG。"));
    reader.readAsDataURL(blob);
  });
}

async function exportCommerceComposition(result) {
  if (!result?.composition) throw new Error("当前结果没有可导出的图层合成。");
  const canvas = document.createElement("canvas");
  await renderCommerceComposition(result.composition, canvas);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("浏览器无法导出 PNG。")), "image/png");
  });
  if (!blob || !blob.size) throw new Error("导出的 PNG 为空，请检查图层资源。");
  return blob;
}

async function exportActiveCommerceComposition() {
  const result = activeCommerceWorkspaceResult();
  if (!result) return;
  const button = els.commerceExportButton;
  if (button) button.disabled = true;
  try {
    const blob = await exportCommerceComposition(result);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `banana-commerce-${Date.now()}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = "PNG 已导出，中文图层已合成。";
  } catch (error) {
    if (els.commerceLayerStatus) els.commerceLayerStatus.textContent = error.message || "PNG 导出失败。";
  } finally {
    if (button) button.disabled = false;
  }
}

async function addCommerceWorkspaceResultToCanvas(id) {
  const result = commerceWorkspaceResult(id);
  if (!result) return;
  let url = result.url;
  try {
    const blob = await exportCommerceComposition(result);
    url = await blobToDataUrl(blob);
  } catch {
    // The original AI asset remains available when a remote layer cannot be composited.
  }
  setWorkspaceMode("canvas");
  const card = createCard("upload", {
    title: "电商宣传图",
    resultUrl: url,
    mime: result.mime,
    x: viewportCenter().x - 155,
    y: viewportCenter().y - 120
  });
  card.prompt = result.prompt;
  selectSingle(card.id);
  render();
  save();
}

async function downloadCommerceWorkspaceResult(id) {
  const result = commerceWorkspaceResult(id);
  if (!result) return;
  const link = document.createElement("a");
  const filename = `banana-commerce-${Date.now()}.png`;
  try {
    const url = URL.createObjectURL(await exportCommerceComposition(result));
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    link.href = result.url;
    link.download = filename;
    link.rel = "noreferrer";
    link.click();
  }
}

function handleCommerceWorkspaceUpload(event) {
  const file = event.target.files?.[0];
  const role = state.commerceWorkspace.activeSlot || "product";
  event.target.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    state.commerceWorkspace.status = "error";
    state.commerceWorkspace.error = "电商参考图只支持图片文件。";
    renderCommerceWorkspace();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.commerceWorkspace[`${role}Ref`] = { url: reader.result, name: file.name, mime: file.type };
    state.commerceWorkspace.status = "idle";
    state.commerceWorkspace.error = "";
    state.commerceWorkspace.promptStatus = "idle";
    state.commerceWorkspace.promptError = "";
    renderCommerceWorkspace();
    save();
  };
  reader.readAsDataURL(file);
}

async function generateCommerceWorkspacePrompt() {
  const workspace = state.commerceWorkspace;
  if (!workspace.productRef || workspace.promptMode !== "auto" || workspace.promptStatus === "running") return;
  collectSettings();
  const apiKey = getApiKey();
  if (!apiKey) {
    workspace.promptStatus = "error";
    workspace.promptError = "请先在 API 设置中填写 API Key。";
    renderCommerceWorkspace();
    els.settingsModal.classList.remove("hidden");
    return;
  }
  const refs = commerceWorkspaceReferences();
  const generation = nextPromptGeneration(workspace);
  const hint = promptHintFor(workspace, els.commerceWorkspacePrompt.value);
  workspace.promptStatus = "running";
  workspace.promptError = "";
  renderCommerceWorkspace();
  save();
  try {
    const data = await requestAgnesPrompt({
      apiKey,
      model: settings.promptModel || "agnes-2.0-flash",
      hint,
      generationId: generation.generationId,
      variation: generation.variation,
      imageRefs: refs.imageRefs,
      imageRoles: refs.imageRoles
    });
    const generated = promptResultPayload(data);
    if (!generated.visualPrompt) throw new Error(promptResponseError(data));
    workspace.prompt = generated.visualPrompt;
    workspace.copy = generated.copy;
    workspace.lastGeneratedPrompt = generated.visualPrompt;
    workspace.promptStatus = "done";
  } catch (error) {
    workspace.promptStatus = "error";
    workspace.promptError = isContentPolicyViolation(error) ? commercePolicyErrorMessage() : error.message || "Agnes 提示词生成失败。";
  } finally {
    renderCommerceWorkspace();
    save();
  }
}

async function generateCommerceWorkspacePromo() {
  const workspace = state.commerceWorkspace;
  if (!workspace.productRef || workspace.status === "running" || (workspace.promptMode === "auto" && !workspace.prompt.trim())) return;
  collectSettings();
  const apiKey = getApiKey();
  if (!apiKey) {
    workspace.status = "error";
    workspace.error = "请先在 API 设置中填写 API Key。";
    renderCommerceWorkspace();
    els.settingsModal.classList.remove("hidden");
    return;
  }
  const prompt = commerceWorkspacePrompt();
  const refs = commerceWorkspaceReferences();
  workspace.status = "running";
  workspace.error = "";
  renderCommerceWorkspace();
  save();
  try {
    let result;
    if (settings.provider === "custom") {
      let bodyTemplate = {};
      try { bodyTemplate = JSON.parse(settings.customBody || "{}"); } catch { throw new Error("自定义 Body Template 不是合法 JSON。"); }
      const data = await postJson("/api/custom", {
        apiKey,
        endpoint: settings.customEndpoint,
        method: settings.customMethod,
        bodyTemplate,
        prompt,
        model: settings.imageModel,
        size: sizeForImage(workspace.aspect, workspace.resolution),
        imageUrl: refs.imageRefs[0] || "",
        imageRefs: refs.imageRefs,
        imageRoles: refs.imageRoles
      });
      const url = pathGet(data.response, settings.customResultPath);
      if (!url) throw new Error("自定义 API 没有按结果字段路径返回资产 URL。");
      result = { url, mime: "image/png" };
    } else {
      const imageRequest = commerceWorkspaceImageRequest(apiKey, prompt);
      const imageResponse = await requestCommerceImage(imageRequest);
      result = imageResultUrl(imageResponse.data);
      if (!result) throw new Error("图片 API 未返回可用的图片 URL。");
      workspace.results.unshift(createCommerceWorkspaceResult(result.url, result.mime, prompt, workspace.copy));
    }
    if (settings.provider === "custom") workspace.results.unshift(createCommerceWorkspaceResult(result.url, result.mime, prompt, workspace.copy));
    workspace.activeResultId = workspace.results[0]?.id || "";
    workspace.status = "done";
  } catch (error) {
    workspace.status = "error";
    workspace.error = error.message || "电商宣传图生成失败。";
  } finally {
    renderCommerceWorkspace();
    save();
  }
}

function commercePrompt(card) {
  const custom = String(card?.prompt || "").trim();
  if (card?.commercePromptMode === "auto") return custom;
  return [
    "Create a polished e-commerce product hero image for online retail.",
    "Use the first reference image as the exact product identity and preserve its shape, proportions, material, logo placement, color, structure, and visible details without redesigning it.",
    "If a model reference is provided, use it for a natural product demonstration while keeping the product as the visual focus.",
    "If a scene reference is provided, borrow its lighting, setting, and visual mood without copying unrelated objects.",
    "Use clean commercial composition, realistic lighting, premium detail, clear product visibility, and enough blank space for Chinese e-commerce copy to be typeset later.",
    "Express selling points through product details, usage action, lighting, and composition; do not ask the image model to draw readable copy.",
    custom
  ].filter(Boolean).join("\n");
}

function commerceSafePrompt() {
  return [
    "Create one safe, single-frame, scene-only e-commerce background for online retail.",
    "Use rich but controlled brand color, tasteful gradient, real lifestyle context, material contrast, directional commercial lighting, and an intentional area for a product cutout and Chinese copy to be composited later.",
    "Do not generate products, packaging, people holding products, readable text, Chinese, English, numbers, labels, logos, watermarks, or dense small text.",
    "No people, minors, intimacy, nudity, violence, weapons, drugs, illegal activity, dangerous actions, medical claims, political content, or other sensitive themes.",
    "No collage, split screen, multi-panel detail page, multiple scenes, storyboard, shot list, or repeated subject."
  ].join(" ");
}

async function requestCommerceImage(request) {
  try {
    return { data: await postJson("/api/agnes/image", request), prompt: request.prompt };
  } catch (error) {
    if (!isContentPolicyViolation(error)) throw error;
    try {
      const safeRequest = { ...request, prompt: commerceSafePrompt() };
      return { data: await postJson("/api/agnes/image", safeRequest), prompt: safeRequest.prompt };
    } catch (retryError) {
      if (isContentPolicyViolation(retryError)) retryError.message = commercePolicyErrorMessage();
      throw retryError;
    }
  }
}

function promptValueText(value, depth = 0) {
  if (depth > 5 || value == null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      const parsedText = promptValueText(parsed, depth + 1);
      if (parsedText) return parsedText;
    } catch {
      // Plain prompt text is the normal response; only JSON-like strings need parsing.
    }
    const sseText = trimmed.split(/\r?\n/)
      .filter(line => /^data:\s*/i.test(line))
      .map(line => line.replace(/^data:\s*/i, "").trim())
      .map(line => promptValueText(line, depth + 1))
      .filter(Boolean)
      .join(" ")
      .trim();
    return sseText || trimmed;
  }
  if (Array.isArray(value)) return value.map(item => promptValueText(item, depth + 1)).filter(Boolean).join(" ").trim();
  if (typeof value !== "object") return "";
  const candidates = [
    value.text,
    value.value,
    value.output_text,
    value.content,
    value.output,
    value.answer,
    value.result,
    value.prompt,
    value.message?.content,
    value.message?.text,
    value.reasoning_content,
    value.delta?.content,
    value.delta?.text,
    value.choices,
    value.data,
    value.body,
    value.response
  ];
  for (const candidate of candidates) {
    const text = promptValueText(candidate, depth + 1);
    if (text) return text;
  }
  return "";
}

function promptResultText(data) {
  const response = data?.response;
  const candidates = [
    response?.choices?.[0]?.message?.content,
    response?.choices?.[0]?.text,
    response?.choices?.[0]?.message?.reasoning_content,
    response?.output_text,
    response?.output,
    response?.data,
    response?.content,
    response?.text,
    response?.answer,
    response?.result,
    data?.choices,
    data?.output_text,
    data?.output,
    data?.data,
    data?.content,
    data?.text,
    data?.answer,
    data?.result,
    response,
    data
  ];
  for (const candidate of candidates) {
    const text = promptValueText(candidate);
    if (text) return text;
  }
  return "";
}

function promptJsonCandidate(value, depth = 0) {
  if (depth > 5 || value == null) return null;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/^```(?:json|text)?\s*/i, "").replace(/\s*```$/i, "");
    try { return promptJsonCandidate(JSON.parse(cleaned), depth + 1); } catch { return null; }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = promptJsonCandidate(item, depth + 1);
      if (parsed) return parsed;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  if (value.visualPrompt || value.copy) return value;
  for (const key of ["content", "output", "result", "data", "response", "message", "choices", "body"]) {
    const parsed = promptJsonCandidate(value[key], depth + 1);
    if (parsed) return parsed;
  }
  return null;
}

function promptResultPayload(data) {
  const parsed = promptJsonCandidate(data);
  if (parsed) {
    const visualPrompt = cleanGeneratedPrompt(parsed.visualPrompt || parsed.prompt || "");
    return { visualPrompt, copy: normalizeCommerceCopy(parsed.copy) };
  }
  return { visualPrompt: cleanGeneratedPrompt(promptResultText(data)), copy: { title: "", benefits: [], specs: [] } };
}

function promptResponseError(data) {
  const response = data?.response || data || {};
  const choice = response.choices?.[0] || {};
  const message = choice.message || {};
  const refusal = promptValueText(message.refusal || response.refusal);
  if (refusal) return `Agnes 拒绝了这次提示词请求：${refusal}`;
  const finishReason = choice.finish_reason || response.finish_reason;
  if (finishReason && finishReason !== "stop") return `Agnes 返回了空文本（finish_reason: ${finishReason}）。请减少参考图或补充更明确的商品描述后重试。`;
  const fields = Object.keys(response).filter(key => key !== "request").slice(0, 12).join(", ") || "未知";
  return `Agnes 返回了空文本，响应字段：${fields}。请检查当前提示词模型是否支持多模态输出。`;
}

function cleanGeneratedPrompt(value) {
  return String(value || "")
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

const PROMPT_VARIATIONS = [
  "强调材质触感、工艺细节和高级商业摄影质感。",
  "强调产品的核心使用动作、用户收益和自然可信的使用场景。",
  "强调醒目的主视觉构图、清晰层次和适合电商首屏的视觉冲击力。",
  "强调柔和但有方向性的光线、色彩对比和产品轮廓识别度。",
  "强调品牌感、留白布局和适合后期放置短标题的版式空间。",
  "强调生活方式氛围、目标用户联想和真实可购买的商业呈现。"
];

function nextPromptGeneration(target) {
  target.promptGeneration = Math.max(0, Number(target.promptGeneration || 0)) + 1;
  const index = (target.promptGeneration - 1) % PROMPT_VARIATIONS.length;
  return {
    generationId: `${Date.now()}-${target.promptGeneration}-${Math.random().toString(36).slice(2, 8)}`,
    variation: PROMPT_VARIATIONS[index]
  };
}

function promptHintFor(target, currentValue = "") {
  const current = String(currentValue || "").trim();
  if (current && current !== String(target.lastGeneratedPrompt || "").trim()) return current;
  const savedHint = String(target.promptHint || "").trim();
  if (savedHint) return savedHint;
  return Number(target.promptGeneration || 0) === 0 ? String(target.prompt || "").trim() : "";
}

async function generateCommercePrompt() {
  const card = selectedCommerceCard();
  if (!card || card.commercePromptMode !== "auto") return;
  collectSettings();
  const apiKey = getApiKey();
  if (!card.productRef?.url) {
    card.promptStatus = "error";
    card.promptError = "请先上传商品图。";
    render();
    return;
  }
  if (!apiKey) {
    card.promptStatus = "error";
    card.promptError = "请先在 API 设置中填写 API Key。";
    render();
    els.settingsModal.classList.remove("hidden");
    return;
  }

  const refs = commerceReferencePayload(card);
  const generation = nextPromptGeneration(card);
  const hint = promptHintFor(card);
  card.promptStatus = "running";
  card.promptError = "";
  card.error = "";
  render();
  save();
  try {
    const data = await requestAgnesPrompt({
      apiKey,
      model: settings.promptModel || "agnes-2.0-flash",
      hint,
      generationId: generation.generationId,
      variation: generation.variation,
      imageRefs: refs.imageRefs,
      imageRoles: refs.imageRoles
    });
    const generated = cleanGeneratedPrompt(promptResultText(data));
    if (!generated) throw new Error(promptResponseError(data));
    card.prompt = generated;
    card.lastGeneratedPrompt = generated;
    card.promptStatus = "done";
    card.promptError = "";
  } catch (error) {
    card.promptStatus = "error";
    card.promptError = isContentPolicyViolation(error) ? commercePolicyErrorMessage() : error.message || "Agnes 提示词生成失败。";
  } finally {
    render();
    save();
  }
}

function imageResultUrl(data) {
  const item = data.response?.data?.[0] || {};
  if (item.url) return { url: item.url, mime: "image/png" };
  if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, mime: "image/png" };
  return null;
}

async function generateCommercePromo() {
  const card = selectedCommerceCard();
  if (!card) return;
  collectSettings();
  const apiKey = getApiKey();
  if (!card.productRef?.url) {
    card.status = "error";
    card.error = "请先上传商品图。";
    render();
    return;
  }
  if (card.commercePromptMode === "auto" && !String(card.prompt || "").trim()) {
    card.status = "error";
    card.error = "请先生成提示词。";
    card.promptStatus = "error";
    card.promptError = "请先点击 Agnes 写提示词，或在文本框中填写提示词。";
    render();
    return;
  }
  if (card.promptStatus === "running") return;
  if (!apiKey) {
    card.status = "error";
    card.error = "请先在 API 设置中填写 API Key。";
    render();
    els.settingsModal.classList.remove("hidden");
    return;
  }

  const prompt = commercePrompt(card);
  const refs = commerceReferencePayload(card);
  card.status = "running";
  card.progress = 8;
  card.error = "";
  render();
  save();
  try {
    let result;
    if (settings.provider === "custom") {
      let bodyTemplate = {};
      try { bodyTemplate = JSON.parse(settings.customBody || "{}"); } catch { throw new Error("自定义 Body Template 不是合法 JSON。"); }
      const data = await postJson("/api/custom", {
        apiKey,
        endpoint: settings.customEndpoint,
        method: settings.customMethod,
        bodyTemplate,
        prompt,
        model: settings.imageModel,
        size: commerceOutputSize(card),
        imageUrl: refs.imageRefs[0] || "",
        imageRefs: refs.imageRefs,
        imageRoles: refs.imageRoles
      });
      const url = pathGet(data.response, settings.customResultPath);
      if (!url) throw new Error("自定义 API 没有按结果字段路径返回资产 URL。");
      result = { url, mime: "image/png" };
    } else {
      const imageResponse = await requestCommerceImage(agnesImageRequest(card, apiKey, prompt, refs.imageRefs, refs.imageRoles));
      result = imageResultUrl(imageResponse.data);
      if (!result) throw new Error("图片 API 未返回可用的图片 URL。");
      createCommerceResultCard(card, result.url, imageResponse.prompt, result.mime);
    }
    if (settings.provider === "custom") createCommerceResultCard(card, result.url, prompt, result.mime);
    card.status = "done";
    card.progress = 100;
    card.error = "";
  } catch (error) {
    card.status = "error";
    card.progress = 0;
    card.error = error.message || "电商宣传图生成失败。";
  } finally {
    render();
    save();
  }
}

async function generateSelected() {
  const card = selectedCard();
  if (!card || !["image", "video"].includes(card.type)) return;
  collectSettings();
  const apiKey = getApiKey();
  const prompt = combinedPrompt(card);
  if (!apiKey) {
    els.settingsModal.classList.remove("hidden");
    updateSelected({ status: "error", error: "请先在 API 设置中填写 Agnes API Key。" });
    return;
  }
  if (!prompt) {
    updateSelected({ status: "error", error: "请先填写提示词，或连接一个文本/脚本节点作为输入。" });
    return;
  }
  if (card.type === "video" && card.task && isRateLimitError({ message: card.error || "" })) {
    updateSelected({ status: "running", progress: Math.max(12, Number(card.progress || 12)), error: "继续查询已有视频任务，不会重复提交生成。" });
    try {
      await pollVideo(card.id, apiKey);
    } catch (error) {
      updateCard(card.id, { status: "error", progress: 0, error: error.message });
    }
    return;
  }
  updateSelected({ status: "running", progress: 8, error: "" });
  try {
    if (settings.provider === "custom") await generateCustom(card, apiKey, prompt);
    else if (card.type === "image") await generateAgnesImage(card, apiKey, prompt);
    else await generateAgnesVideo(card, apiKey, prompt);
  } catch (error) {
    updateCard(card.id, { status: "error", progress: 0, error: error.message });
  }
}

async function generateCustom(card, apiKey, prompt) {
  let bodyTemplate = {};
  try { bodyTemplate = JSON.parse(settings.customBody || "{}"); } catch { throw new Error("自定义 Body Template 不是合法 JSON。"); }
  const refs = cardRefs(card);
  const data = await postJson("/api/custom", { apiKey, endpoint: settings.customEndpoint, method: settings.customMethod, bodyTemplate, prompt, model: card.model, size: card.size, imageUrl: refs[0] || "", imageRefs: refs, imageRoles: refs.map(() => "reference") });
  const result = pathGet(data.response, settings.customResultPath);
  if (!result) throw new Error("自定义 API 没有按结果字段路径返回资产 URL。");
  const mime = card.type === "video" ? "video/mp4" : "image/png";
  duplicateResultCard(card, card.type, result, mime);
  updateCard(card.id, { status: "done", progress: 100, resultUrl: result, mime });
}

async function generateAgnesImage(card, apiKey, prompt) {
  const data = await postJson("/api/agnes/image", agnesImageRequest(card, apiKey, prompt, cardRefs(card)));
  const item = data.response?.data?.[0] || {};
  let resultUrl = item.url || "";
  if (!resultUrl && item.b64_json) resultUrl = `data:image/png;base64,${item.b64_json}`;
  if (!resultUrl) throw new Error("Agnes 图片 API 未返回 data[0].url 或 data[0].b64_json。");
  duplicateResultCard(card, "image", resultUrl, "image/png");
  updateCard(card.id, { status: "done", progress: 100, resultUrl, mime: "image/png" });
}

async function generateAgnesVideo(card, apiKey, prompt) {
  const { width, height } = parseSize(card.size);
  const created = await postJson("/api/agnes/video", { apiKey, model: card.model || settings.videoModel, prompt, imageRefs: cardRefs(card), width, height, num_frames: card.num_frames || 121, frame_rate: card.frame_rate || 24, negative_prompt: card.negative_prompt, generate_audio: card.generate_audio });
  const response = created.response || {};
  updateCard(card.id, { status: response.status || "queued", progress: response.progress || 12, task: { video_id: response.video_id, task_id: response.task_id || response.id } });
  await pollVideo(card.id, apiKey);
}

async function pollVideo(cardId, apiKey) {
  const maxAttempts = 120;
  let delay = normalizePollInterval(settings.pollInterval);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const card = findCard(cardId);
    if (!card?.task) return;
    await sleep(delay);

    let data;
    try {
      data = await postJson("/api/agnes/video-result", { apiKey, model: card.model || settings.videoModel, video_id: card.task.video_id, task_id: card.task.task_id });
    } catch (error) {
      if (isRateLimitError(error)) {
        delay = Math.min(MAX_VIDEO_POLL_INTERVAL, Math.max(Math.round(delay * 1.8), 15000));
        updateCard(cardId, {
          status: "running",
          progress: Math.min(95, Number(card.progress || 12)),
          error: rateLimitMessage(delay)
        });
        continue;
      }
      throw error;
    }

    delay = normalizePollInterval(settings.pollInterval);
    const result = data.response || {};
    const status = result.status || "running";
    const progress = Number(result.progress ?? Math.min(95, 20 + attempt * 3));
    updateCard(cardId, { status: status === "completed" ? "running" : status, progress, error: "" });
    if (status === "completed" && result.url) {
      const current = findCard(cardId);
      duplicateResultCard(current, "video", result.url, "video/mp4");
      updateCard(cardId, { status: "done", progress: 100, resultUrl: result.url, mime: "video/mp4", error: "" });
      return;
    }
    if (status === "failed") throw new Error(result.error ? JSON.stringify(result.error) : "Agnes 视频生成失败。");
  }
  throw new Error("视频生成轮询超时。可稍后重新点击生成或查看 Agnes 控制台。");
}

function updateCard(id, patch) {
  const card = findCard(id);
  if (!card) return;
  Object.assign(card, patch);
  render();
  save();
}

function setupActions() {
  els.generateBtn.addEventListener("click", generateSelected);
  document.getElementById("deleteCard").addEventListener("click", deleteSelectedNode);
}

function seedDemo() {
  createCard("text", { prompt: "一条香蕉主题的霓虹广告，黑色背景，绿色边缘光，商业摄影质感。" });
  createCard("image", { prompt: "high detail, studio composition" });
  createCard("video", { prompt: "slow cinematic dolly movement, tropical neon mood" });
  state.cards[0].x -= 420;
  state.cards[1].x -= 80;
  state.cards[2].x += 300;
  state.cards[1].y += 80;
  state.cards[2].y += 80;
  state.edges.push({ id: uid("edge"), from: state.cards[0].id, to: state.cards[1].id });
  state.edges.push({ id: uid("edge"), from: state.cards[1].id, to: state.cards[2].id });
  selectSingle(state.cards[1].id);
}

function deleteSelectedNode() {
  const deletedIds = new Set(selectedIds());
  if (!deletedIds.size) return;
  state.cards = state.cards.filter(card => !deletedIds.has(card.id));
  state.edges = state.edges.filter(edge => !deletedIds.has(edge.from) && !deletedIds.has(edge.to));
  state.cards.forEach(card => { card.refs = (card.refs || []).filter(id => !deletedIds.has(id)); });
  setSelected([]);
  render();
  save();
}

function copyNodes(mode = "selected") {
  const selected = new Set(selectedIds());
  const cards = mode === "all" ? state.cards : state.cards.filter(card => selected.has(card.id));
  if (!cards.length) return;
  const ids = new Set(cards.map(card => card.id));
  state.clipboard = {
    cards: cards.map(card => JSON.parse(JSON.stringify(card))),
    edges: state.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)).map(edge => ({ ...edge }))
  };
}

function pasteNodes() {
  if (!state.clipboard || !state.clipboard.cards.length) return;
  const base = state.contextWorld || viewportCenter();
  const minX = Math.min(...state.clipboard.cards.map(card => card.x));
  const minY = Math.min(...state.clipboard.cards.map(card => card.y));
  const idMap = new Map();
  const pasted = state.clipboard.cards.map((card, index) => {
    const next = JSON.parse(JSON.stringify(card));
    const newId = uid(next.type || "card");
    idMap.set(card.id, newId);
    next.id = newId;
    next.x = Math.round(base.x + (card.x - minX) + index * 12);
    next.y = Math.round(base.y + (card.y - minY) + index * 12);
    next.status = next.status === "running" || next.status === "queued" ? "idle" : next.status;
    next.progress = next.status === "idle" ? 0 : next.progress;
    next.task = null;
    return next;
  });
  const pastedEdges = state.clipboard.edges
    .filter(edge => idMap.has(edge.from) && idMap.has(edge.to))
    .map(edge => ({ id: uid("edge"), from: idMap.get(edge.from), to: idMap.get(edge.to) }));
  state.cards.push(...pasted);
  state.edges.push(...pastedEdges);
  setSelected(pasted.map(card => card.id));
  hideContextMenu();
  render();
  save();
}

function showContextMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  state.suppressNextClick = true;
  const cardEl = event.target.closest(".card");
  if (cardEl && !isCardSelected(cardEl.dataset.id)) selectSingle(cardEl.dataset.id);
  state.contextWorld = clientToWorld(event.clientX, event.clientY);
  const menu = els.contextMenu;
  menu.classList.remove("hidden");
  const pad = 10;
  const rect = menu.getBoundingClientRect();
  const x = Math.min(event.clientX, window.innerWidth - rect.width - pad);
  const y = Math.min(event.clientY, window.innerHeight - rect.height - pad);
  menu.style.left = `${Math.max(pad, x)}px`;
  menu.style.top = `${Math.max(pad, y)}px`;
  render();
}

function openContextMenuAt(clientX, clientY) {
  showContextMenu({
    clientX,
    clientY,
    target: els.viewport,
    preventDefault() {},
    stopPropagation() {}
  });
}

function hideContextMenu() {
  els.contextMenu.classList.add("hidden");
}

function openNodePaletteAtContext() {
  els.nodePalette.classList.remove("hidden");
  hideContextMenu();
}

function setupContextMenu() {
  document.addEventListener("contextmenu", event => {
    event.preventDefault();
    if (event.target.closest("#canvasViewport")) showContextMenu(event);
  }, true);
  els.viewport.addEventListener("contextmenu", showContextMenu);
  els.viewport.addEventListener("mousedown", event => {
    if (event.button === 2) showContextMenu(event);
  });
  els.contextMenu.addEventListener("contextmenu", event => event.preventDefault());
  els.contextMenu.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "upload") document.getElementById("uploadInput").click();
    if (action === "add") openNodePaletteAtContext();
    if (action === "copy-selected") { copyNodes("selected"); hideContextMenu(); }
    if (action === "copy-all") { copyNodes("all"); hideContextMenu(); }
    if (action === "paste") pasteNodes();
    if (action === "delete") { deleteSelectedNode(); hideContextMenu(); }
  });
  window.addEventListener("click", event => {
    if (state.suppressNextClick) {
      state.suppressNextClick = false;
      return;
    }
    if (!event.target.closest(".context-menu")) hideContextMenu();
    if (!event.target.closest(".connection-create-menu")) hideConnectionCreateMenu();
    if (!event.target.closest(".connection-create-menu")) hideConnectionCreateMenu();
  });
  window.addEventListener("blur", () => { hideContextMenu(); hideConnectionCreateMenu(); });
  window.__bananaCanvasDebug = {
    openContextMenuAt,
    closeContextMenu: hideContextMenu,
    summary: () => ({
      cards: state.cards.length,
      edges: state.edges.length,
      selectedId: state.selectedId,
      selectedIds: selectedIds(),
      menuVisible: !els.contextMenu.classList.contains("hidden")
    })
  };
}

function showConnectionCreateMenu(from, clientX, clientY) {
  const source = findCard(from);
  if (!source) return;
  const world = clientToWorld(clientX, clientY);
  state.pendingConnection = { from, world };
  state.suppressNextClick = true;
  const menu = els.connectionCreateMenu;
  menu.classList.remove("hidden");
  const rect = els.viewport.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const pad = 12;
  const x = Math.min(clientX - rect.left + 14, rect.width - menuRect.width - pad);
  const y = Math.min(clientY - rect.top - 24, rect.height - menuRect.height - pad);
  menu.style.left = `${Math.max(pad, x)}px`;
  menu.style.top = `${Math.max(pad, y)}px`;
}

function hideConnectionCreateMenu() {
  els.connectionCreateMenu.classList.add("hidden");
  state.pendingConnection = null;
}

function createNodeFromConnection(type) {
  const pending = state.pendingConnection;
  if (!pending?.from) return;
  if (type === "upload") {
    state.pendingUploadConnection = { ...pending };
    hideConnectionCreateMenu();
    document.getElementById("uploadInput").click();
    return;
  }
  const def = NODE_DEFS[type] || NODE_DEFS.text;
  const card = createCard(type, {
    x: pending.world.x,
    y: pending.world.y - def.h / 2
  });
  addEdge(pending.from, card.id);
  hideConnectionCreateMenu();
  render();
  save();
}

function setupConnectionCreateMenu() {
  els.connectionCreateMenu.addEventListener("pointerdown", event => event.stopPropagation());
  els.connectionCreateMenu.addEventListener("click", event => {
    event.stopPropagation();
    const button = event.target.closest("button[data-chain-create]");
    if (!button) return;
    createNodeFromConnection(button.dataset.chainCreate);
  });
}
function openShortcuts() {
  hideContextMenu();
  hideConnectionCreateMenu();
  els.nodePalette.classList.add("hidden");
  els.shortcutsModal.classList.remove("hidden");
}

function closeShortcuts() {
  els.shortcutsModal.classList.add("hidden");
}

function setupUtilityControls() {
  document.getElementById("openShortcuts").addEventListener("click", openShortcuts);
  els.shortcutTool.addEventListener("click", openShortcuts);
  document.getElementById("closeShortcuts").addEventListener("click", closeShortcuts);
  els.shortcutsModal.addEventListener("click", event => {
    if (event.target === els.shortcutsModal) closeShortcuts();
  });
  document.getElementById("shortcutFit").addEventListener("click", () => {
    closeShortcuts();
    fitView();
  });
  document.getElementById("shortcutAddNode").addEventListener("click", () => {
    closeShortcuts();
    els.nodePalette.classList.remove("hidden");
  });
  document.getElementById("shortcutUpload").addEventListener("click", () => {
    closeShortcuts();
    document.getElementById("uploadInput").click();
  });
  document.getElementById("shortcutSettings").addEventListener("click", () => {
    closeShortcuts();
    document.getElementById("openSettings").click();
  });
}

function isTypingTarget(target) {
  return target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function setupKeyboardShortcuts() {
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeShortcuts();
      hideContextMenu();
      hideConnectionCreateMenu();
      els.nodePalette.classList.add("hidden");
      return;
    }
    if (isTypingTarget(event.target)) {
      if (event.key === "Enter" && !event.shiftKey && event.target === els.cardPrompt) {
        event.preventDefault();
        generateSelected();
      }
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelectedNode();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copyNodes("selected");
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "v") {
      event.preventDefault();
      state.contextWorld = viewportCenter();
      pasteNodes();
      return;
    }
    if (event.ctrlKey && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      state.viewport.scale = Math.min(2.5, state.viewport.scale * 1.15);
      render();
      save();
      return;
    }
    if (event.ctrlKey && event.key === "-") {
      event.preventDefault();
      state.viewport.scale = Math.max(0.25, state.viewport.scale / 1.15);
      render();
      save();
      return;
    }
    if (event.ctrlKey && event.key === "0") {
      event.preventDefault();
      fitView();
    }
  });
}
function boot() {
  load();
  setupToolbar();
  setupCanvasEvents();
  setupContextMenu();
  setupConnectionCreateMenu();
  setupTopbar();
  setupUtilityControls();
  setupKeyboardShortcuts();
  setupSettings();
  setupActions();
  bindInputs();
  if (!state.cards.length) seedDemo();
  if (state.workspaceMode === "commerce") setWorkspaceMode("commerce");
  else if (state.workspaceMode === "product-video") setWorkspaceMode("product-video");
  else render();
  save();
}

boot();
















