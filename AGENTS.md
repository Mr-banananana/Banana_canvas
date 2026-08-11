# Banana Canvas Agent Context

## 项目定位

Banana Canvas 是一个免费开源、本地优先的 AI 无限画布。用户通过节点、输入输出端口和连线组织图片、视频与文本资产，并使用自己的 Agnes 或自定义多模态 API 生成内容。

它不是云端协作平台，也不是完整的视频剪辑器、导演台、专业合成软件或 3D/音频工具。

## 本地运行

```powershell
npm start
```

浏览器访问 `http://localhost:5177/`。项目要求 Node.js 18 或更高版本，没有第三方 npm 依赖。Windows 使用 `start.bat`，macOS 使用 `start.command`。

## 关键文件

- `server.js`: 本地静态服务和 API 代理。
- `public/index.html`: 页面结构。
- `public/app.js`: 画布、节点和工作台交互。
- `public/canvas-engine.js`: 画布状态和节点关系逻辑。
- `public/styles.css`: 页面样式。
- `work/`: 本地测试和回归脚本。

## 修改约束

- 不要提交任何真实 API Key、用户图片或生成结果。
- 修改后优先运行 `npm run check` 和 `npm test`。
- 保持 Windows 和 macOS 的本地启动方式可用。
- 新功能必须说明是否依赖外部 API，不能把未实现的功能写入 README 或项目描述。
