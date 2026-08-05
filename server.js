const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 5177);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const AGNES_BASE = "https://apihub.agnes-ai.com";
const AGNES_V1 = `${AGNES_BASE}/v1`;
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...headers });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), JSON_HEADERS);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function requireApiKey(payload) {
  const apiKey = String(payload.apiKey || "").trim();
  if (!apiKey) {
    const error = new Error("API Key is required.");
    error.status = 400;
    throw error;
  }
  return apiKey;
}

function proxyBypass(target) {
  const raw = process.env.NO_PROXY || process.env.no_proxy || "";
  const host = target.hostname.toLowerCase();
  const port = target.port || (target.protocol === "https:" ? "443" : "80");
  return raw.split(",").some(item => {
    const token = item.trim().toLowerCase();
    if (!token) return false;
    if (token === "*") return true;
    const separator = token.lastIndexOf(":");
    const tokenHost = separator > -1 ? token.slice(0, separator) : token;
    const tokenPort = separator > -1 ? token.slice(separator + 1) : "";
    if (tokenPort && tokenPort !== port) return false;
    return host === tokenHost || host.endsWith(`.${tokenHost}`);
  });
}

function proxyFor(target) {
  if (proxyBypass(target)) return null;
  const raw = target.protocol === "https:"
    ? (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy)
    : (process.env.HTTP_PROXY || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.https_proxy);
  if (!raw) return null;
  try {
    const proxy = new URL(raw);
    return ["http:", "https:"].includes(proxy.protocol) ? proxy : null;
  } catch {
    return null;
  }
}

function proxyAuthHeaders(proxy) {
  if (!proxy.username && !proxy.password) return {};
  const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
  return { "proxy-authorization": `Basic ${Buffer.from(credentials).toString("base64")}` };
}

function requestHeaders(options = {}) {
  return { ...(options.headers || {}) };
}

function readResponse(response, resolve, reject) {
  const chunks = [];
  response.on("data", chunk => chunks.push(Buffer.from(chunk)));
  response.on("end", () => resolve({
    status: response.statusCode || 0,
    headers: response.headers || {},
    body: Buffer.concat(chunks).toString("utf8")
  }));
  response.on("error", reject);
}

function requestDirect(target, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request({
      hostname: target.hostname,
      port: target.port || undefined,
      path: `${target.pathname}${target.search}`,
      method: options.method || "GET",
      headers: requestHeaders(options),
      servername: target.hostname
    }, response => readResponse(response, resolve, reject));
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Upstream request timed out.")));
    request.on("error", reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

function requestThroughProxy(target, proxy, options, timeoutMs) {
  const proxyTransport = proxy.protocol === "https:" ? https : http;
  const proxyHeaders = { ...proxyAuthHeaders(proxy) };
  const method = options.method || "GET";
  if (target.protocol !== "https:") {
    return new Promise((resolve, reject) => {
      const request = proxyTransport.request({
        hostname: proxy.hostname,
        port: proxy.port || undefined,
        path: target.toString(),
        method,
        headers: { ...requestHeaders(options), host: target.host, ...proxyHeaders }
      }, response => readResponse(response, resolve, reject));
      request.setTimeout(timeoutMs, () => request.destroy(new Error("Proxy request timed out.")));
      request.on("error", reject);
      if (options.body) request.write(options.body);
      request.end();
    });
  }

  return new Promise((resolve, reject) => {
    const connect = proxyTransport.request({
      hostname: proxy.hostname,
      port: proxy.port || undefined,
      method: "CONNECT",
      path: `${target.hostname}:${target.port || 443}`,
      headers: { host: `${target.hostname}:${target.port || 443}`, "proxy-connection": "Keep-Alive", ...proxyHeaders }
    });
    connect.setTimeout(timeoutMs, () => connect.destroy(new Error("Proxy CONNECT timed out.")));
    connect.once("connect", (response, socket) => {
      if (response.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`Proxy CONNECT failed with HTTP ${response.statusCode || 0}.`));
        return;
      }
      const request = https.request({
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method,
        headers: requestHeaders(options),
        socket,
        agent: false,
        servername: target.hostname
      }, result => readResponse(result, resolve, reject));
      request.setTimeout(timeoutMs, () => request.destroy(new Error("Upstream request timed out.")));
      request.on("error", reject);
      if (options.body) request.write(options.body);
      request.end();
    });
    connect.on("error", reject);
    connect.end();
  });
}

