# dsh-statusbar-config — Session / Window 双统计版

[English](README.en.md) · [原仓库 MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

基于原项目的 Fork，使用 DSH 官方 `conversation.composer.dock` / `usage` Slot 修改**输入框底部累计用量**，不改原生 `activity`（轮数、步数、速度）；Turn 结尾的用量胶囊改成同一套 `缓存读取/未缓存输入/输出` 紧凑格式，位置、图标、点击弹窗与窄屏收起行为保持原生。

默认显示（按是否发生过成功压缩自动切换）：

```text
未压缩：70M/1M/130K
已压缩：Session: 70M/1M/130K | Window: 10M/200K/30K
```

**固定顺序**：缓存读取 / 未缓存输入 / 模型输出。数字为示意值；未压缩时只展示整个 Session 三项计数，压缩成功后才显示 Session 和 Window 双区间。

- **Session**：完整 Session Log 的累计模型调用 Token，直接使用 DSH 的 `tokenUsage`。
- **Window**：最近一次**成功完成上下文压缩**以后所有 Turn 和调用的累计 Token。它不是最近一个 Turn，也不是当前上下文实际存活 Token 数量。
- 压缩失败、中断及仅开始压缩不会清零。Window 在尚未发生压缩时从 Session 开始累计；每次成功的 `compaction/end` 会开启新窗口。
- Window 计数以 `statusbarWindowUsage` Host Session Projection 计算，复用 DSH 官方流式样本覆盖、重试另计的会话日志语义。历史会话可重新回放，并由投影服务维护检查点。
- 压缩专用的摘要 LLM 调用不会计入 Window（官方 Session `tokenUsage` 也不计入）。

## 安装

```bash
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

如果使用 `web` profile，把 `desktop` 改成 `web`。从 GitHub 安装会读取预构建的 `lib/`。安装后重启 DSH，使 Host Projection 注册生效。

## 自定义模板

**设置 → 插件 → 状态栏模板**。默认：

```text
Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}
```

| 变量 | 含义 |
|---|---|
| `${cacheRead}` / `${uncachedInput}` / `${output}` | Session：缓存读取 / 未缓存输入 / 输出 |
| `${windowCacheRead}` / `${windowUncachedInput}` / `${windowOutput}` | Window：上述三类累计 |
| `${cacheWrite}` / `${windowCacheWrite}` | 两个周期内的缓存写入 |
| `${input}` / `${total}` | Session 所有输入 / 全部 Token 合计 |
| `${windowTotal}` | Window 全部 Token 合计 |
| `${cache}` | Session 缓存命中率 |
| `${turns}` / `${steps}` / `${ttft}` / `${tps}` | 会话轮数、步数、首 Token 时间、生成速度 |

原默认模板（`↩ 缓存读取 · ↑ 输入 · ↓ 输出`）自动迁移为双统计显示；其他自定义模板保持不变。Window 投影尚未可用时显示 `—`，**不使用 Session 数据冒充 Window**。

点击 Token 用量按钮可查看 Session 和 Window 的精确整数统计，含非零缓存写入。弹窗中的 Window 标题为“当前窗口用量”；它仍表示**本次成功压缩以来的累计计费量**，不等于右侧 ContextMeter 的即时上下文占用量。

## 上下文占用

右侧原生 ContextMeter 的可见百分比仍按之前版本替换为 `已用 / 容量`，保留官方圆环、Tooltip 与弹窗。它来自 `contextPressure`，**与 Window 的累计计费量不同**。因 DSH 暂无专用 ContextMeter Slot，仍采用局部 CSS 适配。

## Turn 用量

每个 Turn 结尾的用量胶囊显示本轮自己的三项计数，顺序与输入框下方一致：

```text
9.2M/96.1K/56.1K
```

- 始终生效，没有独立开关。数据库图标、悬停底色、点击打开的官方「本轮用量」明细弹窗（含精确整数、缓存命中率、提供方/模型）以及 <480px 窄屏只留图标的行为全部沿用原生。
- 固定使用紧凑三项格式，不读取上面的自定义模板。
- 数据取该 Turn 的 `turn-tail` 节点 `tokenUsage`（缓存读取 / 未缓存输入 / 输出），不重新计算计费。
- 若提供方从未上报缓存读取，胶囊保留原生 `用量 x tok`，不伪造 `0`。
- 实现说明：dsh 0.2.1 没有 per-Turn 用量 Slot，原生胶囊硬编码在 `TurnTailNodeView` 内。插件注册一个**渲染为空**的 `conversation.chat.turnTail` 条目，把本轮数值写到 Turn 尾巴根节点，再用局部 CSS 隐藏原生文案并显示三项计数。替换整体 `turn-tail` 渲染器（`shadows-shipped-ui`）会连带重写复制/分支/反馈/时钟，因此不采用。

## 压缩标记

上下文压缩完成后，对话里的压缩标记原本显示被替换历史的估算体积：

```text
compact · 已压缩 709 条历史记录（约 413235 tokens）
```

现在改为这次摘要调用自己的用量：

```text
compact · 173K→2.4K tokens
```

- 箭头左边是**所有输入之和**（未缓存输入 + 缓存读取 + 缓存写入），右边是摘要输出 Token，单位与输入框下方一致（K/M）。
- 数据来自 `compaction/summary` 事件的 `usage`。官方 Chat 节点只保留被替换历史的条数与估算 Token，会丢掉这个字段，因此由 `statusbarCompactionUsage` Host Projection 保留，并按标记上仍打印的「条数 / 估算 Token」两项与对应记录匹配。
- 只替换那一行摘要文字：上下文图标、悬停才出现的展开箭头、可展开的 Markdown 摘要、吸顶标题全部沿用官方实现。
- 摘要调用没有上报用量，或标记显示的是兜底文案时，保持官方原文。
- 标记也可能在投影到达**之后**才挂载（恢复会话、往回滚动加载历史、行被重建）。因此插件监听对话区的 DOM 变化，而不是在固定的一次/300ms 后补一遍：晚挂载的行一出现就打标记，连「先建行、稍后才填入文字」的情况也能补上。
- 摘要调用本来就不计入 Session `tokenUsage` 和 Window 区间；这里只是把它显示在标记上，不改变任何累计值。

## 压缩后的操作行

配合 [`@local/dsh-fork-after-compaction`](../dsh-fork-after-compaction) 时，每条压缩标记下方的操作行也由本插件统一格式：

- 行动作复刻官方 Turn 结尾那一行（复制 / 分支 / 用量 / 时间，不带点赞点踩），分支按钮从这次压缩结束处 fork。
- 行用自己的数据库图标与「缓存读取 / 未缓存输入 / 输出」三个计数；本插件读取该行公布的三个原始计数，用与 Turn 胶囊完全相同的格式化函数改写文案，因此两处永远一致。
- 集成契约：操作行在用量元素上带 `data-dfac-usage` 与 `data-dfac-cache-read` / `data-dfac-uncached-input` / `data-dfac-output`，并在挂载时向 `document` 冒泡派发 `dsh-fork-row-usage` 事件；本插件在挂载时扫描一次并监听该事件。未安装本插件时该行显示自己的兜底文案，不影响分叉。
- 只替换文案：数据库图标、窄屏只留图标的行为仍由操作行负责。


## 开发与验证

```bash
pnpm install --frozen-lockfile
pnpm check
```

`lib/` 是随仓库提交的预构建 Host 和 Client 入口，安装时无需执行构建。源码位于 `src/`；更新源码后需同步更新产物。详见 [SESSION_FOOTER.md](SESSION_FOOTER.md)。

配置页表单由 dsh 的 settings 服务从 Host `Config` schema 投影而来，只有标了 `.volatile()` 的字段才会出现在 `settings/describe` 里；漏标时整个 namespace 不可用，插件页的模板编辑器会显示“状态栏设置命名空间不可用”并禁用全部控件。保存的值写入 profile 的 `cordis.patch.yml`，Loader 随即以新 config 重新施加本插件。

原作者 MannixHu，原项目使用 MIT 许可证；Fork 保留其许可与署名。
