# Changelog

## 0.1.0

- 初始化 Context Kit，使用 Bun、TypeScript 7、Oxlint 和 Oxfmt。
- 迁入 Better JSON Explorer：JSON/字符串转换、Python repr 与换行修复、自动识别、Hover、CodeLens 和侧栏解析。
- 命令与设置统一使用 `contextKit.jsonExplorer.*`，默认 Ctrl+; / Cmd+; 保持不变。
- 分离纯逻辑与 VS Code 适配，迁入原有回归测试并增加扩展宿主验证。
- 使用 Bun bundle 将 jsonc-parser 打入 VSIX，补全 provider 生命周期清理。
- Copy Anchor 保留为待迁移模块。
