# AGENTS.md

## 项目概况

Context Kit 是单一 VS Code 扩展（`zekeChin.context-kit-tools`），把两个独立项目合进同一个扩展宿主与发布周期：

- **JSON Explorer**（迁自 Better JSON Explorer 0.2.1）：JSON ⇄ JSON 字符串互转、Python repr 与字符串内换行修复、plaintext 粘贴自动识别、Hover 预览、CodeLens。
- **Copy Anchor**：按 `路径:行号` 复制选区（围栏格式）、上下文/普通复制模式切换、状态栏复制预览。

命令与配置前缀固定为 `contextKit.jsonExplorer.*` 和 `contextKit.copyAnchor.*`；旧的 `better-json-explorer.*` / `betterJsonExplorer.*` 命名空间已废弃，不要重新注册。默认快捷键需保持不变：JSON 格式切换为 Ctrl+;（macOS 为 Cmd+;），有选区时接管复制为 Ctrl+C（macOS 为 Cmd+C），复制模式切换为 `Ctrl+\ Ctrl+\`（连续两次，所有平台均使用 Control）。功能用法与配置说明维护在 `src/features/*/README.md`，`docs/` 下同名文件只是导航入口。修改配置或命令时，同步 `package.json`、对应功能 README 和相关测试；完整配置示例只在功能 README 中维护。

## 常用命令

```sh
bun install --frozen-lockfile
bun run check                # typecheck + lint + format:check + 单测，提交前跑这个
bun run compile              # TS7 类型检查 + Bun bundle → out/extension.js
bun run watch                # 只重建 bundle（不含类型检查）
bun run test                 # bun test ./tests/unit
bun test tests/unit/json-explorer/jsonUtils.test.ts   # 单个测试文件
bun test -t 'unwraps single-level object'             # 按测试名过滤
bun run test:integration     # compile + 单独 bundle 测试 + @vscode/test-electron
xvfb-run -a bun run test:integration                  # 无桌面 Linux
VSCODE_EXECUTABLE_PATH=/path/to/code bun run test:integration
bun run package              # 生成 context-kit-tools-0.1.1.vsix
```

按 F5 启动扩展开发宿主（preLaunchTask 为 `bun: compile`）。工具链：Bun 1.4.2、TypeScript 7.0.2、Oxlint、Oxfmt；开发环境要求 Node.js 22.12+，用于打包和扩展宿主测试工具，扩展运行不需要 Bun。

## 架构

```
src/extension.ts             activate()：建共用日志通道 → 注册两个 feature
src/features/<feature>/
  index.ts                   注册命令、监听器、provider、状态栏与生命周期
  commands.ts / config.ts / editorOps.ts / documentValues.ts   宿主 API 适配
  core/                      纯逻辑（解析、文本算法），禁止 import 'vscode'
  providers/                 Hover、CodeLens
src/shared/logger.ts         共用 LogOutputChannel
```

必须维持的约束：

1. `core/` 不导入 `vscode`，offset/length 到 `Range` 的转换放在 `documentValues.ts` —— 单测依赖这一点才能在 Bun 中直接跑纯逻辑。
2. 两个功能模块互不导入；只有真正共用且语义一致的能力才进 `shared/`。
3. 所有命令、监听器、provider、状态栏必须由 `context.subscriptions` 直接或间接管理；动态 provider 可由登记到 subscriptions 的统一清理器释放。`ConvertToJsonCodeLensProvider` 还持有自己的配置监听器与 EventEmitter，需单独 dispose。
4. 日志只有一个通道：`extension.ts` 创建 LogOutputChannel 后传给两个 feature。JSON Explorer 经模块级 `setLogger` 包装并加 `[JSON Explorer]` 前缀（`features/json-explorer/logger.ts`），Copy Anchor 直接加 `[Copy Anchor]` 前缀。不要在 feature 内新建输出通道。
5. `contextKit.*.enabled` 是总开关，动态生效：JSON Explorer 关闭时 `refreshProviders()` 释放 provider、命令处理器提前返回，重新启用时重新注册；Copy Anchor 关闭时隐藏状态栏、取消提示定时器并 `clearCopyHistory()`。复制模式单独保存在 `contextKit.copyAnchor.contextMode`，关闭总开关不重置模式，也不改写剪贴板。
6. `jsonc-parser` 必须从其 ESM 入口 `jsonc-parser/lib/esm/main.js` 引入（见 `core/jsonUtils.ts` 顶部注释）：默认 UMD 入口会留下 Bun 无法打包的相对 require。

构建：Bun 输出 CJS bundle、`--external vscode`、外部 source map；`tsc` 只做类型检查（`tsconfig.json` 管 src，`tsconfig.tests.json` 覆盖 src+tests+scripts 且 `skipLibCheck`）。VSIX 通过 `.vscodeignore` 排除 src/tests/docs/scripts，但保留两个 feature README 和 `docs/images/**`；CI 配置为运行完整检查，并在官方 VS Code 1.105.0 上运行集成测试。

## 关键行为（改动前先读）

- **粘贴热路径**：`onDidChangeTextDocument` → `isWholeDocumentPaste`（先检查单个 change、`rangeOffset === 0`、首个非空白字符为 `{` `[` `"`，再确认插入文本与整个文档内容 trim 后相等）→ `formatDocumentIfPossible`。`formatInFlight` Set 用来屏蔽自身 applyEdit、语言切换回声以及异步窗口内的用户输入。
- **两种需用户确认的输入**：`sourceKind` 为 `python_str` / `json_repaired` 时默认不自动转换，改由 `ConvertToJsonCodeLensProvider` 在 plaintext 第 0 行显示 `▸ Convert` 按钮；对应的 `*.autoConvert` 设为 true 则改为粘贴即转并隐藏按钮。两种 UX 互斥，改一处要同步另一处。
- **Hover 的 token 机制**：Hover 链接不能把大内容塞进 `command:` URI（渲染器会丢弃超长参数，命令拿到全 `undefined`），所以 `core/pendingOpens.ts` 暂存内容、只传 token（`parseNestedJsonByToken`）；`takePendingOpen` 故意不删除条目（同一链接可重复点击），最多保留 200 条，按插入顺序淘汰（FIFO）；读取不会更新顺序。CodeLens 走宿主 RPC，不需要这套机制。
- **CodeLens 缓存以 `document.version` 为键**：配置变化时文档版本不变，必须清空缓存并 `fire()` `onDidChangeCodeLenses`，否则用户看不到按钮变化。
- **Copy Anchor 切换语义**：toggle 走串行 `toggleQueue` + `lifecycleVersion`；选区在异步写配置之前用 `captureSelection()` 捕获；`copyAfterToggle` 在剪贴板仍等于上次写入内容时复用上次快照，被外部覆盖则回退到切换前捕获的选区。Untitled、非 `file`/`vscode-remote` scheme、文件名含换行时回退原生复制（`editor.action.clipboardCopyAction`）。
- **状态栏预览**：写入 `statusBarItem.text` 前必须把 `$(` 转义为 `\$(`（否则被当作图标），同时设置 `accessibilityInformation`。

## 测试

- `tests/unit/` 镜像 feature 目录，用 `bun:test` 的 `describe`/`test`，只覆盖 `core/` 纯逻辑。
- `tests/integration/` 用 Mocha（tdd ui）在真实 VS Code 扩展宿主中运行；新增测试文件必须在 `tests/integration/index.ts` 手动 `require`。测试以 `zekeChin.context-kit-tools` 激活扩展，修改隔离配置后会在 teardown 还原。
- `VSCODE_EXECUTABLE_PATH` 指向的兼容编辑器只能作本地替代，不能据此声称通过官方最低版本验证。

发布相关：仓库为 `zeke-chin/context-kit`，打包使用 `--no-dependencies` 并启用相对链接重写。发布前必须确认版本、检查结果及 VSIX 内容；`.env` 和 `.env.*` 不得进入 Git 或 VSIX。

发布流程维护在 `.github/workflows/release.yml`：仅版本标签触发，标签必须匹配 package.json，检查和官方宿主测试通过后将同一 VSIX 发布到两市场。令牌只传给对应发布步骤。