async function requestUpstream(url, options = {}, timeoutMs = 360000) {
  const target = new URL(url);
  const proxy = proxyFor(target);
  return proxy ? requestThroughProxy(target, proxy, options, timeoutMs) : requestDirect(target, options, timeoutMs);
}

async function fetchJson(url, options, timeoutMs = 360000) {
  let response;
  try {
    response = await requestUpstream(url, options, timeoutMs);
  } catch (cause) {
    const code = cause.code || cause.cause?.code || "NETWORK_ERROR";
    const error = new Error(`无法连接 Agnes 上游（${code}）：${cause.message || "网络请求失败"}`);
    error.cause = cause;
    throw error;
  }
  const contentType = String(response.headers["content-type"] || "");
  const text = response.body;
  let data = text;
  if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (response.status < 200 || response.status >= 300) {
    const error = new Error("Upstream API request failed.");
    error.status = response.status;
    error.payload = { status: response.status, response: data };
    throw error;
  }
  return data;
}

function agnesHeaders(apiKey) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

function commerceRoleLabel(role) {
  return ({ product: "商品图", model: "模特图", scene: "场景图" }[role] || "参考图");
}

function compactObject(value) {
  if (Array.isArray(value)) {
    return value.map(compactObject).filter(item => item !== undefined && item !== "");
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      const compacted = compactObject(item);
      if (compacted !== undefined && compacted !== "" && !(Array.isArray(compacted) && compacted.length === 0)) {
        out[key] = compacted;
      }
    }
    return out;
  }
  return value;
}

async function handleAgnesImage(req, res) {
  const payload = await parseBody(req);
  const apiKey = requireApiKey(payload);
  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    sendJson(res, 400, { error: "Prompt is required." });
    return;
  }

  const responseFormat = payload.responseFormat === "b64_json" ? "b64_json" : "url";
  const imageRefs = Array.isArray(payload.imageRefs) ? payload.imageRefs.filter(Boolean) : [];
  const body = compactObject({
    model: payload.model || "agnes-image-2.1-flash",
    prompt,
    size: payload.size || "1024x768",
    ratio: payload.ratio || undefined,
    quality: payload.quality || undefined,
    return_base64: responseFormat === "b64_json" && imageRefs.length === 0 ? true : undefined,
    extra_body: {
      image: imageRefs.length ? imageRefs : undefined,
      response_format: responseFormat
    }
  });

  const data = await fetchJson(`${AGNES_V1}/images/generations`, {
    method: "POST",
    headers: agnesHeaders(apiKey),
    body: JSON.stringify(body)
  });
  sendJson(res, 200, { ok: true, provider: "agnes", request: body, response: data });
}

