# Context Kit

整理结构化内容，复制精准上下文。

JSON Explorer 已迁入，提供原 Better JSON Explorer 的 JSON 处理与预览能力。Copy Anchor 当前仍为预留模块，尚未启用上下文复制。

## JSON Explorer

- 在 plaintext 中粘贴完整 JSON 或 JSON 字符串，自动识别、切换为 JSON 并格式化。
- **Ctrl+;**（macOS：**Cmd+;**）切换 JSON 与 JSON 字符串。
- Python repr 或字符串内含真实换行的 JSON，默认显示转换 CodeLens；点击或使用上述快捷键修复并转换。
- JSON/JSONC 字符串值支持 Hover：嵌套 JSON、Python dict、Markdown 和纯文本分别预览。
- Hover 链接与 CodeLens 可在侧栏打开完整内容，支持多次打开与递归解析。超长 Hover 截断预览，侧栏内容保持完整。

配置项默认均为 `false`，修改后即时生效：

| 配置                                                  | 开启后的行为                |
| ----------------------------------------------------- | --------------------------- |
| `contextKit.jsonExplorer.pythonRepr.autoConvert`      | 粘贴 Python repr 时自动转换 |
| `contextKit.jsonExplorer.lineBreakRepair.autoConvert` | 粘贴时自动修复字符串内换行  |

粘贴自动识别沿用原项目的文档整体替换检测，并非系统剪贴板监听。JSONC 可用于结构预览；JSON ⇄ 字符串切换要求内容可按严格 JSON 解析。

命令面板搜索 **Context Kit: JSON Explorer**。对应命令 ID：

- `contextKit.jsonExplorer.toggleCurrentDocument`
- `contextKit.jsonExplorer.convertToJsonInPlace`
- `contextKit.jsonExplorer.parseNestedJson`（由 CodeLens 传入内容）

完整用法、演示 GIF、Python 支持范围及示例见源码中的 `docs/json-explorer.md`。

## 从 Better JSON Explorer 迁移

先禁用旧扩展，再启用 Context Kit，避免两份粘贴监听器、Hover 和 CodeLens 同时运行。旧项目的命令前缀 `better-json-explorer.` 改为 `contextKit.jsonExplorer.`；设置前缀 `betterJsonExplorer.` 同样改为 `contextKit.jsonExplorer.`。

默认快捷键保持不变。自定义快捷键与已有设置需要手动修改前缀；本项目不会自动写入旧设置。当前扩展 ID 为 `zekeChin.context-kit`，不是旧扩展的自动升级包。

## 项目结构

```text
context-kit/
├── src/
│   ├── extension.ts
│   ├── features/
│   │   ├── json-explorer/
│   │   │   ├── core/          # 纯解析与文本算法
│   │   │   ├── providers/     # Hover、CodeLens
│   │   │   ├── index.ts       # 注册与生命周期
│   │   │   └── ...            # 命令、配置与编辑器适配
│   │   └── copy-anchor/       # 待迁移
│   └── shared/               # 共用日志
├── tests/
│   ├── unit/json-explorer/   # Bun 回归测试
│   └── integration/          # VS Code 扩展宿主测试
├── scripts/                  # 测试构建与启动
├── docs/                     # 架构与功能文档
├── .vscode/                  # F5 调试
├── .github/workflows/ci.yml
├── bun.lock
└── package.json
```

## 开发

Bun 1.4.2、TypeScript 7.0.2、Oxlint、Oxfmt。Node.js 22+ 用于打包和扩展宿主测试工具；所有依赖与脚本通过 Bun 管理。

```sh
bun install --frozen-lockfile
bun run check              # TS7 类型检查、Lint、格式检查、单测
bun run compile            # TS7 检查 + Bun bundle
bun run watch              # 增量 bundle（类型检查单独运行）
bun run format
bun run test:integration
bun run package
```

按 F5 启动扩展开发窗口。无桌面 Linux 使用 `xvfb-run -a bun run test:integration`。测试默认使用官方 VS Code 1.105.0，也可通过 `VSCODE_EXECUTABLE_PATH` 指定本机编辑器。

Bun 将 `jsonc-parser` 一起打入 `out/extension.js`，仅将 `vscode` 留给宿主提供；插件运行不需要安装 Bun。TS7 检查源代码和测试，测试配置单独跳过第三方声明文件检查。

生成的 `context-kit-0.1.0.vsix` 可在扩展面板选择「从 VSIX 安装」。当前未发布 Marketplace，未创建远端仓库。架构说明见 `docs/architecture.md`。

## License

MIT。保留 Better JSON Explorer 的版权声明，打包依赖的许可见 `THIRD_PARTY_NOTICES.md`。
