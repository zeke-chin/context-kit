# JSON Explorer 模块（待迁移）

来源：Better JSON Explorer。

迁移后由 `index.ts` 导出 `registerJsonExplorerFeature(context, logger)`，统一注册命令、事件、Hover 和 CodeLens，并把所有 disposable 放入 `context.subscriptions`。

- `core/`：解析、格式化、Python repr 修复等纯逻辑，不依赖 `vscode`。
- `commands/`：编辑器转换命令。
- `providers/`：Hover、CodeLens。
- `config.ts`：模块配置读取。

按实际迁移需要创建这些文件。当前仅预留模块目录，没有注册任何 JSON 功能。