async function handleAgnesPrompt(req, res) {
  const payload = await parseBody(req);
  const apiKey = requireApiKey(payload);
  const imageRefs = Array.isArray(payload.imageRefs) ? payload.imageRefs.filter(Boolean) : [];
  const imageRoles = Array.isArray(payload.imageRoles) ? payload.imageRoles : [];
  const hint = String(payload.hint || "").trim();
  const generationId = String(payload.generationId || "").trim();
  const variation = String(payload.variation || "").trim();
  const referenceSummary = imageRefs.length
    ? imageRefs.map((url, index) => `${index + 1}. ${commerceRoleLabel(imageRoles[index])}`).join("\n")
    : "暂无参考图";
  const content = [
    {
      type: "text",
      text: [
        "请先识别商品类别、主体结构、材质、颜色、可见功能和视觉特色，再为它生成一段可直接用于图像生成模型的单张电商海报提示词。",
        "参考图顺序与角色如下：",
        referenceSummary,
        "第一张商品图是必须保持一致的主体；模特图只用于人物特征和展示方式；场景图只用于环境、光线和氛围。",
        "请从图片可见证据和用户补充中提炼 3-5 条核心卖点，并把它们压缩进同一张海报的一个清晰主视觉中，用材质细节、功能动作、模特姿态或场景氛围表达卖点。",
        "卖点介绍必须在同一张海报里体现：一个明确的核心卖点方向，以及最多三个简短卖点标签；优先使用图片中可见的事实，不要把卖点拆成多个画面。",
        "提示词只规划一张完整电商海报：一个商品主视觉、一个统一场景、一个构图、适度留白和可放置少量标题的位置。",
        "采用单一画面，不要多屏、不要多张海报、不要详情页分屏、不要把多个场景硬塞在一起。",
        "严禁输出画面一、画面二、画面三、镜头一、镜头二、镜头三、模块一、模块二等结构；不要输出分镜脚本、镜头列表、九宫格或拼贴方案。",
        "不要九宫格、不要拥挤拼贴、不要重复商品、不要复杂背景；商品主体要大而清晰，使用高级商业摄影光线、真实材质、干净背景和足够留白。",
        "不要生成小字、长段文案、乱码或难以辨认的标签；卖点标签必须短而克制，优先用产品特写、场景动作和版式留白来表达。",
        "只使用安全、普通、适合电商的内容；不要扩写成人、未成年人、暴力、武器、毒品、危险行为、医疗功效、政治或其他敏感主题；无法确认时使用中性商品摄影描述。",
        "保留商品外形、材质、颜色、标识和关键细节；商品始终是视觉主体；避免改变商品、添加无关品牌文字或水印。",
        "无法从图片或用户补充中确认的参数、功效、认证、尺寸、成分和品牌信息不得臆造；不确定时使用中性视觉描述。",
        generationId ? `这是一次独立的第 ${generationId} 轮创作，即使参考图相同，也必须重新组织表达，不能复用上一轮提示词。` : "这是一次新的独立创作，请重新组织表达。",
        variation ? `本轮优先采用这个创意方向，但仍然只输出一张海报：${variation}` : "本轮请主动改变构图、光线或场景表达，保持产品主体一致。",
        hint ? `用户补充卖点或要求：${hint}` : "用户未提供额外要求，请根据参考图提炼合适的商业视觉方向。",
        "只返回一段完整、具体、可执行的单张海报图像生成提示词；输出必须是一段可直接复制的单屏图像提示词，不要解释识别过程，不要加 Markdown 标题、列表或分段。"
      ].join("\n")
    }
  ];
  imageRefs.forEach((url, index) => {
    content.push({ type: "text", text: `这是第 ${index + 1} 张${commerceRoleLabel(imageRoles[index])}：` });
    content.push({ type: "image_url", image_url: { url } });
  });

  const body = {
    model: payload.model || "agnes-2.0-flash",
    messages: [
      {
        role: "system",
        content: "你是电商海报视觉策划和多模态图像提示词专家。你必须基于图片证据提炼产品卖点和特色，输出一张单屏电商海报的准确、具体、可执行提示词；禁止编造不可见的产品参数或营销承诺。"
      },
      { role: "user", content }
    ],
    temperature: 0.78,
    max_tokens: 900
  };
  const data = await fetchJson(`${AGNES_V1}/chat/completions`, {
    method: "POST",
    headers: agnesHeaders(apiKey),
    body: JSON.stringify(body)
  });
  sendJson(res, 200, { ok: true, provider: "agnes", request: body, response: data });
}

