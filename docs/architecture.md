# 架构与迁移计划

## 工程形式

使用一个 Git 仓库、一个 VS Code 扩展、一个 package.json。两个功能模块暂时无需拆成 workspace 包；它们共享发布周期和扩展宿主。

## 模块边界

- `extension.ts` 只负责创建共用服务、调用功能注册入口和管理生命周期，不承载业务算法。
- 每个功能在 `src/features/<name>/index.ts` 提供自己的注册入口。功能迁移前不创建空注册函数。
- 功能内部的 `core/` 保持纯 TypeScript，不导入 `vscode`。选区、剪贴板、设置和 provider 等 API 交互由外层负责。
- JSON 模块和 Copy Anchor 模块不互相导入。只有真正共用且语义一致的能力才放进 `shared/`，不提前抽象插件框架或依赖注入容器。
- 命令、监听器、输出通道和状态栏都应登记到 `context.subscriptions`。

## 命名规划

| 内容         | 约定                      |
| ------------ | ------------------------- |
| 展示名称     | Context Kit               |
| 包名与仓库名 | context-kit               |
| 命令前缀     | contextKit                |
| JSON 命令    | contextKit.jsonExplorer.* |
| 复制命令     | contextKit.copyAnchor.*   |
| JSON 配置    | contextKit.jsonExplorer.* |
| 复制配置     | contextKit.copyAnchor.*   |

仅 `contextKit.showOutput` 已注册。其他命令、配置和快捷键在对应功能迁入时再写入 package.json，避免展示无实现的功能。

## 迁移顺序

1. **Copy Anchor**：先迁入格式化纯函数及测试，再接入复制命令、设置与状态栏。确认全选、Untitled、多选区、原生复制回退和快捷键冲突行为。
2. **JSON 核心**：迁入解析、格式化、输入修复及现有回归测试，再接入编辑器命令。
3. **JSON 交互**：迁入 Hover、CodeLens、自动识别与事件处理，保证监听器不会互相触发或重复注册。
4. **整体验证**：添加扩展宿主测试，验证两个功能共同启用时的复制、粘贴、撤销和配置行为，完成文档及发布信息。

旧项目暂时保留。新命名空间不会自动继承旧设置，是否迁移配置应在功能迁入时明确决定。安装新旧扩展并行运行可能产生快捷键、provider 或自动转换重复，届时需说明替换方式。

## 构建与打包

当前 TS7 将 `src/` 编译到 `out/`，保留 source map 用于 F5 调试。VSIX 不包含源码、测试、锁文件或开发配置。

骨架无运行时第三方依赖，暂用 `vsce package --no-dependencies`。迁入 `jsonc-parser` 等运行时依赖时，必须同步调整打包策略：优先增加 Bun bundle，将运行时依赖打进产物并 externalize `vscode`，TS7 继续负责类型检查。不能仅添加依赖而沿用排除依赖的未打包产物。

单元测试使用 Bun，只覆盖纯逻辑。VS Code API 集成测试单独使用真实扩展宿主，不通过大量 mock 代替。
