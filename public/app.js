const STORAGE_KEY = "local-ai-canvas-state-v2";
const SETTINGS_KEY = "local-ai-canvas-settings-v1";
const API_KEY_SESSION = "local-ai-canvas-api-key";
const CANVAS_LIBRARY_SCHEMA = "banana-canvas-library-v1";
const SVG_OFFSET = 5000;
const DRAG_EDGE_MARGIN = 84;
const DRAG_EDGE_MAX_SPEED = 560;
const DRAG_THRESHOLD_PX = 4;
const DUPLICATE_OFFSET_WORLD = 24;

const els = {
  stage: document.getElementById("canvasStage"),
  alignmentGuides: document.getElementById("alignmentGuides"),
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
  customResultPath: document.getElementById("customResultPath"),
  canvasSearch: document.getElementById("canvasSearch"),
  canvasSearchResults: document.getElementById("canvasSearchResults"),
  canvasSnapshotList: document.getElementById("canvasSnapshotList"),
  openCanvasLibrary: document.getElementById("openCanvasLibrary"),
  canvasLibraryMenu: document.getElementById("canvasLibraryMenu"),
  activeCanvasName: document.getElementById("activeCanvasName"),
  canvasLibraryList: document.getElementById("canvasLibraryList"),
  newCanvas: document.getElementById("newCanvas"),
  saveCanvas: document.getElementById("saveCanvas"),
  renameCanvas: document.getElementById("renameCanvas"),
  deleteCanvas: document.getElementById("deleteCanvas")
};

const state = {
  cards: [],
  edges: [],
  groups: [],
  canvasSnapshots: [],
  selectedId: null,
  selectedIds: [],
  selectedEdgeId: null,
  viewport: { x: 300, y: 160, scale: 1 },
  pendingDrag: null,
  drag: null,
  pan: null,
  minimapPan: null,
  selectionBox: null,
  alignmentGuides: [],
  connecting: null,
  clipboard: null,
  contextWorld: null,
  pendingConnection: null,
  pendingUploadConnection: null,
  historyPast: [],
  historyFuture: [],
  historyTransaction: null,
  historyRestoring: false,
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
    results: []
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

let lastCanvasSnapshot = null;
let pendingLocalSavePayload = null;
let pendingSettingsPayload = null;
const cardNodes = new Map();
const edgeNodes = new Map();
const edgeHitNodes = new Map();
const interactionController = CanvasEngine.createInteractionController();
const debouncedLocalSave = CanvasEngine.createDebouncedCommit(commitScheduledLocalSave, 300);
let pendingInteractionFlags = {};
let renderedInspectorSelectionId = null;
let canvasLibrary = {
  schema: CANVAS_LIBRARY_SCHEMA,
  activeCanvasId: "canvas_default",
  canvases: []
};

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

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function canvasSnapshot() {
  return {
    cards: cloneData(state.cards),
    edges: cloneData(state.edges),
    groups: cloneData(state.groups),
    viewport: cloneData(state.viewport)
  };
}

function snapshotKey(snapshot) {
  return JSON.stringify(snapshot || {});
}

function normalizeCanvasGroup(group = {}) {
  const memberIds = Array.isArray(group.memberIds) ? group.memberIds.map(String).filter(id => state.cards.some(card => card.id === id)) : [];
  return {
    id: String(group.id || uid("group")),
    name: String(group.name || "未命名分组").trim().slice(0, 32) || "未命名分组",
    memberIds: [...new Set(memberIds)],
    color: String(group.color || "#e7ff25"),
    createdAt: Number(group.createdAt || Date.now())
  };
}

function normalizeCanvasSnapshots(snapshots) {
  if (!Array.isArray(snapshots)) return [];
  return snapshots.slice(0, 12).map(snapshot => ({
    id: String(snapshot.id || uid("snapshot")),
    name: String(snapshot.name || "历史快照").slice(0, 32),
    createdAt: Number(snapshot.createdAt || Date.now()),
    state: {
      cards: Array.isArray(snapshot.state?.cards) ? snapshot.state.cards : [],
      edges: Array.isArray(snapshot.state?.edges) ? snapshot.state.edges : [],
      groups: Array.isArray(snapshot.state?.groups) ? snapshot.state.groups : [],
      viewport: snapshot.state?.viewport ? {
        x: Number(snapshot.state.viewport.x ?? 300),
        y: Number(snapshot.state.viewport.y ?? 160),
        scale: Math.min(2.5, Math.max(0.25, Number(snapshot.state.viewport.scale || 1)))
      } : undefined
    }
  }));
}

function getApiKey() {
  return sessionStorage.getItem(API_KEY_SESSION) || "";
}

function setApiKey(value) {
  if (value.trim()) sessionStorage.setItem(API_KEY_SESSION, value.trim());
  else sessionStorage.removeItem(API_KEY_SESSION);
}

function normalizeCanvasEdges(edges) {
  const source = Array.isArray(edges) ? edges : [];
  const reservedStringIds = new Set();
  source.forEach(edge => {
    if (typeof edge?.id === "string" && edge.id.trim() && !reservedStringIds.has(edge.id)) reservedStringIds.add(edge.id);
  });
  const usedIds = new Set();
  return source.map(edge => {
    const stringId = typeof edge?.id === "string" && edge.id.trim() ? edge.id : "";
    const numericId = typeof edge?.id === "number" && Number.isFinite(edge?.id) ? String(edge.id) : "";
    let id = "";
    if (stringId && !usedIds.has(stringId)) id = stringId;
    else if (numericId && !reservedStringIds.has(numericId) && !usedIds.has(numericId)) id = numericId;
    if (!id) {
      do id = uid("edge"); while (usedIds.has(id) || reservedStringIds.has(id));
    }
    usedIds.add(id);
    return { ...edge, id };
  });
}

function createCanvasRecord(name = "未命名画布", source = {}) {
  const now = Date.now();
  return {
    id: String(source.id || uid("canvas")),
    name: String(name || "未命名画布").trim().slice(0, 40) || "未命名画布",
    createdAt: Number(source.createdAt || now),
    updatedAt: Number(source.updatedAt || now),
    cards: Array.isArray(source.cards) ? cloneData(source.cards) : [],
    edges: normalizeCanvasEdges(Array.isArray(source.edges) ? cloneData(source.edges) : []),
    groups: Array.isArray(source.groups) ? cloneData(source.groups) : [],
    canvasSnapshots: normalizeCanvasSnapshots(source.canvasSnapshots),
    viewport: {
      x: Number(source.viewport?.x ?? 300),
      y: Number(source.viewport?.y ?? 160),
      scale: Math.min(2.5, Math.max(0.25, Number(source.viewport?.scale || 1)))
    },
    workspaceMode: ["commerce", "product-video"].includes(source.workspaceMode) ? source.workspaceMode : "canvas",
    commerceWorkspace: normalizeCommerceWorkspace(source.commerceWorkspace || {}),
    productVideoWorkspace: normalizeProductVideoWorkspace(source.productVideoWorkspace || {})
  };
}

function captureCurrentCanvas() {
  const existing = canvasLibrary.canvases.find(canvas => canvas.id === canvasLibrary.activeCanvasId) || {};
  return createCanvasRecord(existing.name || "未命名画布", {
    ...existing,
    id: canvasLibrary.activeCanvasId,
    updatedAt: Date.now(),
    cards: state.cards,
    edges: state.edges,
    groups: state.groups,
    canvasSnapshots: state.canvasSnapshots,
    viewport: state.viewport,
    workspaceMode: state.workspaceMode,
    commerceWorkspace: state.commerceWorkspace,
    productVideoWorkspace: state.productVideoWorkspace
  });
}

function showPersistenceError() {
  els.saveState.textContent = "本地保存失败，将在下次更改时重试。";
  els.saveState.classList.add("error");
}

function clearPersistenceError() {
  if (pendingLocalSavePayload || pendingSettingsPayload) return;
  if (els.saveState.textContent.startsWith("本地保存失败")) els.saveState.textContent = "本地保存已恢复";
  els.saveState.classList.remove("error");
}

function persistCanvasLibrary(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.library));
    pendingLocalSavePayload = null;
    clearPersistenceError();
    renderCanvasLibrary();
    return true;
  } catch (error) {
    pendingLocalSavePayload = payload;
    showPersistenceError(error);
    return false;
  }
}

function captureLocalSavePayload(canvasId = canvasLibrary.activeCanvasId) {
  if (!canvasLibrary.canvases.length) {
    const canvas = createCanvasRecord("未命名画布", { id: canvasLibrary.activeCanvasId });
    canvasLibrary.canvases = [canvas];
    canvasLibrary.activeCanvasId = canvas.id;
  }
  state.groups = state.groups.map(normalizeCanvasGroup).filter(group => group.memberIds.length);
  const current = captureCurrentCanvas();
  const index = canvasLibrary.canvases.findIndex(canvas => canvas.id === canvasLibrary.activeCanvasId);
  if (index >= 0) canvasLibrary.canvases[index] = current;
  else canvasLibrary.canvases.push(current);
  return {
    canvasId,
    activeCanvasId: current.id,
    snapshot: canvasSnapshot(),
    library: cloneData({
      schema: CANVAS_LIBRARY_SCHEMA,
      activeCanvasId: canvasLibrary.activeCanvasId,
      canvases: canvasLibrary.canvases
    })
  };
}

function applyCanvasRecord(record) {
  const canvas = createCanvasRecord(record?.name || "未命名画布", record || {});
  state.cards = canvas.cards;
  state.edges = canvas.edges;
  state.groups = canvas.groups;
  state.canvasSnapshots = canvas.canvasSnapshots;
  state.viewport = canvas.viewport;
  state.workspaceMode = canvas.workspaceMode;
  state.commerceWorkspace = canvas.commerceWorkspace;
  state.productVideoWorkspace = canvas.productVideoWorkspace;
  state.historyPast = [];
  state.historyFuture = [];
  state.historyTransaction = null;
  state.historyRestoring = false;
  setSelected([]);
  normalizeCanvasState();
  lastCanvasSnapshot = canvasSnapshot();
}

function activeCanvasRecord() {
  return canvasLibrary.canvases.find(canvas => canvas.id === canvasLibrary.activeCanvasId) || null;
}

function canvasStateFor(canvasId) {
  if (canvasId === canvasLibrary.activeCanvasId) return state;
  return canvasLibrary.canvases.find(canvas => canvas.id === canvasId) || null;
}

function findCanvasCard(canvasId, cardId) {
  return canvasStateFor(canvasId)?.cards?.find(card => card.id === cardId) || null;
}

function mutateCanvasById(canvasId, mutate, renderActive = render) {
  const target = canvasStateFor(canvasId);
  if (!target) return null;
  const result = mutate(target);
  if (canvasId === canvasLibrary.activeCanvasId) {
    renderActive();
    save();
  } else {
    target.updatedAt = Date.now();
    scheduleLocalSave(canvasId);
  }
  return result;
}

function renderCanvasLibrary() {
  if (!els.canvasLibraryList || !els.activeCanvasName) return;
  const active = activeCanvasRecord();
  els.activeCanvasName.textContent = active?.name || "未命名画布";
  els.canvasLibraryList.innerHTML = canvasLibrary.canvases.map(canvas => {
    const activeClass = canvas.id === canvasLibrary.activeCanvasId ? " active" : "";
    const marker = canvas.id === canvasLibrary.activeCanvasId ? "<mark>当前</mark>" : "";
    const count = Array.isArray(canvas.cards) ? canvas.cards.length : 0;
    const updated = canvas.updatedAt ? new Date(canvas.updatedAt).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "未保存";
    return `<button type="button" class="canvas-library-item${activeClass}" data-canvas-id="${escapeAttr(canvas.id)}"><strong>${escapeHtml(canvas.name)}</strong>${marker}<small>${count} 个节点 · ${escapeHtml(updated)}</small></button>`;
  }).join("");
  els.deleteCanvas.disabled = false;
}

function closeCanvasLibrary() {
  els.canvasLibraryMenu?.classList.add("hidden");
  els.openCanvasLibrary?.setAttribute("aria-expanded", "false");
}

