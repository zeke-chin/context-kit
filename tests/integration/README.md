# VS Code 集成测试（待添加）

迁移功能时引入 `@vscode/test-electron`，在独立扩展宿主验证命令、剪贴板、状态栏、配置和 provider。

这些测试需要真实的 `vscode` API，不交给 Bun 单元测试运行器。届时增加独立测试编译配置、`test:integration` 脚本和 CI 步骤。
