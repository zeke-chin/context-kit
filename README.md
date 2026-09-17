# Context Kit

整理结构化内容，复制精准上下文。

整合 JSON Explorer 的结构化内容处理与 Copy Anchor 的上下文复制能力。

## 功能与配置

| 功能          | 用途                                         | 完整用法、字段说明与 JSON 示例                                 |
| ------------- | -------------------------------------------- | -------------------------------------------------------------- |
| JSON Explorer | JSON 识别、转换、输入修复、Hover 与 CodeLens | [JSON Explorer 配置文档](src/features/json-explorer/README.md) |
| Copy Anchor   | 路径/行号复制、模式切换、复制预览            | [Copy Anchor 配置文档](src/features/copy-anchor/README.md)     |

两个模块都有独立的 `enabled` **总开关**，默认开启，修改后即时生效。Copy Anchor 的 `contextMode` 单独控制上下文/普通复制模式。

配置写入用户 `settings.json` 或项目 `.vscode/settings.json`；工作区设置优先。完整默认配置如下，可合并到现有设置对象：

```json
{
  "contextKit.jsonExplorer.enabled": true,
  "contextKit.jsonExplorer.pythonRepr.autoConvert": false,
  "contextKit.jsonExplorer.lineBreakRepair.autoConvert": false,
  "contextKit.copyAnchor.enabled": true,
  "contextKit.copyAnchor.contextMode": true,
  "contextKit.copyAnchor.previewMaxLength": 30,
  "contextKit.copyAnchor.previewDuration": 1
}
```

早期版本 Copy Anchor 的 `enabled` 表示复制模式；现在应使用 `contextMode` 保存模式，`enabled` 控制整个功能。既有设置不会自动改写。

## 快捷键配置

快捷键写在用户 **`keybindings.json`**（顶层数组），功能开关和其他设置写在 **`settings.json`**（顶层对象），两者分开配置。

| 功能           | Windows / Linux | macOS                | 默认键位、改键方法与完整 JSON                                       |
| -------------- | --------------- | -------------------- | ------------------------------------------------------------------- |
| JSON 转换      | Ctrl+;          | Cmd+;                | [JSON Explorer 快捷键](src/features/json-explorer/README.md#快捷键) |
| 按当前模式复制 | Ctrl+C          | Cmd+C                | [Copy Anchor 快捷键](src/features/copy-anchor/README.md#快捷键)     |
| 切换复制模式   | Ctrl+\，Ctrl+\  | Control+\，Control+\ | [Copy Anchor 改键示例](src/features/copy-anchor/README.md#快捷键)   |

示例保留各功能的 `enabled` 条件，总开关关闭时不会接管对应按键。模式切换键只改变 `contextMode`，不能启用已关闭的整个功能。

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
│   │   └── copy-anchor/       # 上下文复制、快照和状态栏预览
│   └── shared/               # 共用日志
├── tests/
│   ├── unit/                 # JSON Explorer 与 Copy Anchor 回归测试
│   └── integration/          # VS Code 扩展宿主测试
├── scripts/                  # 测试构建与启动
├── docs/                     # 架构与功能文档
├── .vscode/                  # F5 调试
├── .github/workflows/ci.yml
├── bun.lock
└── package.json
```

## 开发

Bun 1.4.2、TypeScript 7.0.2、Oxlint、Oxfmt。Node.js 22.12+ 用于打包和扩展宿主测试工具；所有依赖与脚本通过 Bun 管理。

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
