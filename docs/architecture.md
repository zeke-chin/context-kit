# 架构与迁移记录

## 工程形式

一个 Git 仓库、一个 VS Code 扩展、一个 package.json。功能按模块划分，共享发布周期和扩展宿主，暂不拆 workspace 包。

## 模块边界

- `extension.ts` 创建共用日志，调用 `registerJsonExplorerFeature(context, logger)` 和 `registerCopyAnchorFeature(context, logger)`，管理顶层生命周期。
- JSON Explorer 在 `src/features/json-explorer/` 内实现；Copy Anchor 在 `src/features/copy-anchor/` 中独立实现。
- `core/` 不导入 `vscode`，保留纯解析、文本处理和内存 token 缓存，使用 Bun 测试。
- `documentValues.ts` 把 offset/length 适配为 VS Code Range；命令、事件和 provider 负责宿主 API。
- 功能模块不互相导入；只有真正共用且语义一致的能力进入 `shared/`。
- 所有命令、监听器、输出通道和状态栏都登记到 `context.subscriptions`。转换 CodeLens 的实例也单独释放，清理自身配置监听器与 EventEmitter。

## 命名

| 内容            | 约定                      |
| --------------- | ------------------------- |
| 展示名称        | Context Kit               |
| 包名与仓库名    | context-kit               |
| JSON 命令及配置 | contextKit.jsonExplorer.* |
| 复制命令及配置  | contextKit.copyAnchor.*   |

旧命令 `better-json-explorer.*` 和旧设置 `betterJsonExplorer.*` 不再注册。默认快捷键沿用 Ctrl+; / Cmd+;。没有自动改写用户设置；迁移前缀的方法在 README 中说明。

## 已完成的 JSON Explorer 迁移

来源：Better JSON Explorer 0.2.1，提交 `9fdeeb79fa406721cad9acde2a9a72cf57bedb01`。

- JSON/字符串转换、Python repr 子集解析、字符串内换行修复。
- plaintext 整体粘贴识别与格式化锁，保留原有触发规则与默认配置。
- Hover 多种内容预览、2000 字符截断、短 token 打开完整内容。
- 嵌套解析与转换 CodeLens，文档版本缓存和配置变化失效。
- 侧栏新建文档、重复打开唯一命名、原有全部回归测试与功能文档。

适配调整：剥离纯逻辑的 VS Code 引用、使用共用日志通道、命令返回完成 Promise、补全 provider 释放。JSON/Python 格式转换算法保持原样。

## 构建与验证

TS7 负责类型检查，Bun 输出 Node 目标的 CommonJS bundle 和外部 source map。`jsonc-parser` 使用其 ESM 入口以便 Bun 静态收集内部依赖；默认 UMD 入口会留下无法打包的相对 require。`vscode` external，由扩展宿主提供。

VSIX 包含 `out/extension.js` 与第三方许可，不包含源码、测试、source map、开发依赖或锁文件。F5 调试使用 bundle 的 source map。watch 仅重建 bundle，类型检查通过 `bun run typecheck` 或 `bun run check` 执行。

单测在 Bun 中运行；集成测试将测试代码单独 bundle，使用 Mocha 和真实 VS Code API。CI 在官方 VS Code 1.105.0 上运行扩展宿主测试。兼容编辑器可通过环境变量作为本地替代，但不能据此声称完成官方最低版本验证。

## Copy Anchor 迁移

重新读取独立 Copy Anchor 当前工作目录后迁入，源文件快照哈希记录在 `docs/copy-anchor-source.sha256`。源项目本身没有 Git 历史，不能用旧版本提交号标识。

- 复制格式、全选路径、Untitled 回退与多选区行为原样保留。
- 切换时使用上次复制快照；如果外部操作覆盖了剪贴板，则回退到切换前捕获的当前选区。
- 切换队列保持串行；选区在异步设置写入前捕获。
- 左侧复制提示按时隐藏、重新计时，并监听预览配置变化；右侧模式持久保存。
- 命令、设置和状态栏标识改为 `contextKit.copyAnchor.*`，错误接入共用日志，模块释放时清理复制快照。
- 纯文本与预览算法进入 `core/`，原有单测改用 Bun；原有集成断言通过 Mocha 在同一扩展宿主执行。

两个模块在启动完成时注册，JSON/JSONC/plaintext 语言与命令激活入口也保留，因此 Copy Anchor 可用于其他文件类型。模块没有相互导入，复制不会主动改写编辑器内容。

## 联合验证

集成测试验证 JSON 转换后按新行号复制、全选复制切换回原文再进入 plaintext 自动格式化，以及 JSON Explorer 侧栏 Untitled 内容保持原生复制。CI 运行完整单测和官方 VS Code 扩展宿主测试。

旧独立扩展应禁用，以避免重复的复制快捷键、状态栏、Hover 和粘贴处理。新设置命名空间不会自动继承旧设置，迁移方法见 README。