function switchCanvas(id) {
  const target = canvasLibrary.canvases.find(canvas => canvas.id === id);
  if (!target || target.id === canvasLibrary.activeCanvasId) {
    closeCanvasLibrary();
    return;
  }
  flushLocalSave();
  canvasLibrary.activeCanvasId = target.id;
  applyCanvasRecord(target);
  closeCanvasLibrary();
  hideContextMenu();
  hideConnectionCreateMenu();
  els.nodePalette.classList.add("hidden");
  if (state.workspaceMode === "commerce") renderCommerceWorkspace();
  else if (state.workspaceMode === "product-video") renderProductVideoWorkspace();
  else render();
  save();
}

function createNewCanvas() {
  flushLocalSave();
  const canvas = createCanvasRecord(`新画布 ${canvasLibrary.canvases.length + 1}`, { id: uid("canvas") });
  canvasLibrary.canvases.push(canvas);
  canvasLibrary.activeCanvasId = canvas.id;
  applyCanvasRecord(canvas);
  closeCanvasLibrary();
  render();
  save();
}

function renameActiveCanvas() {
  const active = activeCanvasRecord();
  if (!active) return;
  const name = window.prompt("输入画布名称", active.name);
  if (name === null) return;
  const nextName = name.trim().slice(0, 40);
  if (!nextName) return;
  active.name = nextName;
  active.updatedAt = Date.now();
  save();
}

function deleteActiveCanvas() {
  const active = activeCanvasRecord();
  if (!active || !window.confirm(`删除“${active.name}”？此操作不可撤销。`)) return;
  flushLocalSave();
  const index = canvasLibrary.canvases.findIndex(canvas => canvas.id === active.id);
  canvasLibrary.canvases.splice(index, 1);
  if (!canvasLibrary.canvases.length) {
    const blank = createCanvasRecord("未命名画布", { id: uid("canvas") });
    canvasLibrary.canvases.push(blank);
    canvasLibrary.activeCanvasId = blank.id;
    applyCanvasRecord(blank);
  } else {
    const next = canvasLibrary.canvases[Math.max(0, index - 1)];
    canvasLibrary.activeCanvasId = next.id;
    applyCanvasRecord(next);
  }
  closeCanvasLibrary();
  render();
  save();
}

function load() {
  try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); } catch {}
  settings.pollInterval = normalizePollInterval(settings.pollInterval);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("local-ai-canvas-state-v1") || "{}");
    if (Array.isArray(saved.canvases)) {
      canvasLibrary = {
        schema: CANVAS_LIBRARY_SCHEMA,
        activeCanvasId: String(saved.activeCanvasId || saved.canvases[0]?.id || "canvas_default"),
        canvases: saved.canvases.map(canvas => createCanvasRecord(canvas.name, canvas))
      };
    } else {
      const legacy = createCanvasRecord("未命名画布", { id: "canvas_default", ...saved });
      canvasLibrary = { schema: CANVAS_LIBRARY_SCHEMA, activeCanvasId: legacy.id, canvases: [legacy] };
    }
    if (!canvasLibrary.canvases.length) {
      const blank = createCanvasRecord("未命名画布", { id: "canvas_default" });
      canvasLibrary = { schema: CANVAS_LIBRARY_SCHEMA, activeCanvasId: blank.id, canvases: [blank] };
    }
    if (!canvasLibrary.canvases.some(canvas => canvas.id === canvasLibrary.activeCanvasId)) canvasLibrary.activeCanvasId = canvasLibrary.canvases[0].id;
    applyCanvasRecord(activeCanvasRecord());
  } catch {}
  if (!canvasLibrary.canvases.length) {
    const blank = createCanvasRecord("未命名画布", { id: "canvas_default" });
    canvasLibrary = { schema: CANVAS_LIBRARY_SCHEMA, activeCanvasId: blank.id, canvases: [blank] };
    applyCanvasRecord(blank);
  }
  migrateLegacyCommerceNodes();
  state.cards.forEach(card => normalizeCard(card));
  state.edges = state.edges.filter(edge => findCard(edge.from) && findCard(edge.to) && edge.from !== edge.to);
  state.groups = state.groups.map(normalizeCanvasGroup).filter(group => group.memberIds.length);
  lastCanvasSnapshot = canvasSnapshot();
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

function pushHistorySnapshot(snapshot) {
  state.historyPast.push(cloneData(snapshot));
  state.historyPast = state.historyPast.slice(-50);
  state.historyFuture = [];
}

function beginHistoryTransaction(label) {
  if (state.historyTransaction) {
    if (state.historyTransaction.label === label) return true;
    commitHistoryTransaction();
  }
  const snapshot = canvasSnapshot();
  state.historyTransaction = { label, snapshot, key: snapshotKey(snapshot) };
  return true;
}

function commitHistoryTransaction() {
  const transaction = state.historyTransaction;
  if (!transaction) return false;
  state.historyTransaction = null;
  const nextSnapshot = canvasSnapshot();
  if (snapshotKey(nextSnapshot) === transaction.key) {
    lastCanvasSnapshot = nextSnapshot;
    return false;
  }
  if (!state.historyRestoring) pushHistorySnapshot(transaction.snapshot);
  lastCanvasSnapshot = nextSnapshot;
  renderHistoryMenu();
  return true;
}

function cancelHistoryTransaction() {
  state.historyTransaction = null;
}

function commitLocalState(payload) {
  if (!payload) return;
  if (payload.activeCanvasId === canvasLibrary.activeCanvasId) {
    const nextSnapshot = cloneData(payload.snapshot);
    if (!state.historyRestoring && lastCanvasSnapshot && snapshotKey(nextSnapshot) !== snapshotKey(lastCanvasSnapshot)) pushHistorySnapshot(lastCanvasSnapshot);
    lastCanvasSnapshot = nextSnapshot;
  }
  if (persistCanvasLibrary(payload) && !pendingSettingsPayload) els.saveState.textContent = `已保存 ${new Date().toLocaleTimeString()}`;
  renderHistoryMenu();
}

function commitScheduledLocalSave(marker) {
  if (performanceFixtureMode()) return;
  const canvasId = marker?.canvasId || canvasLibrary.activeCanvasId;
  if (state.historyTransaction && state.historyTransaction.label !== "wheel") {
    debouncedLocalSave({ canvasId });
    return;
  }
  if (state.historyTransaction?.label === "wheel") commitHistoryTransaction();
  commitLocalState(captureLocalSavePayload(canvasId));
}

function scheduleLocalSave(canvasId = canvasLibrary.activeCanvasId) {
  if (performanceFixtureMode()) return;
  debouncedLocalSave({ canvasId });
}

function flushLocalSave() {
  if (performanceFixtureMode()) {
    debouncedLocalSave.cancel();
    return;
  }
  if (state.historyTransaction) commitHistoryTransaction();
  debouncedLocalSave.cancel();
  commitLocalState(captureLocalSavePayload(canvasLibrary.activeCanvasId));
  retryPendingSettings();
}

function save() {
  flushLocalSave();
}

function retryPendingSettings() {
  if (!pendingSettingsPayload) return true;
  try {
    localStorage.setItem(SETTINGS_KEY, pendingSettingsPayload);
    pendingSettingsPayload = null;
    clearPersistenceError();
    return true;
  } catch (error) {
    showPersistenceError(error);
    return false;
  }
}

function persistSettings() {
  pendingSettingsPayload = JSON.stringify(settings);
  return retryPendingSettings();
}

function normalizeCanvasState() {
  state.cards.forEach(card => normalizeCard(card));
  state.edges = state.edges.filter(edge => findCard(edge.from) && findCard(edge.to) && edge.from !== edge.to);
  state.edges = normalizeCanvasEdges(state.edges);
  state.groups = state.groups.map(normalizeCanvasGroup).filter(group => group.memberIds.length);
}

function restoreCanvasState(snapshot) {
  state.cards = cloneData(snapshot?.cards || []);
  state.edges = cloneData(snapshot?.edges || []);
  state.groups = cloneData(snapshot?.groups || []);
  if (snapshot?.viewport) state.viewport = cloneData(snapshot.viewport);
  normalizeCanvasState();
  setSelected([]);
}

function settleHistoryInteractionForRestore() {
  if (interactionController.value.mode !== "idle") cancelCanvasInteraction();
  flushLocalSave();
}

function undoCanvas() {
  settleHistoryInteractionForRestore();
  if (!state.historyPast.length) return;
  state.historyFuture.unshift(canvasSnapshot());
  state.historyRestoring = true;
  try {
    restoreCanvasState(state.historyPast.pop());
    render();
    save();
  } finally {
    state.historyRestoring = false;
  }
}

function redoCanvas() {
  settleHistoryInteractionForRestore();
  if (!state.historyFuture.length) return;
  state.historyPast.push(canvasSnapshot());
  state.historyRestoring = true;
  try {
    restoreCanvasState(state.historyFuture.shift());
    render();
    save();
  } finally {
    state.historyRestoring = false;
  }
}

