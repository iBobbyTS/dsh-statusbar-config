# dsh-statusbar-config

[English](README.en.md) · [上游 MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

本 fork 用缓存读取 / 未缓存输入 / 输出三个计数显示 DSH 用量，保留原生按钮、图标和明细弹窗。

- 未压缩时显示 Session 累计；成功压缩后同时显示 Session 和本次压缩以来的 Window 累计。
- Turn 尾部显示本轮计数；压缩标记可显示摘要调用自己的输入与输出。
- ContextMeter 显示已用 / 容量，与 Window 的累计计费量不同。
- 缺少必要数据或压缩记录无法唯一匹配时保留原生显示。装饰仅作用于所属对话。

## 安装

安装本 fork：

```sh
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

Desktop 应先启动一次、完全退出后使用应用自带 CLI；网页 profile 使用 `--profile web`。安装或更新后重启目标 Host 并刷新客户端。仓库提供预构建 `lib/`，安装无需构建。

## 使用与文档

在 **设置 → 插件 → 状态栏模板** 编辑模板。默认顺序为缓存读取 / 未缓存输入 / 输出；点击用量按钮查看精确数值。Window 表示压缩以来的累计计费量，不是即时上下文占用。

[详细文档](docs/usage.md) 包含模板变量、计量口径、数据降级、压缩标记、跨插件集成和开发命令。本次源码与自动化核对目标为 DSH `0.2.2-rc.1`，未替代真实 Desktop UI 验收。

原作者 MannixHu；保留原项目 MIT 许可与署名。
