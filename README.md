# Banana Canvas 本地 AI 无限画布

一个本地运行的 RunningHub 类 AI 资产构建画布。用户填写自己的 Agnes AI API Key 后，可以在无限画布中生成图片和视频资产。

> 如果这个项目对你有帮助，欢迎前往 [GitHub 仓库](https://github.com/Mr-banananana/Banana_canvas) 点个 Star，支持项目持续维护。

## 启动

```powershell
npm start
```

打开：

```text
http://localhost:5177
```

## 小白用户：下载后双击使用

Windows 用户不需要安装 npm，不需要 `npm install`，也不需要命令行：

1. 在 GitHub 点击 `Code > Download ZIP` 并解压。
2. 确认电脑安装了 Node.js 18 或更高版本；没有安装时，双击 `start.bat` 会自动打开官方安装页面。
3. 双击项目根目录的 `start.bat`。
4. 浏览器会自动打开 `http://localhost:5177/`，然后在右上角 `API 设置` 中填写自己的 Agnes API Key。

服务窗口需要保持打开；要停止服务，关闭名为 `Banana Canvas Server` 的窗口即可。PowerShell 用户也可以运行 `start.ps1`。

项目没有第三方 npm 依赖，下载并解压后即可启动。

### macOS 用户

1. 下载并解压 ZIP，确认电脑安装了 Node.js 18 或更高版本。
2. 双击 `start.command`。
3. 如果 macOS 阻止第一次打开，在文件上点击右键，选择“打开”；或者在终端执行：

   ```bash
   chmod +x start.command start.sh
   ./start.command
   ```

终端会自动启动服务并打开浏览器。关闭该终端窗口即可停止服务。


## Agnes 默认接入

- Agnes AI 官网：[https://www.agnes-ai.com/](https://www.agnes-ai.com/)
- Base URL: `https://apihub.agnes-ai.com/v1`
- 图片生成: `POST /v1/images/generations`
- 默认图片模型: `agnes-image-2.1-flash`
- 自动提示词模型: `agnes-2.0-flash`，请求 `POST /v1/chat/completions`
- 视频生成: `POST /v1/videos`
- 默认视频模型: `agnes-video-v2.0`
- 视频轮询: `GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>`
- 默认轮询间隔: 12 秒；


## 当前功能

- 深色点阵无限画布，香蕉黄/绿色视觉主题。
- 节点平移、画布拖拽、滚轮上下平移；缩放使用左下角按钮、`Ctrl +/-` 或 `Ctrl + 鼠标滚轮`。Ctrl+滚轮会以鼠标位置为缩放中心。
- 节点输入/输出端口连线。
- 文本、图片生成、视频生成、上传资产卡。
- RunningHub 风格操作说明弹窗与画布右键菜单。
- 图片文生图、图生图、多参考图生成。
- 视频文生视频、图生视频、多关键帧视频生成。
- Agnes 视频异步任务轮询。
- 画布 JSON 导入/导出，包含节点和连线。
- 画布 JSON 导入/导出包含节点分组和命名快照。
- 节点分组、依赖关系感知自动布局、小地图和节点搜索。
- 画布操作历史、撤销/重做和本地快照恢复。
- 自定义 API 高级配置。
- 电商宣传图内置工作流，支持商品图、模特图和场景图作为角色化参考输入。
- 电商工作台支持 Agnes 多模态自动写提示词或手动提示词两种模式。自动模式会识别产品并提炼卖点、特色和使用场景，生成一张单屏电商海报提示词；结果会回填并允许编辑，不可确认的参数不会由模型臆造。
- Agnes Image 2.1 使用标准 `1K/2K/4K + ratio` 请求，电商宣传图默认使用 `2K + 3:4`，并以单张清晰主视觉表达卖点，禁止多屏、九宫格和不可读小字。

## 不包含

- 剪辑器。
- 导演台。
- 多用户协作。
- 云端账号或项目管理。

电商宣传图工作流只在当前浏览器中读取和保存图片 Data URL，`server.js` 不会永久保存用户上传图片；生成请求仍会发送到用户在 API 设置中选择的 Agnes 或自定义 API。

