# Copy Anchor 模块（待迁移）

来源：Copy Anchor。

迁移后由 `index.ts` 导出 `registerCopyAnchorFeature(context, logger)`，注册复制命令、开关和状态栏，并把所有 disposable 放入 `context.subscriptions`。

- `core/`：上下文格式、行号计算、空行和围栏处理，不依赖 `vscode`。
- `commands.ts`：编辑器选区读取、全选判断、原生复制回退。
- `statusBar.ts`：模式显示和点击切换。
- `config.ts`：模式配置与持久化。

按实际迁移需要创建这些文件。当前不会拦截 Ctrl+C 或注册切换快捷键。
