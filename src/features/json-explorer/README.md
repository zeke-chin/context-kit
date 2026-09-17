# JSON Explorer

迁移自 Better JSON Explorer 0.2.1，源提交 `9fdeeb79fa406721cad9acde2a9a72cf57bedb01`。

- `index.ts`：注册命令、文档事件和 provider，持有并释放模块资源。
- `core/`：纯逻辑，包括 JSON/Python 解析、换行修复、Markdown 识别及 Hover token 缓存。不依赖 VS Code API。
- `documentValues.ts`：把核心算法的 offset/length 映射为编辑器 Range。
- `commands.ts`、`parseNestedCommand.ts`、`editorOps.ts`：转换、侧栏文档和编辑器操作。
- `providers/`：Hover 和 CodeLens。
- `config.ts`：`contextKit.jsonExplorer.*` 配置。
- `logger.ts`：接入入口传入的共用日志通道，不创建额外通道。

保留原有全量替换检测、格式化并发锁、Hover 短 token 和版本缓存行为。注册命令返回完成 Promise，便于调用方等待编辑完成。转换 CodeLens 的配置监听器与 EventEmitter 随模块释放。
