const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;
const SERVER_PATH = path.join(ROOT, "server.js");
const RUNTIME_PATH = path.join(ROOT, ".banana-canvas.runtime.json");
const DEFAULT_PORT = Number(process.env.PORT || 5337);
const MAX_PORT_ATTEMPTS = 40;
const STARTUP_TIMEOUT_MS = 15000;

function log(message) {
  process.stdout.write(`[Banana Canvas] ${message}\n`);
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 18) return true;
  log(`检测到 Node.js ${process.versions.node}，项目要求 Node.js 18 或更高版本。`);
  log("请升级 Node.js 后重新启动：https://nodejs.org/en/download/");
  return false;
}

function probePort(port) {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.once("error", error => resolve({ available: false, error }));
    probe.listen({ host: "0.0.0.0", port, exclusive: true }, () => {
      probe.close(error => resolve({ available: !error, error }));
    });
  });
}

function checkHealth(port, timeoutMs = 700) {
  return new Promise(resolve => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/healthz", timeout: timeoutMs }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        try {
          const result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          resolve(response.statusCode === 200 && result.service === "banana-canvas");
        } catch {
          resolve(false);
        }
      });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

async function findExistingInstance() {
  try {
    const runtime = JSON.parse(fs.readFileSync(RUNTIME_PATH, "utf8"));
    if (Number.isInteger(runtime.port) && await checkHealth(runtime.port)) return runtime.port;
  } catch {}
  return null;
}

function waitForHealth(child, port) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = error => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      child.removeListener("exit", onExit);
      child.removeListener("error", onError);
      if (error) reject(error);
      else resolve();
    };
    const timeout = setTimeout(() => finish(new Error("启动超时：15 秒内健康检查没有通过。")), STARTUP_TIMEOUT_MS);
    const onExit = (code, signal) => finish(new Error(`服务进程提前退出（${signal || `exit code ${code}`}）。`));
    const onError = error => finish(error);
    child.once("exit", onExit);
    child.once("error", onError);

    const poll = async () => {
      if (finished) return;
      if (await checkHealth(port)) {
        finish();
        return;
      }
      setTimeout(poll, 300);
    };
    poll();
  });
}

function openBrowser(url) {
  const platform = process.platform;
  let command;
  let args;
  if (platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/c", "start", "", url];
  } else if (platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const browser = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  browser.once("error", error => log(`无法自动打开浏览器（${error.message}）。请手动访问：${url}`));
  browser.unref();
}

function writeRuntimeFile(port) {
  const runtime = {
    pid: process.pid,
    port,
    launcher: path.resolve(__filename),
    startedAt: new Date().toISOString()
  };
  fs.writeFileSync(RUNTIME_PATH, `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
}

function removeRuntimeFile() {
  try {
    const runtime = JSON.parse(fs.readFileSync(RUNTIME_PATH, "utf8"));
    if (runtime.pid === process.pid) fs.unlinkSync(RUNTIME_PATH);
  } catch {}
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER_PATH], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port) },
      stdio: ["inherit", "pipe", "pipe"]
    });
    let output = "";
    let settled = false;
    const mirror = chunk => {
      const value = chunk.toString();
      output = `${output}${value}`.slice(-12000);
      process.stdout.write(value);
    };
    child.stdout.on("data", mirror);
    child.stderr.on("data", mirror);
    child.once("error", error => {
      settled = true;
      reject({ error, output });
    });

    waitForHealth(child, port).then(() => {
      if (settled) return;
      settled = true;
      resolve(child);
    }).catch(error => {
      if (settled) return;
      settled = true;
      const rejectAfterExit = () => reject({ error, output });
      if (child.exitCode !== null || child.signalCode !== null) {
        rejectAfterExit();
      } else {
        child.once("exit", rejectAfterExit);
        child.kill("SIGTERM");
        setTimeout(() => child.kill("SIGKILL"), 1200).unref();
      }
    });
  });
}

async function main() {
  if (!checkNodeVersion()) {
    process.exitCode = 1;
    return;
  }
  if (!Number.isInteger(DEFAULT_PORT) || DEFAULT_PORT < 1 || DEFAULT_PORT > 65535) {
    log(`PORT 的值无效：${process.env.PORT}`);
    log("请将 PORT 设置为 1 到 65535 之间的整数，或删除该环境变量使用默认端口 5337。");
    process.exitCode = 1;
    return;
  }

  const existingPort = await findExistingInstance();
  if (existingPort) {
    const url = `http://localhost:${existingPort}/?startup=${Date.now()}`;
    log(`检测到已运行的实例，复用端口 ${existingPort}。`);
    if (process.env.BANANA_OPEN_BROWSER === "1") openBrowser(url);
    log(`服务地址：http://localhost:${existingPort}/`);
    return;
  }

  const unavailable = [];
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = DEFAULT_PORT + offset;
    if (port > 65535) break;
    const probe = await probePort(port);
    if (!probe.available) {
      unavailable.push({ port, code: probe.error?.code || "PORT_UNAVAILABLE" });
      continue;
    }

    try {
      const child = await startServer(port);
      try {
        writeRuntimeFile(port);
      } catch (error) {
        log(`无法写入启动状态文件（${error.message}）；服务可用，但请用启动窗口的 Ctrl+C 退出。`);
      }
      const url = `http://localhost:${port}/?startup=${Date.now()}`;
      log(`健康检查通过，服务已就绪：http://localhost:${port}/`);
      if (process.env.BANANA_OPEN_BROWSER === "1") openBrowser(url);

      const stop = signal => child.kill(signal === "SIGINT" ? "SIGINT" : "SIGTERM");
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      process.once("SIGHUP", stop);
      child.once("exit", (code, signal) => {
        removeRuntimeFile();
        process.exitCode = code || (signal ? 1 : 0);
      });
      return;
    } catch (result) {
      const details = `${result.output || ""} ${result.error?.message || ""}`;
      if (/EADDRINUSE|EACCES/i.test(details)) {
        unavailable.push({ port, code: /EACCES/i.test(details) ? "EACCES" : "EADDRINUSE" });
        continue;
      }
      log(`服务启动失败：${result.error?.message || "未知错误"}`);
      log("请查看上方 Node 服务日志；确认项目文件完整，并检查安全软件是否拦截本地服务。");
      process.exitCode = 1;
      return;
    }
  }

  const summary = unavailable.slice(0, 8).map(item => `${item.port} (${item.code})`).join(", ");
  log(`连续检查 ${unavailable.length} 个端口后仍无法启动。尝试过：${summary || "无可用端口"}${unavailable.length > 8 ? " 等" : ""}`);
  if (unavailable.some(item => item.code === "EACCES")) {
    log("部分端口被 Windows 或安全软件保留/禁止。请检查系统 TCP 排除端口范围，或设置 PORT 为其他可用端口后重试。");
  } else {
    log("请关闭占用这些端口的程序，或设置 PORT 为其他可用端口后重试。");
  }
  process.exitCode = 1;
}

main().catch(error => {
  log(`启动器发生未处理错误：${error.message}`);
  process.exitCode = 1;
});
