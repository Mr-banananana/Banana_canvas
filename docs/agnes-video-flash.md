# Agnes Video 2.5 Flash 接入说明

核对日期：2026-10-21。依据 [Agnes 官方中文文档](https://wiki.agnes-ai.com/zh-Hans/docs/agnes-video-25-flash)。

## 当前内置生成方式

内置 Agnes 视频生成仅使用 `agnes-video-2.5-flash`。标准 `agnes-video-2.5` 收费版已移除生成入口；本地创建接口遇到该模型会在发送上游前返回 400。

| 项目 | 本项目请求 |
| --- | --- |
| 创建 | `POST /v1/videos`，JSON，Bearer 鉴权 |
| 查询 | `GET /agnesapi?video_id=…&model_name=…`，使用创建任务时的站点和模型 |
| 模型 | `agnes-video-2.5-flash` |
| 时长 | `seconds` 为字符串 `"4"`–`"12"` |
| 分辨率 | `size` 固定为 `"720P"` |
| 比例 | `21:9`、`16:9`、`4:3`、`1:1`、`3:4`、`9:16` |
| 数量 | `n=1` |
| 无参考图 | `mode=text`，不携带媒体字段 |
| 单张参考图 | `mode=keyframe`，通过 `first_frame` 传入图片 URL |
| 多张参考图 | `mode=reference`，通过 `images` 传入，最多 5 张 |

所有参考图都需要 Agnes 服务能访问的公网 HTTP(S) URL。本地文件和 Base64 不会自动上传到第三方。帧率和音轨由模型决定；不发送旧版的 `width`、`height`、`num_frames`、`frame_rate`、`generate_audio` 或 `quality`。

官方还提供尾帧控制和音频参考；当前界面接入范围为上表列出的文生视频、首帧图生视频及多图参考。Flash 不支持视频参考输入。

## 任务状态与错误对象

以公共 `status` 和 `progress` 为准，不使用 `internal_status` 或 `internal_progress` 判断结束。只有 `status=completed` 时才将 URL 交付为结果；queued/in_progress 即使带 URL 也继续查询。

官方失败任务示例包含 `object=video`、任务标识、`status=failed` 和 `error.message`。在 HTTP 200 的查询响应中，这是任务已经结束的状态，应显示原因并清除本地待查询任务；不同于 HTTP 5xx 的临时接口故障，后者保留任务用于继续查询。HTTP 200 的普通错误封套仍被识别为错误。

标准版文档中的 Python SDK `extra_body` 会合并进最终请求 JSON 的顶层；当前项目直接构造 HTTP JSON，`mode`、`aspect_ratio`、`first_frame`、`images` 已放在顶层，不能再额外嵌套一层 `extra_body`。

## 升级与价格

旧设置及尚无任务的节点迁移至 Flash；已有任务的模型、站点和 ID 会保留用于查询。自定义服务可以填写自己的模型。

官方文档在核对时标明 Flash 限时免费，不代表永久免费。实际价格、额度和模型可用性以服务商当时的公告为准。

## 持续提示队列满

文档当前仍使用上述创建地址和参数。本次排查用两枚获用户授权的密钥直接调用官方示例，均返回 `503 video_queue_full`、`data=null`，未取得任务 ID。经本地接口提交也返回相同错误。

这证明该拒绝可绕过本地程序复现，不能靠更换请求字段或本地倒计时解除。倒计时只是安排下一次尝试，并没有取得上游排队位置；账号在途任务、额度或通道容量的具体原因需服务商结合请求编号核查。不要向客服提供完整密钥。

用量页的视频秒数为 0 只说明该页没有记录视频用量，不能作为视频剩余额度或在途任务列表。用户确认两枚测试密钥来自同一账号，不能把更换密钥当作独立账号的对照。
