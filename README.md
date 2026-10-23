# dsh-statusbar-config — Session 状态栏定制版

[English](README.en.md) · [原仓库 MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

基于原项目的 Fork。通过 DSH 官方 `conversation.composer.dock` / `usage` Slot，仅替换**输入框底部 Session 累计用量**，保留原生轮数、步数、速度及每个 Turn 末尾的用量统计。

默认显示示意：`↩ 51.3M · ↓ 500K · ↑ 120K`（缓存读取、未缓存输入、模型输出）。

## 安装

```bash
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

如使用浏览器 Profile，将 `desktop` 改为 `web`。安装后重启对应 DSH。仓库内预置 `lib/`，无需在安装时构建。

## 配置

**设置 → 插件 → 状态栏模板**，默认模板：

```text
↩ ${cacheRead} · ↓ ${uncachedInput} · ↑ ${output}
```

| 变量 | 含义 |
|---|---|
| `${cacheRead}` | 缓存读取 Token |
| `${uncachedInput}` | 未缓存输入 Token |
| `${cacheWrite}` | 缓存写入 Token |
| `${output}` | 输出 Token（包含推理） |
| `${input}` | 所有输入，包括缓存读写 |
| `${total}` | 输入与输出总和 |
| `${cache}` | 缓存命中率（不带 %） |
| `${turns}` / `${steps}` | 会话轮数 / 步数 |
| `${ttft}` / `${tps}` | 首 Token 平均秒数 / 输出速度 |
| `${llm}` / `${tool}` | 模型 / 工具累计耗时 |

模板留空时显示会话累计 Token 和缓存命中率；未知变量保持原样。点击用量可查看精确 Token 分类。

## 上下文窗口

原生 `14%` 的可见文字改成类似 `38K / 200K`，根据 `contextPressure.projectedTokens`（或 `pressureTokens`）与 `contextWindow` 显示。**这是近似的当前上下文使用量，不是累计 Token 用量。** 保留官方圆环、弹窗、Tooltip 和无障碍百分比描述。

上下文组件目前缺少独立可替换的 Slot，因此本功能采用局部 CSS 适配，后续 DSH 更新可能需要调整。

## 开发与验证

```bash
pnpm install --frozen-lockfile
pnpm check
```

修改源码后需同步构建 `lib/` 才能通过 Git 安装。当前 Source Map 是合法空映射；重新构建可生成准确 Source Map。详见 [SESSION_FOOTER.md](SESSION_FOOTER.md)。

保留原作者 MannixHu 的 MIT 许可证与署名。
