# 单元测试

运行 `bun run test`，执行 `json-explorer/` 和 `copy-anchor/` 下的纯逻辑回归测试。

原项目 6 个测试文件完整迁入，覆盖 JSON 格式化、嵌套解析、Python repr、字符串内换行修复、Markdown 判断、围栏闭合及 Hover token 缓存。只改测试运行器和模块引用，保留原断言。

Copy Anchor 的 2 个测试文件完整迁入，覆盖复制格式、行号、围栏以及预览缩短与 Unicode 截断。
