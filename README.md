# Context Kit

整理结构化内容，复制精准上下文。

计划整合 Better JSON Explorer 的 JSON 处理能力与 Copy Anchor 的上下文复制能力。

**当前阶段：工程骨架。JSON 和复制功能尚未迁移。** 目前唯一的扩展命令是 `Context Kit: 显示日志`，用于确认扩展能够激活。

## 技术栈

- Bun 1.4.2：包管理、脚本和纯逻辑单元测试。
- TypeScript 7.0.2：类型检查与编译，使用正式版 `tsc`。
- Oxlint + Oxfmt：检查与格式化，版本由 `bun.lock` 锁定。
- VS Code Extension API：最低版本 1.105.0。
- Node.js 22+：VS Code 扩展打包工具运行环境。

## 项目结构

```text
context-kit/
├── src/
│   ├── extension.ts           # 激活、注册与生命周期
│   ├── features/
│   │   ├── json-explorer/     # JSON Explorer，待迁移
│   │   └── copy-anchor/       # 上下文复制，待迁移
│   └── shared/
│       └── logger.ts         # 共用日志
├── tests/
│   ├── unit/                 # Bun 纯逻辑测试，待添加
│   └── integration/          # VS Code 宿主测试，待添加
├── docs/
│   └── architecture.md       # 模块边界与迁移计划
├── .vscode/                  # F5 调试与构建任务
├── .github/workflows/ci.yml  # 安装、检查与打包
├── out/                      # 编译产物，不提交
├── package.json              # 扩展声明与开发脚本
├── bun.lock
└── tsconfig.json
```

## 开发

```sh
bun install --frozen-lockfile
bun run compile
bun run watch
bun run lint
bun run format
bun run check
bun run package
```

打开项目后按 F5，进入扩展开发窗口，执行 **Context Kit: 显示日志** 查看激活日志。

`bun run test` 当前允许没有测试文件。功能迁入后增加真实业务测试；现阶段的检查只验证工程配置与已有代码。打包生成 `context-kit-0.1.0.vsix`，可通过扩展面板的「从 VSIX 安装」测试骨架。

## 项目状态

这是独立扩展，标识为 `zekeChin.context-kit`，不是原插件的自动升级。publisher 沿用现有项目，尚未发布 Marketplace 或创建远端仓库。发布前应确认名称和标识可用。

架构与迁移计划见源码中的 `docs/architecture.md`。

## License

MIT