function createCanvasSnapshot() {
  state.canvasSnapshots.unshift({
    id: uid("snapshot"),
    name: `快照 ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
    state: canvasSnapshot()
  });
  state.canvasSnapshots = state.canvasSnapshots.slice(0, 12);
  renderHistoryMenu();
  save();
}

function restoreNamedCanvasSnapshot(id) {
  settleHistoryInteractionForRestore();
  const snapshot = state.canvasSnapshots.find(item => item.id === id);
  if (!snapshot) return;
  state.historyRestoring = true;
  try {
    restoreCanvasState(snapshot.state);
    render();
    save();
  } finally {
    state.historyRestoring = false;
  }
}

function renderHistoryMenu() {
  if (!els.canvasSnapshotList) return;
  els.canvasSnapshotList.innerHTML = state.canvasSnapshots.map(snapshot => `<button type="button" data-snapshot-id="${escapeAttr(snapshot.id)}"><span>${escapeHtml(snapshot.name)}</span><small>恢复</small></button>`).join("");
  const undo = document.getElementById("undoCanvas");
  const redo = document.getElementById("redoCanvas");
  if (undo) undo.disabled = !state.historyPast.length;
  if (redo) redo.disabled = !state.historyFuture.length;
}

function normalizeCommerceRef(ref) {
  if (!ref || typeof ref !== "object" || !String(ref.url || "").trim() || !String(ref.mime || "").startsWith("image/")) return null;
  return { url: String(ref.url), name: String(ref.name || "图片"), mime: String(ref.mime) };
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
    results: Array.isArray(workspace.results) ? workspace.results.filter(result => result?.url).map(result => ({
      id: String(result.id || uid("commerce-result")),
      url: String(result.url),
      mime: String(result.mime || "image/png"),
      prompt: String(result.prompt || ""),
      createdAt: Number(result.createdAt || Date.now()),
      status: "done"
    })) : []
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
  persistSettings();
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

function commerceImagePrompt(prompt) {
  return [String(prompt || "").trim(), COMMERCE_IMAGE_GUARDRAILS].filter(Boolean).join("\n");
}

function agnesImageRequest(card, apiKey, prompt, imageRefs = [], imageRoles = []) {
  const model = card.model || settings.imageModel;
  const request = {
    apiKey,
    model,
    prompt: card.type === "commerce" ? commerceImagePrompt(prompt) : prompt,
    quality: card.imageQuality || "medium",
    responseFormat: settings.imageResponseFormat,
    imageRefs,
    imageRoles,
    workflow: card.type || undefined
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
  state.selectedEdgeId = null;
}

function selectSingle(id) {
  setSelected(id ? [id] : []);
}

function toggleSelected(id) {
  const ids = selectedIds();
  setSelected(ids.includes(id) ? ids.filter(selectedId => selectedId !== id) : [...ids, id]);
}

function selectEdge(id) {
  const normalizedId = String(id ?? "");
  const edge = state.edges.find(item => item.id === normalizedId);
  if (!edge) return;
  setSelected([]);
  state.selectedEdgeId = edge.id;
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

const interactionFrame = CanvasEngine.createFrameScheduler(flushInteractionFrame);

function scheduleInteractionFrame(flags) {
  Object.assign(pendingInteractionFlags, flags);
  interactionFrame(pendingInteractionFlags);
}

function flushInteractionFrame(flags) {
  const dirty = flags || pendingInteractionFlags;
  pendingInteractionFlags = {};
  if (dirty.viewport) updateViewportGeometry();
  if (dirty.cards) updateCardTransforms();
  if (dirty.edges) updateEdgeGeometry();
  if (dirty.selection) {
    updateSelectionGeometry();
    syncInteractionInspector();
  }
  if (dirty.guides) renderAlignmentGuides(state.alignmentGuides);
  if (dirty.dock) {
    const card = selectedCard();
    if (card) positionNodeDock(card);
  }
  if (dirty.minimap) renderMinimap();
}

function cacheCardNodes() {
  cardNodes.clear();
  els.stage.querySelectorAll(".card[data-id]").forEach(node => {
    cardNodes.set(node.dataset.id, node);
  });
}

function cacheEdgeNodes() {
  edgeNodes.clear();
  edgeHitNodes.clear();
  els.stage.querySelectorAll(".connection-path[data-edge-id]").forEach(node => {
    edgeNodes.set(node.dataset.edgeId, node);
  });
  els.stage.querySelectorAll(".connection-hit[data-edge-id]").forEach(node => {
    edgeHitNodes.set(node.dataset.edgeId, node);
  });
}

function updateCardTransforms() {
  state.cards.forEach(card => {
    const node = cardNodes.get(card.id);
    if (node) node.style.transform = `translate3d(${card.x}px, ${card.y}px, 0)`;
  });
}

function updateEdgeGeometry() {
  const svg = els.stage.querySelector(".connection-svg");
  if (!svg) return;
  const cardsById = new Map(state.cards.map(card => [card.id, card]));
  const edgeIds = new Set(state.edges.map(edge => edge.id));
  edgeNodes.forEach((node, id) => {
    if (!edgeIds.has(id)) {
      node.remove();
      edgeNodes.delete(id);
      edgeHitNodes.get(id)?.remove();
      edgeHitNodes.delete(id);
    }
  });
  state.edges.forEach(edge => {
    const from = cardsById.get(edge.from);
    const to = cardsById.get(edge.to);
    if (!from || !to) return;
    let node = edgeNodes.get(edge.id);
    let hitNode = edgeHitNodes.get(edge.id);
    if (!hitNode) {
      hitNode = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hitNode.classList.add("connection-hit");
      hitNode.dataset.edgeId = edge.id;
      hitNode.setAttribute("tabindex", "0");
      hitNode.setAttribute("role", "button");
      svg.append(hitNode);
      edgeHitNodes.set(edge.id, hitNode);
    }
    if (!node) {
      node = document.createElementNS("http://www.w3.org/2000/svg", "path");
      node.classList.add("connection-path");
      node.dataset.edgeId = edge.id;
      node.setAttribute("aria-hidden", "true");
      svg.append(node);
      edgeNodes.set(edge.id, node);
    }
    const path = edgePath(portPoint(from, "out"), portPoint(to, "in"));
    hitNode.setAttribute("d", path);
    hitNode.setAttribute("aria-label", `连接：${from.title} 到 ${to.title}`);
    hitNode.setAttribute("aria-pressed", String(state.selectedEdgeId === edge.id));
    node.setAttribute("d", path);
    node.classList.toggle("selected", state.selectedEdgeId === edge.id);
  });
  let draft = svg.querySelector("path[data-connection-draft]");
  if (!state.connecting) {
    if (draft) draft.remove();
    return;
  }
  if (!draft) {
    draft = document.createElementNS("http://www.w3.org/2000/svg", "path");
    draft.classList.add("connection-path", "dim");
    draft.dataset.connectionDraft = "true";
    svg.append(draft);
  }
  const from = cardsById.get(state.connecting.from);
  if (!from) {
    draft.remove();
    return;
  }
  draft.setAttribute("d", edgePath(portPoint(from, "out"), state.connecting.to));
}

function updateSelectionGeometry() {
  const rect = normalizedSelectionRect(state.selectionBox);
  if (rect) setSelected(lassoSelectionIds(state.selectionBox, rect));
  let node = els.stage.querySelector(".selection-box");
  if (!rect) {
    if (node) node.remove();
  } else {
    if (!node) {
      node = document.createElement("div");
      node.className = "selection-box";
      els.stage.append(node);
    }
    node.style.left = `${rect.left}px`;
    node.style.top = `${rect.top}px`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
  }
  const selectedIdSet = new Set(state.selectedIds);
  cardNodes.forEach((cardNode, id) => {
    cardNode.classList.toggle("selected", selectedIdSet.has(id));
  });
  edgeNodes.forEach((edgeNode, id) => {
    edgeNode.classList.toggle("selected", state.selectedEdgeId === id);
    edgeHitNodes.get(id)?.setAttribute("aria-pressed", String(state.selectedEdgeId === id));
  });
  const cardsById = new Map(state.cards.map(card => [card.id, card]));
  const groupById = new Map(state.groups.map(group => [group.id, group]));
  els.stage.querySelectorAll(".canvas-group[data-group-id]").forEach(groupNode => {
    const bounds = groupBounds(groupById.get(groupNode.dataset.groupId), cardsById);
    if (!bounds) return;
    groupNode.style.left = `${bounds.x}px`;
    groupNode.style.top = `${bounds.y}px`;
    groupNode.style.width = `${bounds.w}px`;
    groupNode.style.height = `${bounds.h}px`;
  });
}

function renderAlignmentGuides(guides) {
  els.alignmentGuides.replaceChildren();
  (guides || []).forEach(guide => {
    const line = document.createElement("div");
    line.className = `alignment-guide ${guide.axis === "x" ? "vertical" : "horizontal"}`;
    if (guide.axis === "x") line.style.left = `${guide.position}px`;
    else line.style.top = `${guide.position}px`;
    els.alignmentGuides.append(line);
  });
}

function updateViewportGeometry() {
  applyViewport();
}

function syncInteractionInspector() {
  const selectedId = state.selectedId || null;
  if (selectedId === renderedInspectorSelectionId) return;
  renderInspector();
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

function lassoSelectionIds(box, rect) {
  const hitIds = selectionHitCards(rect).map(card => card.id);
  if (!box?.shiftKey) return hitIds;
  const selected = new Set(box.selectionBefore || []);
  hitIds.forEach(id => {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  });
  return [...selected];
}

function renderSelectionBox() {
  const rect = normalizedSelectionRect(state.selectionBox);
  if (!rect) return "";
  return `<div class="selection-box" style="left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px"></div>`;
}

function groupBounds(group, cardsById) {
  const cards = (group?.memberIds || []).map(id => cardsById ? cardsById.get(id) : findCard(id)).filter(Boolean);
  if (!cards.length) return null;
  const padding = 24;
  const left = Math.min(...cards.map(card => card.x)) - padding;
  const top = Math.min(...cards.map(card => card.y)) - padding - 24;
  const right = Math.max(...cards.map(card => card.x + card.w)) + padding;
  const bottom = Math.max(...cards.map(card => card.y + (card.layoutH ?? card.h))) + padding;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function renderCanvasGroups() {
  return state.groups.map(group => {
    const bounds = groupBounds(group);
    if (!bounds) return "";
    return `<section class="canvas-group" data-group-id="${escapeAttr(group.id)}" style="left:${bounds.x}px;top:${bounds.y}px;width:${bounds.w}px;height:${bounds.h}px;border-color:${escapeAttr(group.color)}66;background:${escapeAttr(group.color)}0b">
      <div class="canvas-group-title"><input type="text" value="${escapeAttr(group.name)}" data-group-title="${escapeAttr(group.id)}" aria-label="分组名称"><button type="button" data-group-action="ungroup" data-group-id="${escapeAttr(group.id)}" title="取消分组">×</button></div>
      <span class="canvas-group-label">GROUP</span>
    </section>`;
  }).join("");
}

function groupSelectedCards() {
  const ids = selectedIds();
  if (!ids.length) return;
  state.groups = state.groups.filter(group => !group.memberIds.some(id => ids.includes(id)));
  state.groups.push({ id: uid("group"), name: `分组 ${state.groups.length + 1}`, memberIds: ids, color: "#e7ff25", createdAt: Date.now() });
  render();
  save();
}

function ungroupById(id) {
  const before = state.groups.length;
  state.groups = state.groups.filter(group => group.id !== id);
  if (state.groups.length !== before) {
    render();
    save();
  }
}

function ungroupSelection() {
  const ids = new Set(selectedIds());
  const before = state.groups.length;
  state.groups = state.groups.filter(group => !group.memberIds.some(id => ids.has(id)));
  if (state.groups.length !== before) {
    render();
    save();
  }
}

function autoLayoutCards(mode = "selected") {
  const selected = new Set(selectedIds());
  const cards = mode === "all" ? state.cards : state.cards.filter(card => selected.has(card.id));
  if (!cards.length) return;
  const ids = new Set(cards.map(card => card.id));
  const indegree = new Map(cards.map(card => [card.id, 0]));
  const outgoing = new Map(cards.map(card => [card.id, []]));
  state.edges.forEach(edge => {
    if (!ids.has(edge.from) || !ids.has(edge.to)) return;
    indegree.set(edge.to, indegree.get(edge.to) + 1);
    outgoing.get(edge.from).push(edge.to);
  });
  const levels = new Map();
  const queue = cards.filter(card => indegree.get(card.id) === 0).map(card => card.id);
  queue.forEach(id => levels.set(id, 0));
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const from = queue[cursor];
    outgoing.get(from).forEach(to => {
      levels.set(to, Math.max(levels.get(to) || 0, (levels.get(from) || 0) + 1));
      indegree.set(to, indegree.get(to) - 1);
      if (indegree.get(to) === 0) queue.push(to);
    });
  }
  cards.forEach(card => { if (!levels.has(card.id)) levels.set(card.id, 0); });
  const columns = new Map();
  cards.forEach(card => {
    const level = levels.get(card.id) || 0;
    if (!columns.has(level)) columns.set(level, []);
    columns.get(level).push(card);
  });
  const minX = Math.min(...cards.map(card => card.x));
  const minY = Math.min(...cards.map(card => card.y));
  [...columns.keys()].sort((a, b) => a - b).forEach(level => {
    let y = minY;
    columns.get(level).sort((a, b) => a.y - b.y).forEach(card => {
      card.x = Math.round(minX + level * 420);
      card.y = Math.round(y);
      y += Math.max(card.h, 220) + 70;
    });
  });
  render();
  save();
}

function focusCard(id) {
  const card = findCard(id);
  if (!card) return;
  selectSingle(id);
  const rect = els.viewport.getBoundingClientRect();
  state.viewport.x = Math.round(rect.width / 2 - (card.x + card.w / 2) * state.viewport.scale);
  state.viewport.y = Math.round(rect.height / 2 - (card.y + card.h / 2) * state.viewport.scale);
  render();
}

function searchCards(query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return [];
  return state.cards.filter(card => [card.title, card.prompt, card.type, card.resultUrl ? "资产" : ""].join(" ").toLowerCase().includes(value)).slice(0, 12);
}

function renderSearchResults(query) {
  const results = searchCards(query);
  if (!els.canvasSearchResults) return;
  if (!String(query || "").trim()) {
    els.canvasSearchResults.classList.add("hidden");
    els.canvasSearchResults.innerHTML = "";
    return;
  }
  els.canvasSearchResults.classList.remove("hidden");
  els.canvasSearchResults.innerHTML = results.length
    ? results.map(card => `<button type="button" data-search-card-id="${escapeAttr(card.id)}"><strong>${escapeHtml(card.title)}</strong><span>${escapeHtml(card.type)}${card.resultUrl ? " · 资产" : ""}</span></button>`).join("")
    : `<div class="canvas-layer-empty">没有找到匹配节点</div>`;
}

function renderMinimap() {
  const canvas = document.getElementById("minimapCanvas");
  if (!canvas) return;
  const canvasRect = canvas.getBoundingClientRect();
  const pixelRatio = Math.max(1, Number(window.devicePixelRatio || 1));
  const width = Math.max(1, canvasRect.width);
  const height = Math.max(1, canvasRect.height);
  const backingWidth = Math.round(width * pixelRatio);
  const backingHeight = Math.round(height * pixelRatio);
  if (canvas.width !== backingWidth) canvas.width = Math.round(width * pixelRatio);
  if (canvas.height !== backingHeight) canvas.height = Math.round(height * pixelRatio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#111512";
  ctx.fillRect(0, 0, width, height);
  const cardsById = new Map(state.cards.map(card => [card.id, card]));
  const selectedIdSet = new Set(state.selectedIds);
  const cardHeight = card => card.layoutH ?? card.h;
  const viewportRect = els.viewport.getBoundingClientRect();
  const worldLeft = -state.viewport.x / state.viewport.scale;
  const worldTop = -state.viewport.y / state.viewport.scale;
  const worldWidth = viewportRect.width / state.viewport.scale;
  const worldHeight = viewportRect.height / state.viewport.scale;
  const activeMapBounds = state.minimapPan?.mapBounds;
  const minX = activeMapBounds?.minX ?? Math.min(...state.cards.map(card => card.x), worldLeft, -120);
  const minY = activeMapBounds?.minY ?? Math.min(...state.cards.map(card => card.y), worldTop, -80);
  const maxX = activeMapBounds?.maxX ?? Math.max(...state.cards.map(card => card.x + card.w), worldLeft + worldWidth, 420);
  const maxY = activeMapBounds?.maxY ?? Math.max(...state.cards.map(card => card.y + cardHeight(card)), worldTop + worldHeight, 320);
  const scale = activeMapBounds?.scale ?? Math.min((width - 20) / (maxX - minX), (height - 20) / (maxY - minY));
  const mapX = value => 10 + (value - minX) * scale;
  const mapY = value => 10 + (value - minY) * scale;
  ctx.strokeStyle = "rgba(0,209,167,.35)";
  ctx.lineWidth = 1;
  state.edges.forEach(edge => {
    const from = cardsById.get(edge.from);
    const to = cardsById.get(edge.to);
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(mapX(from.x + from.w), mapY(from.y + cardHeight(from) / 2));
    ctx.lineTo(mapX(to.x), mapY(to.y + cardHeight(to) / 2));
    ctx.stroke();
  });
  state.cards.forEach(card => {
    ctx.fillStyle = selectedIdSet.has(card.id) ? "#e7ff25" : card.resultUrl ? "#7bff9c" : "#858c84";
    ctx.fillRect(mapX(card.x), mapY(card.y), Math.max(4, card.w * scale), Math.max(4, cardHeight(card) * scale));
  });
  const viewportCanvasRect = {
    left: mapX(worldLeft),
    top: mapY(worldTop),
    width: worldWidth * scale,
    height: worldHeight * scale
  };
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(viewportCanvasRect.left, viewportCanvasRect.top, viewportCanvasRect.width, viewportCanvasRect.height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(viewportCanvasRect.left, viewportCanvasRect.top, viewportCanvasRect.width, viewportCanvasRect.height);
  canvas.__mapBounds = { minX, minY, maxX, maxY, scale, padding: 10, width, height, viewportCanvasRect };
}

function minimapClientToWorld(clientX, clientY) {
  const canvas = document.getElementById("minimapCanvas");
  const bounds = state.minimapPan?.mapBounds || canvas?.__mapBounds;
  if (!canvas || !bounds) return null;
  const rect = canvas.getBoundingClientRect();
  const canvasX = (clientX - rect.left) * bounds.width / rect.width;
  const canvasY = (clientY - rect.top) * bounds.height / rect.height;
  return {
    x: bounds.minX + (canvasX - bounds.padding) / bounds.scale,
    y: bounds.minY + (canvasY - bounds.padding) / bounds.scale
  };
}

function minimapPointToViewport(clientX, clientY) {
  const world = minimapClientToWorld(clientX, clientY);
  if (!world) return null;
  const viewportRect = els.viewport.getBoundingClientRect();
  return {
    x: Math.round(viewportRect.width / 2 - world.x * state.viewport.scale),
    y: Math.round(viewportRect.height / 2 - world.y * state.viewport.scale)
  };
}

function beginMinimapPan(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const canvas = document.getElementById("minimapCanvas");
  const bounds = canvas?.__mapBounds;
  const nextViewport = minimapPointToViewport(event.clientX, event.clientY);
  if (!canvas || !bounds || !nextViewport) return;
  if (!interactionController.begin("minimap-panning", { pointerId: event.pointerId })) return;
  beginHistoryTransaction("minimap");
  const rect = canvas.getBoundingClientRect();
  const canvasX = (event.clientX - rect.left) * bounds.width / rect.width;
  const canvasY = (event.clientY - rect.top) * bounds.height / rect.height;
  const view = bounds.viewportCanvasRect;
  const grabbedViewport = canvasX >= view.left && canvasX <= view.left + view.width && canvasY >= view.top && canvasY <= view.top + view.height;
  const point = minimapClientToWorld(event.clientX, event.clientY);
  const center = viewportCenter();
  state.minimapPan = {
    pointerId: event.pointerId,
    offsetX: grabbedViewport ? center.x - point.x : 0,
    offsetY: grabbedViewport ? center.y - point.y : 0,
    viewX: state.viewport.x,
    viewY: state.viewport.y,
    mapBounds: { ...bounds, viewportCanvasRect: { ...bounds.viewportCanvasRect } }
  };
  canvas.classList.add("is-navigating");
  canvas.setPointerCapture(event.pointerId);
  updateMinimapPan(event);
}

function updateMinimapPan(event) {
  const pan = state.minimapPan;
  if (!pan || event.pointerId !== pan.pointerId) return;
  const nextViewport = minimapPointToViewport(event.clientX, event.clientY);
  if (!nextViewport) return;
  state.viewport.x = Math.round(nextViewport.x - pan.offsetX * state.viewport.scale);
  state.viewport.y = Math.round(nextViewport.y - pan.offsetY * state.viewport.scale);
  scheduleInteractionFrame({ viewport: true, dock: true, minimap: true });
}

function endMinimapPan(event) {
  const pan = state.minimapPan;
  if (!pan || event.pointerId !== pan.pointerId) return;
  const canvas = document.getElementById("minimapCanvas");
  updateMinimapPan(event);
  state.minimapPan = null;
  interactionController.end(event.pointerId);
  canvas?.classList.remove("is-navigating");
  if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (commitHistoryTransaction()) scheduleLocalSave();
}

function handleMinimapKeydown(event) {
  const directions = {
    ArrowLeft: { x: 1, y: 0 },
    ArrowRight: { x: -1, y: 0 },
    ArrowUp: { x: 0, y: 1 },
    ArrowDown: { x: 0, y: -1 }
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  event.stopPropagation();
  const step = event.shiftKey ? 160 : 40;
  state.viewport.x += direction.x * step;
  state.viewport.y += direction.y * step;
  scheduleInteractionFrame({ viewport: true, dock: true, minimap: true });
  save();
}

function createCardRecord(type, options = {}, targetState = state) {
  const def = NODE_DEFS[type] || NODE_DEFS.text;
  const center = targetState === state ? viewportCenter() : { x: 0, y: 0 };
  const defaultX = center.x - def.w / 2 + targetState.cards.length * 18;
  const defaultY = center.y - def.h / 2 + targetState.cards.length * 18;
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
  targetState.cards.push(card);
  return card;
}

function createCard(type, options = {}) {
  const card = createCardRecord(type, options, state);
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

function resultSiblings(source, targetState = state) {
  return targetState.edges
    .filter(edge => edge.from === source.id)
    .map(edge => targetState.cards.find(card => card.id === edge.to))
    .filter(card => card && card.type === "upload" && card.resultUrl);
}

function resultPosition(source, resultType, w, h, targetState = state) {
  const siblings = resultSiblings(source, targetState);
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
    const blocked = targetState.cards.some(card => card.id !== source.id && rectsOverlap(candidate, card));
    if (!blocked) return candidate;
  }
  return {
    x: source.x + source.w + 70,
    y: source.y + (startSlot + 1) * (h + gapY),
    w,
    h
  };
}

function duplicateResultCard(source, resultType, resultUrl, mime, canvasId = canvasLibrary.activeCanvasId) {
  const targetState = canvasStateFor(canvasId);
  const targetSource = targetState?.cards?.find(card => card.id === source.id);
  if (!targetState || !targetSource) return null;
  const w = resultType === "video" ? 340 : 310;
  const h = resultType === "video" ? 260 : 240;
  const position = resultPosition(targetSource, resultType, w, h, targetState);
  const index = resultSiblings(targetSource, targetState).length + 1;
  const card = {
    ...targetSource,
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
    prompt: targetSource.prompt,
    refs: [],
    task: null,
    error: ""
  };
  targetState.cards.push(card);
  targetState.edges.push({ id: uid("edge"), from: targetSource.id, to: card.id });
  return card;
}

function commerceResultPosition(source, w, h, targetState = state) {
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
    if (!targetState.cards.some(card => rectsOverlap(candidate, card))) return candidate;
  }
  return { x: start.x, y: start.y + targetState.cards.length * 24, w, h };
}

function createCommerceResultCard(source, resultUrl, prompt, mime = "image/png", canvasId = canvasLibrary.activeCanvasId) {
  return mutateCanvasById(canvasId, targetState => {
    const targetSource = targetState.cards.find(card => card.id === source.id);
    if (!targetSource) return null;
    const w = 310;
    const h = 240;
    const position = commerceResultPosition(targetSource, w, h, targetState);
    const index = targetSource.commerceResultIds.length + 1;
    const card = createCardRecord("upload", {
      x: position.x,
      y: position.y,
      title: `电商宣传图 ${index}`,
      resultUrl,
      mime
    }, targetState);
    Object.assign(card, {
      w,
      h,
      status: "done",
      progress: 100,
      prompt,
      error: "",
      sourceWorkflow: "commerce"
    });
    targetSource.commerceResultIds.push(card.id);
    if (canvasId === canvasLibrary.activeCanvasId) selectSingle(targetSource.id);
    return card;
  });
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
  els.commerceAssetGrid.innerHTML = workspace.results.length
    ? workspace.results.map(result => `
      <article class="commerce-asset-card" data-commerce-result-id="${escapeAttr(result.id)}">
        <div class="commerce-asset-media"><img src="${escapeAttr(result.url)}" alt="电商宣传图" draggable="false">
          <div class="commerce-asset-overlay"><button type="button" data-commerce-preview-action="add" data-commerce-result-id="${escapeAttr(result.id)}">加入画布</button><button type="button" data-commerce-preview-action="download" data-commerce-result-id="${escapeAttr(result.id)}">下载本地</button></div>
          <div class="commerce-asset-large"><img src="${escapeAttr(result.url)}" alt="电商宣传图大图" draggable="false"></div>
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

function storeProductVideoResult(url, prompt, canvasId = canvasLibrary.activeCanvasId) {
  return mutateCanvasById(canvasId, targetState => {
    const workspace = targetState.productVideoWorkspace;
    workspace.results.unshift({ id: uid("product-video-result"), url, mime: "video/mp4", prompt, createdAt: Date.now(), status: "done" });
    workspace.status = "done";
    workspace.progress = 100;
    workspace.error = "";
    workspace.task = null;
  }, renderProductVideoWorkspace);
}

async function generateProductVideo() {
  const originCanvasId = canvasLibrary.activeCanvasId;
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
  const request = productVideoRequest(apiKey);
  const resultPrompt = request.prompt;
  try {
    const created = await postJson("/api/agnes/video", request);
    const response = created.response || {};
    const directUrl = response.url || response.video_url || response.result?.url;
    if (directUrl) {
      storeProductVideoResult(directUrl, resultPrompt, originCanvasId);
    } else {
      const task = { video_id: response.video_id, task_id: response.task_id || response.id };
      if (!task.video_id && !task.task_id) throw new Error("Agnes 视频 API 未返回任务 ID。 ");
      mutateCanvasById(originCanvasId, targetState => {
        targetState.productVideoWorkspace.task = task;
        targetState.productVideoWorkspace.progress = Number(response.progress || 12);
      }, renderProductVideoWorkspace);
      await pollProductVideo(apiKey, originCanvasId, resultPrompt);
    }
  } catch (error) {
    mutateCanvasById(originCanvasId, targetState => {
      targetState.productVideoWorkspace.status = "error";
      targetState.productVideoWorkspace.error = error.message || "产品视频生成失败。";
      targetState.productVideoWorkspace.task = null;
    }, renderProductVideoWorkspace);
  }
}

async function pollProductVideo(apiKey, originCanvasId = canvasLibrary.activeCanvasId, resultPrompt = "") {
  const maxAttempts = 120;
  let delay = normalizePollInterval(settings.pollInterval);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const workspace = canvasStateFor(originCanvasId)?.productVideoWorkspace;
    if (!workspace?.task) return;
    const task = cloneData(workspace.task);
    await sleep(delay);
    let data;
    try {
      data = await postJson("/api/agnes/video-result", { apiKey, model: settings.videoModel, video_id: task.video_id, task_id: task.task_id });
    } catch (error) {
      if (isRateLimitError(error)) {
        delay = Math.min(MAX_VIDEO_POLL_INTERVAL, Math.max(Math.round(delay * 1.8), 15000));
        mutateCanvasById(originCanvasId, targetState => {
          targetState.productVideoWorkspace.status = "running";
          targetState.productVideoWorkspace.error = rateLimitMessage(delay);
        }, renderProductVideoWorkspace);
        continue;
      }
      throw error;
    }
    delay = normalizePollInterval(settings.pollInterval);
    const result = data.response || {};
    const status = result.status || "running";
    if (status === "completed" && result.url) {
      storeProductVideoResult(result.url, resultPrompt, originCanvasId);
      return;
    }
    if (status === "failed") throw new Error(result.error ? JSON.stringify(result.error) : "Agnes 产品视频生成失败。");
    mutateCanvasById(originCanvasId, targetState => {
      targetState.productVideoWorkspace.status = status;
      targetState.productVideoWorkspace.progress = Number(result.progress ?? Math.min(95, 20 + attempt * 3));
      targetState.productVideoWorkspace.error = "";
    }, renderProductVideoWorkspace);
  }
  throw new Error("产品视频生成轮询超时。可稍后重试或查看 Agnes 控制台。");
}

function setWorkspaceMode(mode) {
  flushLocalSave();
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
    const path = edgePath(portPoint(from, "out"), portPoint(to, "in"));
    const selected = state.selectedEdgeId === edge.id ? " selected" : "";
    const label = escapeAttr(`连接：${from.title} 到 ${to.title}`);
    return `<path class="connection-hit" tabindex="0" role="button" aria-label="${label}" aria-pressed="${state.selectedEdgeId === edge.id}" data-edge-id="${escapeAttr(edge.id)}" d="${path}"></path><path class="connection-path${selected}" aria-hidden="true" data-edge-id="${escapeAttr(edge.id)}" d="${path}"></path>`;
  }).join("");
  const draft = state.connecting
    ? `<path class="connection-path dim" aria-hidden="true" data-connection-draft="true" d="${edgePath(portPoint(findCard(state.connecting.from), "out"), state.connecting.to)}"></path>`
    : "";
  return `<svg class="connection-svg" role="group" aria-label="节点连接">${paths}${draft}</svg>`;
}

