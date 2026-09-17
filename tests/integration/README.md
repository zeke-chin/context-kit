# VS Code 集成测试

运行 `bun run test:integration`，使用 `@vscode/test-electron` 下载官方 VS Code 1.105.0，在独立用户数据与扩展目录中运行 Mocha。无桌面 Linux 使用 `xvfb-run -a bun run test:integration`。

可以用 `VSCODE_EXECUTABLE_PATH` 指定本机 VS Code 或兼容编辑器可执行文件。兼容编辑器的结果不能替代官方最低版本验证。

- `convertCodeLens.test.ts`：原项目全部 CodeLens 回归测试。
- `extension.test.ts`：命令注册、切换/撤销、自动格式化、输入修复、新配置、缓存失效、CodeLens 打开和 Hover token 完整内容。
- `index.ts`：Mocha 入口。

扩展和测试通过 Bun 分别 bundle，测试独立加载真实 VS Code API。测试会修改隔离配置并在结束时还原。
