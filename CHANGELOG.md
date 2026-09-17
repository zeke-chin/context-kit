# Changelog

## 0.1.1

- 新增标签触发的自动发布：校验版本、完整检查、官方 VS Code 集成测试、打包、发布到两个市场并创建 GitHub Release。
- 为 Linux CI 的原生复制测试补充窗口激活与真实输入，保留实际剪贴板断言。
- 两个市场统一显示名称 Context Kit Tools，包名为 context-kit-tools。
- 补充发布说明，令牌仅在发布步骤使用，本地环境变量文件排除出 Git 与 VSIX。

## 0.1.0

- 两个功能新增/统一 enabled 总开关；Copy Anchor 的复制模式改用 contextMode。
- 配置集中到各功能 README，补全字段说明、完整 settings.json 示例与根文档导航。

- 初始化 Context Kit，使用 Bun、TypeScript 7、Oxlint 和 Oxfmt。
- 迁入 Better JSON Explorer：JSON/字符串转换、Python repr 与换行修复、自动识别、Hover、CodeLens 和侧栏解析。
- 命令与设置统一使用 `contextKit.jsonExplorer.*`，默认 Ctrl+; / Cmd+; 保持不变。
- 分离纯逻辑与 VS Code 适配，迁入原有回归测试并增加扩展宿主验证。
- 使用 Bun bundle 将 jsonc-parser 打入 VSIX，补全 provider 生命周期清理。
- 迁入当前 Copy Anchor：路径/行号复制、全选路径、模式切换后重新复制、剪贴板快照保护和可配置状态栏预览。
- Copy Anchor 命令与设置使用 `contextKit.copyAnchor.*`，保留 Ctrl+C / Cmd+C 和双按 Ctrl+\。
- 增加 Copy Anchor 回归测试和两个模块的联合集成测试。