async function handleAgnesVideo(req, res) {
  const payload = await parseBody(req);
  const apiKey = requireApiKey(payload);
  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    sendJson(res, 400, { error: "Prompt is required." });
    return;
  }

  const imageRefs = Array.isArray(payload.imageRefs) ? payload.imageRefs.filter(Boolean) : [];
  const body = compactObject({
    model: payload.model || "agnes-video-v2.0",
    prompt,
    image: imageRefs.length === 1 ? imageRefs[0] : undefined,
    width: Number(payload.width || 1152),
    height: Number(payload.height || 768),
    num_frames: Number(payload.num_frames || 121),
    frame_rate: Number(payload.frame_rate || 24),
    negative_prompt: payload.negative_prompt || undefined,
    generate_audio: typeof payload.generate_audio === "boolean" ? payload.generate_audio : undefined,
    extra_body: imageRefs.length > 1 ? { image: imageRefs, mode: "keyframes" } : undefined
  });

  const data = await fetchJson(`${AGNES_V1}/videos`, {
    method: "POST",
    headers: agnesHeaders(apiKey),
    body: JSON.stringify(body)
  });
  sendJson(res, 200, { ok: true, provider: "agnes", request: body, response: data });
}

async function handleAgnesVideoResult(req, res) {
  const payload = await parseBody(req);
  const apiKey = requireApiKey(payload);
  const videoId = String(payload.video_id || "").trim();
  const taskId = String(payload.task_id || payload.id || "").trim();
  if (!videoId && !taskId) {
    sendJson(res, 400, { error: "video_id or task_id is required." });
    return;
  }

  const url = videoId
    ? `${AGNES_BASE}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(payload.model || "agnes-video-v2.0")}`
    : `${AGNES_V1}/videos/${encodeURIComponent(taskId)}`;
  const data = await fetchJson(url, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` }
  }, 120000);
  sendJson(res, 200, { ok: true, provider: "agnes", response: data });
}

function applyTemplate(value, vars) {
  if (typeof value === "string") {
    const exact = value.match(/^\{\{\s*(\w+)\s*\}\}$/);
    if (exact && Object.prototype.hasOwnProperty.call(vars, exact[1])) return vars[exact[1]];
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] == null ? "" : String(vars[key]));
  }
  if (Array.isArray(value)) {
    return value.map(item => applyTemplate(item, vars));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = applyTemplate(item, vars);
    }
    return out;
  }
  return value;
}

async function handleCustom(req, res) {
  const payload = await parseBody(req);
  const apiKey = String(payload.apiKey || "").trim();
  const endpoint = String(payload.endpoint || "").trim();
  if (!endpoint || !/^https?:\/\//i.test(endpoint)) {
    sendJson(res, 400, { error: "A valid custom endpoint is required." });
    return;
  }
  const method = String(payload.method || "POST").toUpperCase();
  const headers = { "Content-Type": "application/json", ...(payload.headers || {}) };
  if (apiKey && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const vars = {
    prompt: payload.prompt || "",
    model: payload.model || "",
    size: payload.size || "",
    imageUrl: payload.imageUrl || "",
    imageRefs: Array.isArray(payload.imageRefs) ? payload.imageRefs : [],
    imageRoles: Array.isArray(payload.imageRoles) ? payload.imageRoles : [],
    videoUrl: payload.videoUrl || ""
  };
  const bodyObject = typeof payload.bodyTemplate === "object" && payload.bodyTemplate
    ? applyTemplate(payload.bodyTemplate, vars)
    : payload.body || {};

  const data = await fetchJson(endpoint, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(bodyObject)
  });
  sendJson(res, 200, { ok: true, provider: "custom", response: data });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const target = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!target.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden", { "content-type": "text/plain; charset=utf-8" });
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
      return;
    }
    const ext = path.extname(target).toLowerCase();
    send(res, 200, data, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
  });
}

async function route(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/healthz") {
      sendJson(res, 200, { status: "ok" });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/agnes/image") {
      await handleAgnesImage(req, res);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/agnes/prompt") {
      await handleAgnesPrompt(req, res);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/agnes/video") {
      await handleAgnesVideo(req, res);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/agnes/video-result") {
      await handleAgnesVideoResult(req, res);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/custom") {
      await handleCustom(req, res);
      return;
    }
    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }
    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    const status = error.status || 500;
    sendJson(res, status, {
      error: error.message || "Internal server error.",
      details: error.payload || null
    });
  }
}

http.createServer(route).listen(PORT, () => {
  console.log(`Local AI Canvas running at http://localhost:${PORT}`);
});
