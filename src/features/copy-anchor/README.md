# Copy Anchor

来自迁移时重新读取的独立 Copy Anchor 项目，包含切换后重新复制、上次复制快照和状态栏预览。

- `index.ts`：注册 `registerCopyAnchorFeature(context, logger)`，管理右侧模式、左侧复制预览、配置变化与串行切换队列。
- `commands.ts`：选区快照、原生复制回退、全选路径、上次复制内容与外部剪贴板覆盖检测。
- `core/contextText.ts`：路径/行号代码块、空行修剪和围栏保护，纯逻辑。
- `core/copyPreview.ts`：状态栏文本预览、路径缩短与 Unicode 截断，纯逻辑。

命令与设置使用 `contextKit.copyAnchor.*`。Ctrl+C / Cmd+C 绑定只在编辑器有选区时生效，双按 Ctrl+\ 或点击模式状态栏会切换模式并更新剪贴板内容。开关持久化与预览默认值沿用源项目。

全部状态栏、监听器、定时器和内存复制快照随模块释放；错误写入 Context Kit 共用日志通道。模块不依赖 JSON Explorer，两个模块仅通过 VS Code 文档与剪贴板自然配合。