function syncCardLayoutMetrics() {
  state.cards.forEach(card => {
    const node = cardNodes.get(card.id);
    if (node) card.layoutH = node.offsetHeight;
  });
}

function refreshLayoutGeometry() {
  syncCardLayoutMetrics();
  scheduleInteractionFrame({ edges: true, dock: true, minimap: true });
}

function render() {
  applyViewport();
  els.viewport.classList.toggle("hidden", state.workspaceMode !== "canvas");
  els.commerceWorkspace.classList.toggle("hidden", state.workspaceMode !== "commerce");
  els.emptyHint.classList.toggle("hidden", state.cards.length > 0);
  const cardsHtml = state.cards.map(card => {
    const connected = connectedIds(card).size > 0;
    return `
      <article class="card ${isCardSelected(card.id) ? "selected" : ""} ${connected ? "connected" : ""}" data-id="${card.id}" style="transform:translate3d(${card.x}px, ${card.y}px, 0);width:${card.w}px;min-height:${card.h}px">
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
  els.stage.innerHTML = `${renderSelectionBox()}${renderCanvasGroups()}${cardsHtml}`;
  els.stage.prepend(els.alignmentGuides);
  state.alignmentGuides = [];
  renderAlignmentGuides(state.alignmentGuides);
  cacheCardNodes();
  restoreConnectionFeedback();
  syncCardLayoutMetrics();
  els.stage.insertAdjacentHTML("afterbegin", renderEdges());
  cacheEdgeNodes();
  renderInspector();
  renderMinimap();
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

  const rawLeft = nodeCenterX - dockWidth / 2;
  const maxLeft = Math.max(margin, viewportRect.width - dockWidth - margin);
  const left = Math.min(Math.max(margin, rawLeft), maxLeft);
  const dockHeight = dockRect.height || 174;
  const otherCards = state.cards
    .filter(other => other.id !== card.id)
    .map(other => ({
      left: state.viewport.x + other.x * scale,
      top: state.viewport.y + other.y * scale,
      right: state.viewport.x + (other.x + other.w) * scale,
      bottom: state.viewport.y + (other.y + (other.layoutH ?? other.h)) * scale
    }));
  let top = nodeBottom + gap;
  for (let index = 0; index <= otherCards.length; index += 1) {
    const collision = otherCards.find(other => {
      const otherBottom = other.bottom;
      return left < other.right && left + dockWidth > other.left && top < otherBottom && top + dockHeight > other.top;
    });
    if (!collision) break;
    const otherBottom = collision.bottom;
    top = otherBottom + gap;
  }

  dock.style.left = `${Math.round(left)}px`;
  dock.style.top = `${Math.round(top)}px`;
}

function positionSizePopover() {
  const picker = els.sizePicker;
  const popover = els.sizePickerMenu;
  if (!picker || !popover || picker.classList.contains("hidden")) return;
  const viewportRect = els.viewport.getBoundingClientRect();
  const pickerRect = picker.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  if (!popoverRect.width || !popoverRect.height) return;

  const margin = 12;
  const gap = 6;
  const availableWidth = Math.max(0, viewportRect.width - popoverRect.width - margin * 2);
  const desiredLeft = pickerRect.left - viewportRect.left;
  const left = Math.min(Math.max(margin, desiredLeft), Math.max(margin, availableWidth + margin));
  const spaceAbove = pickerRect.top - viewportRect.top - margin;
  const opensAbove = spaceAbove >= popoverRect.height + gap || pickerRect.bottom - viewportRect.top > viewportRect.height / 2;
  const desiredTop = opensAbove
    ? pickerRect.top - viewportRect.top - popoverRect.height - gap
    : pickerRect.bottom - viewportRect.top + gap;
  const maxTop = Math.max(margin, viewportRect.height - popoverRect.height - margin);
  const top = Math.min(Math.max(margin, desiredTop), maxTop);
  popover.style.left = `${Math.round(left - (pickerRect.left - viewportRect.left))}px`;
  popover.style.top = `${Math.round(top - (pickerRect.top - viewportRect.top))}px`;
  popover.style.bottom = "auto";
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
  renderedInspectorSelectionId = card?.id || null;
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
    if (state.selectedId === card.id) {
      positionNodeDock(card);
      if (els.sizePicker.classList.contains("is-open")) positionSizePopover();
    }
  });
}

function taskText(card) {
  if (card.status === "queued") return "任务已创建，等待生成。";
  if (card.status === "running") return `生成中，进度 ${Number(card.progress || 0)}%。`;
  if (card.status === "done") return "生成完成，结果已写回画布。";
  return "";
}

function updateCardNode(card) {
  const node = cardNodes.get(card.id);
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
  if (options.deferSave) scheduleLocalSave();
  else save();
}

function setupSizePicker() {
  const openPopover = () => {
    els.sizePicker.classList.add("is-open");
    positionSizePopover();
    requestAnimationFrame(positionSizePopover);
  };
  const closePopover = () => {
    if (!els.sizePicker.matches(":focus-within")) els.sizePicker.classList.remove("is-open");
  };
  els.sizePicker.addEventListener("pointerenter", openPopover);
  els.sizePicker.addEventListener("focusin", openPopover);
  els.sizePickerButton.addEventListener("click", openPopover);
  els.sizePicker.addEventListener("pointerleave", closePopover);
  els.sizePicker.addEventListener("focusout", () => requestAnimationFrame(closePopover));
  els.sizePickerMenu.addEventListener("click", event => {
    const button = event.target.closest("button[data-size-action]");
    const card = selectedCard();
    if (!button || !card) return;
    const patch = applySizePickerAction(card, button.dataset.sizeAction, button.dataset.value);
    updateSelected(patch, { render: false });
    renderInspector();
    requestAnimationFrame(positionSizePopover);
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
    scheduleLocalSave();
  });
  [els.commerceWorkspaceAspect, els.commerceWorkspaceQuality, els.commerceWorkspaceResolution].forEach(input => {
    input.addEventListener("change", event => {
      state.commerceWorkspace[{ commerceWorkspaceAspect: "aspect", commerceWorkspaceQuality: "quality", commerceWorkspaceResolution: "resolution" }[event.target.id]] = event.target.value;
      scheduleLocalSave();
    });
  });
  els.commerceWorkspacePromptButton.addEventListener("click", generateCommerceWorkspacePrompt);
  els.commerceWorkspaceGenerate.addEventListener("click", generateCommerceWorkspacePromo);
  els.commerceAssetGrid.addEventListener("click", event => {
    const action = event.target.closest("[data-commerce-preview-action]");
    if (!action) return;
    const id = action.dataset.commerceResultId;
    if (action.dataset.commercePreviewAction === "add") addCommerceWorkspaceResultToCanvas(id);
    if (action.dataset.commercePreviewAction === "download") downloadCommerceWorkspaceResult(id);
  });
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
    scheduleLocalSave();
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
      scheduleLocalSave();
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

function dragEdgeVelocity(clientX, clientY, rect) {
  const edgeSpeed = distance => Math.min(1, Math.max(0, (DRAG_EDGE_MARGIN - distance) / DRAG_EDGE_MARGIN)) * DRAG_EDGE_MAX_SPEED;
  let x = 0;
  let y = 0;
  if (clientX < rect.left + DRAG_EDGE_MARGIN) x = edgeSpeed(clientX - rect.left);
  else if (clientX > rect.right - DRAG_EDGE_MARGIN) x = -edgeSpeed(rect.right - clientX);
  if (clientY < rect.top + DRAG_EDGE_MARGIN) y = edgeSpeed(clientY - rect.top);
  else if (clientY > rect.bottom - DRAG_EDGE_MARGIN) y = -edgeSpeed(rect.bottom - clientY);
  return { x, y };
}

function cardInteractionBounds(card) {
  return {
    x: card.x,
    y: card.y,
    width: card.w,
    height: card.layoutH ?? card.h
  };
}

function cardsInteractionBounds(cards) {
  if (!cards.length) return null;
  const left = Math.min(...cards.map(card => card.x));
  const top = Math.min(...cards.map(card => card.y));
  const right = Math.max(...cards.map(card => card.x + card.w));
  const bottom = Math.max(...cards.map(card => card.y + (card.layoutH ?? card.h)));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function beginPendingCardDrag(card, event) {
  if (!interactionController.begin("pending-card-drag", { pointerId: event.pointerId, cardId: card.id })) return false;
  beginHistoryTransaction("drag");
  state.pendingDrag = {
    id: card.id,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startWorld: clientToWorld(event.clientX, event.clientY),
    shiftKey: event.shiftKey,
    wasSelected: isCardSelected(card.id),
    selectionBefore: selectedIds()
  };
  return true;
}

function commitPendingDrag(event) {
  const pending = state.pendingDrag;
  if (!pending || event.pointerId !== pending.pointerId) return false;
  const dx = event.clientX - pending.startClientX;
  const dy = event.clientY - pending.startClientY;
  if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return false;

  if (!pending.wasSelected) {
    if (pending.shiftKey) toggleSelected(pending.id);
    else selectSingle(pending.id);
  }
  const dragIds = selectedIds();
  const cardsById = new Map(state.cards.map(card => [card.id, card]));
  const dragCards = dragIds.map(id => cardsById.get(id)).filter(Boolean);
  const idSet = new Set(dragIds);
  const bounds = cardsInteractionBounds(dragCards);
  interactionController.end(event.pointerId);
  if (!bounds || !interactionController.begin("dragging", { pointerId: event.pointerId, cardId: pending.id })) {
    state.pendingDrag = null;
    cancelHistoryTransaction();
    return false;
  }
  state.drag = {
    id: pending.id,
    pointerId: event.pointerId,
    start: pending.startWorld,
    startClientX: pending.startClientX,
    startClientY: pending.startClientY,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    viewX: state.viewport.x,
    viewY: state.viewport.y,
    altKey: event.altKey,
    ids: dragIds,
    idSet,
    bounds,
    targets: state.cards.filter(card => !idSet.has(card.id)).map(cardInteractionBounds),
    selectionBefore: pending.selectionBefore,
    origins: dragCards.map(card => ({ card, id: card.id, x: card.x, y: card.y }))
  };
  state.pendingDrag = null;
  updateDraggedCards(event.clientX, event.clientY, event.altKey);
  startDragAutoPan();
  return true;
}

function commitPendingCardClick(event) {
  const pending = state.pendingDrag;
  if (!pending || event.pointerId !== pending.pointerId) return false;
  if (pending.shiftKey) toggleSelected(pending.id);
  else selectSingle(pending.id);
  state.pendingDrag = null;
  interactionController.end(event.pointerId);
  cancelHistoryTransaction();
  scheduleInteractionFrame({ selection: true, dock: true, minimap: true });
  return true;
}

function updateDraggedCards(clientX, clientY, altKey = false) {
  const drag = state.drag;
  if (!drag?.origins?.length) return;
  const point = clientToWorld(clientX, clientY);
  const snapped = CanvasEngine.calculateSnap({
    origin: { x: drag.bounds.x, y: drag.bounds.y },
    delta: { x: point.x - drag.start.x, y: point.y - drag.start.y },
    scale: state.viewport.scale,
    gridSize: 16,
    thresholdPx: 6,
    altKey,
    movingBounds: drag.bounds,
    targets: drag.targets
  });
  drag.origins.forEach(origin => {
    origin.card.x = Math.round(origin.x + snapped.dx);
    origin.card.y = Math.round(origin.y + snapped.dy);
  });
  state.alignmentGuides = snapped.guides;
}

function continueDragAutoPan(timestamp) {
  const drag = state.drag;
  if (!drag) return;
  const elapsed = Math.min(50, Math.max(0, timestamp - (drag.lastAutoPanAt || timestamp)));
  drag.lastAutoPanAt = timestamp;
  const rect = els.viewport.getBoundingClientRect();
  const velocity = dragEdgeVelocity(drag.lastClientX, drag.lastClientY, rect);
  if (velocity.x || velocity.y) {
    state.viewport.x += velocity.x * elapsed / 1000;
    state.viewport.y += velocity.y * elapsed / 1000;
    updateDraggedCards(drag.lastClientX, drag.lastClientY, drag.altKey);
    scheduleInteractionFrame({ viewport: true, cards: true, edges: true, selection: true, guides: true, dock: true, minimap: true });
  }
  drag.autoPanFrame = requestAnimationFrame(continueDragAutoPan);
}

function startDragAutoPan() {
  if (!state.drag || state.drag.autoPanFrame) return;
  state.drag.lastAutoPanAt = performance.now();
  state.drag.autoPanFrame = requestAnimationFrame(continueDragAutoPan);
}

function stopDragAutoPan() {
  if (state.drag?.autoPanFrame) cancelAnimationFrame(state.drag.autoPanFrame);
  if (state.drag) state.drag.autoPanFrame = 0;
}

function isActiveInteractionPointer(event) {
  const active = interactionController.value;
  return active.mode === "idle" || active.pointerId === event.pointerId;
}

function connectionTargetValidity(from, to) {
  if (!to || from === to) return "invalid";
  if (!findCard(from) || !findCard(to)) return "invalid";
  if (state.edges.some(edge => edge.from === from && edge.to === to)) return "invalid";
  return "valid";
}

function setConnectionTarget(cardId, validity) {
  const connecting = state.connecting;
  if (!connecting) return;
  const previousCard = cardNodes.get(connecting.targetId);
  previousCard?.classList.remove("connection-valid", "connection-invalid");
  previousCard?.querySelector(".port.input")?.classList.remove("connection-valid", "connection-invalid");
  connecting.targetId = cardId || null;
  connecting.targetValidity = validity || null;
  const targetCard = cardNodes.get(connecting.targetId);
  if (!targetCard || !connecting.targetValidity) return;
  targetCard.classList.add(`connection-${connecting.targetValidity}`);
  targetCard.querySelector(".port.input")?.classList.add(`connection-${connecting.targetValidity}`);
}

function restoreConnectionFeedback() {
  const connecting = state.connecting;
  if (!connecting) return;
  cardNodes.get(connecting.from)?.querySelector(".port.output")?.classList.add("connecting");
  setConnectionTarget(connecting.targetId, connecting.targetValidity);
}

function clearConnectionFeedback() {
  const connecting = state.connecting;
  if (!connecting) return;
  setConnectionTarget(null, null);
  cardNodes.get(connecting.from)?.querySelector(".port.output")?.classList.remove("connecting");
}

function handleEdgeKeydown(event) {
  const edgePathNode = event.target.closest(".connection-hit[data-edge-id]");
  if (!edgePathNode) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.stopPropagation();
    selectEdge(edgePathNode.dataset.edgeId);
    scheduleInteractionFrame({ selection: true, edges: true, dock: true, minimap: true });
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    event.stopPropagation();
    selectEdge(edgePathNode.dataset.edgeId);
    deleteSelectedEdge();
  }
}

function cancelCanvasInteraction() {
  if (state.drag?.origins) {
    state.drag.origins.forEach(origin => {
      Object.assign(origin.card, { x: origin.x, y: origin.y });
    });
    state.viewport.x = state.drag.viewX;
    state.viewport.y = state.drag.viewY;
    setSelected(state.drag.selectionBefore);
  }
  if (state.pan) {
    state.viewport.x = state.pan.viewX;
    state.viewport.y = state.pan.viewY;
  }
  if (state.minimapPan) {
    state.viewport.x = state.minimapPan.viewX;
    state.viewport.y = state.minimapPan.viewY;
  }
  if (state.selectionBox?.selectionBefore) setSelected(state.selectionBox.selectionBefore);
  clearConnectionFeedback();
  stopDragAutoPan();
  state.pendingDrag = null;
  state.drag = null;
  state.pan = null;
  state.minimapPan = null;
  state.selectionBox = null;
  state.connecting = null;
  state.alignmentGuides = [];
  interactionController.cancel();
  cancelHistoryTransaction();
  els.viewport.classList.remove("is-panning");
  document.getElementById("minimapCanvas")?.classList.remove("is-navigating");
  scheduleInteractionFrame({ viewport: true, cards: true, edges: true, selection: true, guides: true, dock: true, minimap: true });
}

function setupCanvasEvents() {
  els.stage.addEventListener("keydown", handleEdgeKeydown);
  els.viewport.addEventListener("wheel", event => {
    const isZoomGesture = event.ctrlKey;
    if (!isZoomGesture && event.target.closest(".node-control-dock")) return;
    event.preventDefault();
    beginHistoryTransaction("wheel");
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? els.viewport.clientHeight : 1;
    if (isZoomGesture) {
      const rect = els.viewport.getBoundingClientRect();
      const pointerWorld = clientToWorld(event.clientX, event.clientY);
      const zoomFactor = Math.pow(1.1, -Number(event.deltaY || 0) * multiplier / 100);
      const nextScale = Math.min(2.5, Math.max(0.25, state.viewport.scale * zoomFactor));
      state.viewport.scale = nextScale;
      state.viewport.x = Math.round(event.clientX - rect.left - pointerWorld.x * nextScale);
      state.viewport.y = Math.round(event.clientY - rect.top - pointerWorld.y * nextScale);
    } else {
      state.viewport.x -= Number(event.deltaX || 0) * multiplier;
      state.viewport.y -= Number(event.deltaY || 0) * multiplier;
    }
    scheduleInteractionFrame({ viewport: true, dock: true, minimap: true });
    scheduleLocalSave();
  }, { passive: false });

  els.viewport.addEventListener("pointerdown", event => {
    if (event.button === 1) {
      event.preventDefault();
      if (!interactionController.begin("panning", { pointerId: event.pointerId })) return;
      beginHistoryTransaction("pan");
      hideContextMenu();
      hideConnectionCreateMenu();
      els.viewport.classList.add("is-panning");
      state.pendingDrag = null;
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
    const edgePathNode = event.target.closest("[data-edge-id]");
    if (edgePathNode) {
      event.preventDefault();
      event.stopPropagation();
      selectEdge(edgePathNode.dataset.edgeId);
      scheduleInteractionFrame({ selection: true, edges: true, dock: true, minimap: true });
      return;
    }
    const output = event.target.closest(".port.output");
    if (output) {
      event.preventDefault();
      event.stopPropagation();
      if (!interactionController.begin("connecting", { pointerId: event.pointerId, cardId: output.dataset.id })) return;
      state.selectedEdgeId = null;
      state.connecting = { from: output.dataset.id, to: clientToWorld(event.clientX, event.clientY), targetId: null, targetValidity: null };
      output.classList.add("connecting");
      els.viewport.setPointerCapture(event.pointerId);
      scheduleInteractionFrame({ edges: true });
      return;
    }

    const cardEl = event.target.closest(".card");
    if (cardEl) {
      event.preventDefault();
      const card = findCard(cardEl.dataset.id);
      if (!card) return;
      if (!beginPendingCardDrag(card, event)) return;
      cardEl.setPointerCapture(event.pointerId);
      return;
    }

    if (!event.target.closest(".node-palette")) els.nodePalette.classList.add("hidden");
    if (!interactionController.begin("selecting", { pointerId: event.pointerId })) return;
    const point = clientToWorld(event.clientX, event.clientY);
    const selectionBefore = selectedIds();
    if (!event.shiftKey) setSelected([]);
    state.selectionBox = {
      startWorld: point,
      currentWorld: point,
      startClientX: event.clientX,
      startClientY: event.clientY,
      currentClientX: event.clientX,
      currentClientY: event.clientY,
      shiftKey: event.shiftKey,
      selectionBefore
    };
    els.viewport.setPointerCapture(event.pointerId);
    scheduleInteractionFrame({ selection: true, dock: true, minimap: true });
  });

  window.addEventListener("pointermove", event => {
    if (!isActiveInteractionPointer(event)) return;
    if (state.minimapPan) {
      updateMinimapPan(event);
      return;
    }
    if (state.connecting) {
      state.connecting.to = clientToWorld(event.clientX, event.clientY);
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const input = element && element.closest(".port.input");
      const targetId = input?.dataset.id || null;
      setConnectionTarget(targetId, input ? connectionTargetValidity(state.connecting.from, targetId) : null);
      scheduleInteractionFrame({ edges: true });
      return;
    }
    if (state.pendingDrag) {
      if (commitPendingDrag(event)) {
        scheduleInteractionFrame({ cards: true, edges: true, selection: true, guides: true, dock: true, minimap: true });
      }
      return;
    }
    if (state.drag) {
      state.drag.lastClientX = event.clientX;
      state.drag.lastClientY = event.clientY;
      state.drag.altKey = event.altKey;
      updateDraggedCards(event.clientX, event.clientY, event.altKey);
      scheduleInteractionFrame({ cards: true, edges: true, selection: true, guides: true, dock: true, minimap: true });
      return;
    }
    if (state.selectionBox) {
      const point = clientToWorld(event.clientX, event.clientY);
      state.selectionBox.currentWorld = point;
      state.selectionBox.currentClientX = event.clientX;
      state.selectionBox.currentClientY = event.clientY;
      scheduleInteractionFrame({ selection: true, dock: true, minimap: true });
      return;
    }
    if (state.pan) {
      state.viewport.x = state.pan.viewX + event.clientX - state.pan.startX;
      state.viewport.y = state.pan.viewY + event.clientY - state.pan.startY;
      scheduleInteractionFrame({ viewport: true, dock: true, minimap: true });
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
    if (!isActiveInteractionPointer(event)) return;
    if (state.minimapPan) {
      endMinimapPan(event);
      return;
    }
    if (state.connecting) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const input = element && element.closest(".port.input");
      const from = state.connecting.from;
      const targetId = input?.dataset.id || null;
      const validity = input ? connectionTargetValidity(from, targetId) : null;
      if (validity === "valid") {
        if (input && input.dataset.id !== from) {
          clearConnectionFeedback();
          addEdge(from, input.dataset.id);
          state.connecting = null;
          interactionController.end(event.pointerId);
          render();
          save();
          return;
        }
      }
      if (validity === "invalid") {
        clearConnectionFeedback();
        state.connecting = null;
        interactionController.end(event.pointerId);
        scheduleInteractionFrame({ edges: true });
        return;
      }
      showConnectionCreateMenu(from, event.clientX, event.clientY);
      clearConnectionFeedback();
      state.connecting = null;
      interactionController.end(event.pointerId);
      scheduleInteractionFrame({ edges: true });
      return;
    }
    if (state.pendingDrag) {
      if (!commitPendingDrag(event)) {
        commitPendingCardClick(event);
        return;
      }
    }
    if (state.selectionBox) {
      const movedX = Math.abs(state.selectionBox.currentClientX - state.selectionBox.startClientX);
      const movedY = Math.abs(state.selectionBox.currentClientY - state.selectionBox.startClientY);
      if (movedX < 4 && movedY < 4) {
        setSelected(state.selectionBox.shiftKey ? state.selectionBox.selectionBefore : []);
      } else {
        setSelected(lassoSelectionIds(state.selectionBox, normalizedSelectionRect(state.selectionBox)));
      }
      state.selectionBox = null;
      interactionController.end(event.pointerId);
      scheduleInteractionFrame({ selection: true, dock: true, minimap: true });
      return;
    }
    const completedGesture = Boolean(state.drag || state.pan);
    if (completedGesture && commitHistoryTransaction()) scheduleLocalSave();
    els.viewport.classList.remove("is-panning");
    stopDragAutoPan();
    state.drag = null;
    state.pan = null;
    state.alignmentGuides = [];
    interactionController.end(event.pointerId);
    scheduleInteractionFrame({ guides: true, dock: true, minimap: true });
  });

  window.addEventListener("pointercancel", event => {
    if (interactionController.value.mode === "idle") return;
    if (!isActiveInteractionPointer(event)) return;
    cancelCanvasInteraction();
  });

  window.addEventListener("lostpointercapture", event => {
    if (interactionController.value.mode === "idle") return;
    if (!isActiveInteractionPointer(event)) return;
    cancelCanvasInteraction();
  }, true);
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

function setupCanvasManagement() {
  const toolsMenu = document.getElementById("canvasToolsMenu");
  const historyMenu = document.getElementById("historyMenu");
  const canvasLibraryMenu = els.canvasLibraryMenu;
  els.openCanvasLibrary.addEventListener("click", event => {
    event.stopPropagation();
    const opening = canvasLibraryMenu.classList.contains("hidden");
    toolsMenu.classList.add("hidden");
    historyMenu.classList.add("hidden");
    canvasLibraryMenu.classList.toggle("hidden", !opening);
    els.openCanvasLibrary.setAttribute("aria-expanded", String(opening));
    if (opening) renderCanvasLibrary();
  });
  els.canvasLibraryList.addEventListener("click", event => {
    const button = event.target.closest("[data-canvas-id]");
    if (button) switchCanvas(button.dataset.canvasId);
  });
  els.newCanvas.addEventListener("click", createNewCanvas);
  els.saveCanvas.addEventListener("click", () => { save(); closeCanvasLibrary(); });
  els.renameCanvas.addEventListener("click", renameActiveCanvas);
  els.deleteCanvas.addEventListener("click", deleteActiveCanvas);
  document.getElementById("openCanvasTools").addEventListener("click", event => {
    event.stopPropagation();
    toolsMenu.classList.toggle("hidden");
    historyMenu.classList.add("hidden");
    closeCanvasLibrary();
  });
  document.getElementById("openHistory").addEventListener("click", event => {
    event.stopPropagation();
    historyMenu.classList.toggle("hidden");
    toolsMenu.classList.add("hidden");
    closeCanvasLibrary();
    renderHistoryMenu();
  });
  document.getElementById("groupSelection").addEventListener("click", () => { groupSelectedCards(); toolsMenu.classList.add("hidden"); });
  document.getElementById("ungroupSelection").addEventListener("click", () => { ungroupSelection(); toolsMenu.classList.add("hidden"); });
  document.getElementById("autoLayout").addEventListener("click", () => { autoLayoutCards("selected"); toolsMenu.classList.add("hidden"); });
  document.getElementById("autoLayoutAll").addEventListener("click", () => { autoLayoutCards("all"); toolsMenu.classList.add("hidden"); });
  document.getElementById("toggleMinimap").addEventListener("click", () => {
    document.getElementById("minimap").classList.toggle("hidden");
    renderMinimap();
    toolsMenu.classList.add("hidden");
  });
  document.getElementById("undoCanvas").addEventListener("click", undoCanvas);
  document.getElementById("redoCanvas").addEventListener("click", redoCanvas);
  document.getElementById("createCanvasSnapshot").addEventListener("click", createCanvasSnapshot);
  els.canvasSnapshotList.addEventListener("click", event => {
    const button = event.target.closest("[data-snapshot-id]");
    if (button) restoreNamedCanvasSnapshot(button.dataset.snapshotId);
  });
  els.canvasSearch.addEventListener("input", event => renderSearchResults(event.target.value));
  els.canvasSearchResults.addEventListener("click", event => {
    const button = event.target.closest("[data-search-card-id]");
    if (!button) return;
    focusCard(button.dataset.searchCardId);
    els.canvasSearchResults.classList.add("hidden");
  });
  const minimapCanvas = document.getElementById("minimapCanvas");
  minimapCanvas.tabIndex = 0;
  minimapCanvas.setAttribute("role", "application");
  minimapCanvas.setAttribute("aria-label", "画布小地图，使用方向键导航");
  minimapCanvas.addEventListener("pointerdown", beginMinimapPan);
  minimapCanvas.addEventListener("keydown", handleMinimapKeydown);
  els.stage.addEventListener("pointerdown", event => {
    if (event.button === 0 && event.target.closest(".canvas-group-title")) event.stopPropagation();
  });
  els.stage.addEventListener("click", event => {
    const action = event.target.closest("[data-group-action]");
    if (action?.dataset.groupAction === "ungroup") ungroupById(action.dataset.groupId);
  });
  els.stage.addEventListener("input", event => {
    const input = event.target.closest("[data-group-title]");
    if (!input) return;
    const group = state.groups.find(item => item.id === input.dataset.groupTitle);
    if (!group) return;
    group.name = input.value.slice(0, 32);
    scheduleLocalSave();
  });
  window.addEventListener("click", event => {
    if (!event.target.closest(".canvas-tools-menu") && !event.target.closest("#openCanvasTools")) toolsMenu.classList.add("hidden");
    if (!event.target.closest(".history-menu") && !event.target.closest("#openHistory")) historyMenu.classList.add("hidden");
    if (!event.target.closest(".canvas-library-menu") && !event.target.closest("#openCanvasLibrary")) closeCanvasLibrary();
  });
  renderHistoryMenu();
  renderCanvasLibrary();
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
  flushLocalSave();
  const blob = new Blob([JSON.stringify({
    schema: CANVAS_LIBRARY_SCHEMA,
    activeCanvasId: canvasLibrary.activeCanvasId,
    canvases: cloneData(canvasLibrary.canvases),
    settings
  }, null, 2)], { type: "application/json" });
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
  flushLocalSave();
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.canvases)) {
        const imported = data.canvases.map(canvas => createCanvasRecord(canvas.name, canvas));
        if (!imported.length) throw new Error("文件中没有可用画布");
        canvasLibrary = {
          schema: CANVAS_LIBRARY_SCHEMA,
          activeCanvasId: String(data.activeCanvasId || imported[0].id),
          canvases: imported
        };
        if (!canvasLibrary.canvases.some(canvas => canvas.id === canvasLibrary.activeCanvasId)) canvasLibrary.activeCanvasId = canvasLibrary.canvases[0].id;
        applyCanvasRecord(activeCanvasRecord());
      } else {
        if (Array.isArray(data.cards)) state.cards = data.cards;
        if (Array.isArray(data.edges)) state.edges = data.edges;
        if (Array.isArray(data.groups)) state.groups = data.groups;
        if (Array.isArray(data.canvasSnapshots)) state.canvasSnapshots = normalizeCanvasSnapshots(data.canvasSnapshots);
        if (data.viewport) state.viewport = data.viewport;
      }
      if (data.settings) Object.assign(settings, data.settings);
      if (!Array.isArray(data.canvases)) {
        if (data.commerceWorkspace) state.commerceWorkspace = normalizeCommerceWorkspace(data.commerceWorkspace);
        if (data.productVideoWorkspace) state.productVideoWorkspace = normalizeProductVideoWorkspace(data.productVideoWorkspace);
      }
      migrateLegacyCommerceNodes();
      normalizeCanvasState();
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
  flushLocalSave();
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
    "Create a polished e-commerce product hero image for online retail.",
    "Use the first reference image as the exact product identity and preserve its shape, proportions, material, logo placement, color, structure, and visible details without redesigning it.",
    "Use model and scene references only when provided, keeping the product as the visual focus.",
    "Use a single clear commercial composition, premium realistic lighting, natural texture, clean background, and enough blank space for Chinese e-commerce copy to be typeset later.",
    "Express selling points through product details, usage action, lighting, and composition; do not ask the image model to draw readable copy.",
    custom
  ].filter(Boolean).join("\n");
}

function commerceWorkspaceImageRequest(apiKey, prompt) {
  const workspace = state.commerceWorkspace;
  const refs = commerceWorkspaceReferences();
  const requestCard = {
    type: "commerce",
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

function addCommerceWorkspaceResultToCanvas(id) {
  const result = commerceWorkspaceResult(id);
  if (!result) return;
  setWorkspaceMode("canvas");
  const card = createCard("upload", {
    title: "电商宣传图",
    resultUrl: result.url,
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
  const originCanvasId = canvasLibrary.activeCanvasId;
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
    const generated = cleanGeneratedPrompt(promptResultText(data));
    if (!generated) throw new Error(promptResponseError(data));
    mutateCanvasById(originCanvasId, targetState => {
      targetState.commerceWorkspace.prompt = generated;
      targetState.commerceWorkspace.lastGeneratedPrompt = generated;
      targetState.commerceWorkspace.promptStatus = "done";
      targetState.commerceWorkspace.promptError = "";
    }, renderCommerceWorkspace);
  } catch (error) {
    mutateCanvasById(originCanvasId, targetState => {
      targetState.commerceWorkspace.promptStatus = "error";
      targetState.commerceWorkspace.promptError = isContentPolicyViolation(error) ? commercePolicyErrorMessage() : error.message || "Agnes 提示词生成失败。";
    }, renderCommerceWorkspace);
  }
}

async function generateCommerceWorkspacePromo() {
  const originCanvasId = canvasLibrary.activeCanvasId;
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
  const imageRequest = settings.provider === "custom" ? null : commerceWorkspaceImageRequest(apiKey, prompt);
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
      const imageResponse = await requestCommerceImage(imageRequest);
      result = imageResultUrl(imageResponse.data);
      if (!result) throw new Error("图片 API 未返回可用的图片 URL。");
      result.prompt = imageResponse.prompt;
    }
    mutateCanvasById(originCanvasId, targetState => {
      targetState.commerceWorkspace.results.unshift({ id: uid("commerce-result"), url: result.url, mime: result.mime, prompt: result.prompt || prompt, createdAt: Date.now(), status: "done" });
      targetState.commerceWorkspace.status = "done";
      targetState.commerceWorkspace.error = "";
    }, renderCommerceWorkspace);
  } catch (error) {
    mutateCanvasById(originCanvasId, targetState => {
      targetState.commerceWorkspace.status = "error";
      targetState.commerceWorkspace.error = error.message || "电商宣传图生成失败。";
    }, renderCommerceWorkspace);
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
    "Create one safe, single-frame e-commerce product poster for online retail.",
    "Use the uploaded product reference as the exact product and preserve only its visible shape, material, color, logo, and details.",
    "Show one product as the clear visual subject in one neutral studio or everyday commercial setting with realistic lighting and clean composition.",
    "Express the product's visible factual advantages as one clear main selling point and no more than three short benefit labels in the same poster; do not invent specifications, medical effects, certifications, or promises.",
    "Leave clean space for short e-commerce copy; do not render long paragraphs or dense small text.",
    "No people, minors, intimacy, nudity, violence, weapons, drugs, illegal activity, dangerous actions, medical claims, political content, or other sensitive themes.",
    "No collage, split screen, multi-panel detail page, multiple scenes, storyboard, shot list, or repeated product."
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
  const originCanvasId = canvasLibrary.activeCanvasId;
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
    mutateCanvasById(originCanvasId, targetState => {
      const targetCard = targetState.cards.find(item => item.id === card.id);
      if (!targetCard) return;
      targetCard.prompt = generated;
      targetCard.lastGeneratedPrompt = generated;
      targetCard.promptStatus = "done";
      targetCard.promptError = "";
    });
  } catch (error) {
    mutateCanvasById(originCanvasId, targetState => {
      const targetCard = targetState.cards.find(item => item.id === card.id);
      if (!targetCard) return;
      targetCard.promptStatus = "error";
      targetCard.promptError = isContentPolicyViolation(error) ? commercePolicyErrorMessage() : error.message || "Agnes 提示词生成失败。";
    });
  }
}

function imageResultUrl(data) {
  const item = data.response?.data?.[0] || {};
  if (item.url) return { url: item.url, mime: "image/png" };
  if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, mime: "image/png" };
  return null;
}

async function generateCommercePromo() {
  const originCanvasId = canvasLibrary.activeCanvasId;
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
      createCommerceResultCard(card, result.url, imageResponse.prompt, result.mime, originCanvasId);
    }
    if (settings.provider === "custom") createCommerceResultCard(card, result.url, prompt, result.mime, originCanvasId);
    updateCard(card.id, { status: "done", progress: 100, error: "" }, originCanvasId);
  } catch (error) {
    updateCard(card.id, { status: "error", progress: 0, error: error.message || "电商宣传图生成失败。" }, originCanvasId);
  }
}

async function generateSelected() {
  const originCanvasId = canvasLibrary.activeCanvasId;
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
      await pollVideo(card.id, apiKey, originCanvasId);
    } catch (error) {
      updateCard(card.id, { status: "error", progress: 0, error: error.message }, originCanvasId);
    }
    return;
  }
  updateSelected({ status: "running", progress: 8, error: "" });
  try {
    if (settings.provider === "custom") await generateCustom(card, apiKey, prompt, originCanvasId);
    else if (card.type === "image") await generateAgnesImage(card, apiKey, prompt, originCanvasId);
    else await generateAgnesVideo(card, apiKey, prompt, originCanvasId);
  } catch (error) {
    updateCard(card.id, { status: "error", progress: 0, error: error.message }, originCanvasId);
  }
}

async function generateCustom(card, apiKey, prompt, originCanvasId) {
  let bodyTemplate = {};
  try { bodyTemplate = JSON.parse(settings.customBody || "{}"); } catch { throw new Error("自定义 Body Template 不是合法 JSON。"); }
  const refs = cardRefs(card);
  const data = await postJson("/api/custom", { apiKey, endpoint: settings.customEndpoint, method: settings.customMethod, bodyTemplate, prompt, model: card.model, size: card.size, imageUrl: refs[0] || "", imageRefs: refs, imageRoles: refs.map(() => "reference") });
  const result = pathGet(data.response, settings.customResultPath);
  if (!result) throw new Error("自定义 API 没有按结果字段路径返回资产 URL。");
  const mime = card.type === "video" ? "video/mp4" : "image/png";
  duplicateResultCard(card, card.type, result, mime, originCanvasId);
  updateCard(card.id, { status: "done", progress: 100, resultUrl: result, mime }, originCanvasId);
}

async function generateAgnesImage(card, apiKey, prompt, originCanvasId) {
  const data = await postJson("/api/agnes/image", agnesImageRequest(card, apiKey, prompt, cardRefs(card)));
  const item = data.response?.data?.[0] || {};
  let resultUrl = item.url || "";
  if (!resultUrl && item.b64_json) resultUrl = `data:image/png;base64,${item.b64_json}`;
  if (!resultUrl) throw new Error("Agnes 图片 API 未返回 data[0].url 或 data[0].b64_json。");
  duplicateResultCard(card, "image", resultUrl, "image/png", originCanvasId);
  updateCard(card.id, { status: "done", progress: 100, resultUrl, mime: "image/png" }, originCanvasId);
}

async function generateAgnesVideo(card, apiKey, prompt, originCanvasId) {
  const { width, height } = parseSize(card.size);
  const created = await postJson("/api/agnes/video", { apiKey, model: card.model || settings.videoModel, prompt, imageRefs: cardRefs(card), width, height, num_frames: card.num_frames || 121, frame_rate: card.frame_rate || 24, negative_prompt: card.negative_prompt, generate_audio: card.generate_audio });
  const response = created.response || {};
  updateCard(card.id, { status: response.status || "queued", progress: response.progress || 12, task: { video_id: response.video_id, task_id: response.task_id || response.id } }, originCanvasId);
  await pollVideo(card.id, apiKey, originCanvasId);
}

async function pollVideo(cardId, apiKey, originCanvasId = canvasLibrary.activeCanvasId) {
  const maxAttempts = 120;
  let delay = normalizePollInterval(settings.pollInterval);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const card = findCanvasCard(originCanvasId, cardId);
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
        }, originCanvasId);
        continue;
      }
      throw error;
    }

    delay = normalizePollInterval(settings.pollInterval);
    const result = data.response || {};
    const status = result.status || "running";
    const progress = Number(result.progress ?? Math.min(95, 20 + attempt * 3));
    updateCard(cardId, { status: status === "completed" ? "running" : status, progress, error: "" }, originCanvasId);
    if (status === "completed" && result.url) {
      const current = findCanvasCard(originCanvasId, cardId);
      duplicateResultCard(current, "video", result.url, "video/mp4", originCanvasId);
      updateCard(cardId, { status: "done", progress: 100, resultUrl: result.url, mime: "video/mp4", error: "" }, originCanvasId);
      return;
    }
    if (status === "failed") throw new Error(result.error ? JSON.stringify(result.error) : "Agnes 视频生成失败。");
  }
  throw new Error("视频生成轮询超时。可稍后重新点击生成或查看 Agnes 控制台。");
}

function updateCard(id, patch, canvasId = canvasLibrary.activeCanvasId) {
  return mutateCanvasById(canvasId, targetState => {
    const card = targetState.cards.find(item => item.id === id);
    if (!card) return null;
    Object.assign(card, patch);
    return card;
  });
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

function requestedPerformanceFixtureCount() {
  const count = Number(window.__CANVAS_PERFORMANCE_FIXTURE__?.count);
  return count === 100 || count === 300 ? count : 0;
}

function performanceFixtureMode() {
  return requestedPerformanceFixtureCount() > 0;
}

function installPerformanceFixture() {
  const count = requestedPerformanceFixtureCount();
  if (!count) return false;
  if (window.canvasPerformanceFixtureReady === true && window.canvasPerformanceFixtureCount === count) return true;
  if (typeof window.createCanvasPerformanceFixture !== "function") return false;
  const fixture = window.createCanvasPerformanceFixture(count);
  if (!Array.isArray(fixture?.cards) || fixture.cards.length !== count) return false;
  if (!Array.isArray(fixture?.edges) || fixture.edges.length !== count - 1) return false;

  const fixtureCanvas = createCanvasRecord(`性能测试 ${count} 节点`, {
    id: "canvas_performance_fixture",
    cards: fixture.cards,
    edges: fixture.edges,
    groups: [],
    viewport: { x: 80, y: 80, scale: 0.35 }
  });
  canvasLibrary = {
    schema: CANVAS_LIBRARY_SCHEMA,
    activeCanvasId: fixtureCanvas.id,
    canvases: [fixtureCanvas]
  };
  applyCanvasRecord(fixtureCanvas);
  window.canvasPerformanceFixtureCount = state.cards.length;
  window.canvasPerformanceFixtureEdgeCount = state.edges.length;
  window.canvasPerformanceFixtureReady = true;
  renderCanvasLibrary();
  render();
  return true;
}

function setupPerformanceFixture() {
  if (!performanceFixtureMode()) return false;
  window.addEventListener("canvas-performance-fixture-ready", installPerformanceFixture);
  installPerformanceFixture();
  return true;
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

function cloneClipboardNodes(positionCard) {
  if (!state.clipboard || !state.clipboard.cards.length) return { cards: [], edges: [] };
  const idMap = new Map();
  const cards = state.clipboard.cards.map((card, index) => {
    const next = JSON.parse(JSON.stringify(card));
    const newId = uid(next.type || "card");
    idMap.set(card.id, newId);
    next.id = newId;
    const position = positionCard(card, index);
    next.x = Math.round(position.x);
    next.y = Math.round(position.y);
    next.status = next.status === "running" || next.status === "queued" ? "idle" : next.status;
    next.progress = next.status === "idle" ? 0 : next.progress;
    next.task = null;
    return next;
  });
  const edges = state.clipboard.edges
    .filter(edge => idMap.has(edge.from) && idMap.has(edge.to))
    .map(edge => ({ id: uid("edge"), from: idMap.get(edge.from), to: idMap.get(edge.to) }));
  return { cards, edges };
}

function pasteNodes() {
  if (!state.clipboard || !state.clipboard.cards.length) return;
  const base = state.contextWorld || viewportCenter();
  const minX = Math.min(...state.clipboard.cards.map(card => card.x));
  const minY = Math.min(...state.clipboard.cards.map(card => card.y));
  const cloned = cloneClipboardNodes((card, index) => ({
    x: base.x + (card.x - minX) + index * 12,
    y: base.y + (card.y - minY) + index * 12
  }));
  state.cards.push(...cloned.cards);
  state.edges.push(...cloned.edges);
  setSelected(cloned.cards.map(card => card.id));
  hideContextMenu();
  render();
  save();
}

function deleteSelectedEdge() {
  if (!state.selectedEdgeId) return false;
  state.edges = state.edges.filter(edge => edge.id !== state.selectedEdgeId);
  state.selectedEdgeId = null;
  const connectedCardIds = new Set(state.edges.flatMap(edge => [edge.from, edge.to]));
  cardNodes.forEach((cardNode, id) => cardNode.classList.toggle("connected", connectedCardIds.has(id)));
  scheduleInteractionFrame({ edges: true, minimap: true });
  save();
  return true;
}

function duplicateSelectedNodes() {
  if (!selectedIds().length) return;
  copyNodes("selected");
  const cloned = cloneClipboardNodes(card => ({
    x: card.x + DUPLICATE_OFFSET_WORLD,
    y: card.y + DUPLICATE_OFFSET_WORLD
  }));
  if (!cloned.cards.length) return;
  state.cards.push(...cloned.cards);
  state.edges.push(...cloned.edges);
  setSelected(cloned.cards.map(card => card.id));
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
      selectedEdgeId: state.selectedEdgeId,
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
  els.connectionCreateMenu.addEventListener("pointerdown", event => {
    if (event.button === 0) event.stopPropagation();
  });
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
      cancelCanvasInteraction();
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
      if (deleteSelectedEdge()) return;
      deleteSelectedNode();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelectedNodes();
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
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoCanvas();
      else undoCanvas();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoCanvas();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "g") {
      event.preventDefault();
      groupSelectedCards();
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
  const fixtureMode = performanceFixtureMode();
  window.addEventListener("beforeunload", flushLocalSave);
  window.addEventListener("pagehide", flushLocalSave);
  if (!fixtureMode) load();
  setupToolbar();
  setupCanvasEvents();
  setupContextMenu();
  setupConnectionCreateMenu();
  setupTopbar();
  setupCanvasManagement();
  setupUtilityControls();
  setupKeyboardShortcuts();
  setupSettings();
  setupActions();
  bindInputs();
  if (fixtureMode) {
    setupPerformanceFixture();
    if (!window.canvasPerformanceFixtureReady) render();
  } else {
    if (!state.cards.length) seedDemo();
    if (state.workspaceMode === "commerce") setWorkspaceMode("commerce");
    else if (state.workspaceMode === "product-video") setWorkspaceMode("product-video");
    else render();
    save();
  }
}

boot();
















