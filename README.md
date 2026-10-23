# dsh-statusbar-config — Session / Window 双统计版

[English](README.en.md) · [原仓库 MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

基于原项目的 Fork，使用 DSH 官方 `conversation.composer.dock` / `usage` Slot 修改**输入框底部累计用量**，不改原生 `activity`（轮数、步数、速度），也不修改每个 Turn 结尾的用量按钮。

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

## 开发与验证

```bash
pnpm install --frozen-lockfile
pnpm check
```

`lib/` 是随仓库提交的预构建 Host 和 Client 入口，安装时无需执行构建。源码位于 `src/`；更新源码后需同步更新产物。详见 [SESSION_FOOTER.md](SESSION_FOOTER.md)。

原作者 MannixHu，原项目使用 MIT 许可证；Fork 保留其许可与署名。
