# Copy Anchor

为复制的代码加一个定位锚点，让 AI 知道内容来自哪个文件、哪几行。

## 使用

在已保存文件中选中文字，按 **Ctrl+C**（macOS：**Cmd+C**）：

````text
```/home/zeke/workspace/my-app/src/main.ts:8-11
function greet(name: string) {
  const message = `Hello, ${name}`;
  return message;
}
```
````

`路径:起始行-结束行` 是便于阅读和搜索的定位约定，不是所有 AI 客户端都会自动识别的统一协议。行号从 1 开始；单行显示 `路径:8`。代码块首行用文件位置作为信息字符串，样式与上述示例一致。

仅移除选区首尾的空白行，并同步调整行号；代码缩进、行尾空格和中间空行保留。换行统一为 LF。选区中的 Markdown 代码围栏会自动使用更长的外层围栏，避免截断。

| 场景                      | 剪贴板内容                             |
| ------------------------- | -------------------------------------- |
| 📌 模式，选中文件片段     | 路径、行号和选中的内容                 |
| 📌 模式，完整选中整个文件 | 只有绝对路径，无代码块、行号或文件内容 |
| 多选区                    | 按文件顺序分别输出代码块               |
| Untitled 未保存文件       | 原生复制，不添加路径                   |
| Git 历史等虚拟文档        | 原生复制                               |
| 未选中文字                | 原生复制当前行，遵循 VS Code 设置      |
| 📄 普通复制模式           | 原生复制                               |

已保存文件中尚未保存的修改仍会按当前编辑器内容复制。全选仍只输出路径；如需 AI 读取最新磁盘内容，请先保存文件。SSH、WSL、容器中的文件使用远端绝对路径。

## 切换模式

- 在编辑器内连续按 **Ctrl+\，Ctrl+\**（macOS 也使用 Control）。这是两段式快捷键。
- 点击右下角 **📌**（上下文复制）或 **📄**（普通复制）。状态栏表示当前模式，Untitled 等场景仍会回退到原生复制。
- 命令面板执行 **Context Kit: Copy Anchor: 切换上下文复制**。
- 设置 `contextKit.copyAnchor.contextMode`，默认 `true`。切换会更新已有的工作区模式设置，否则更新用户模式设置，重启后保留。

通过快捷键、状态栏或命令面板切换模式后，剪贴板会在上次通过插件复制的「原文」和「带路径、行号的内容」之间切换，无需再按 Ctrl+C；全选复制则在完整原文和文件路径之间切换。取消选区或移动光标不影响这份已复制内容。插件仅在本次运行期间记住这两种内容。

如果剪贴板已被其他复制操作替换，或还没有通过插件复制过，切换时使用当前非空选区；没有选区则保留剪贴板，不会复制光标所在的空行。直接按 Ctrl+C 时仍保留原生无选区复制行为。

通过插件复制或切换剪贴板内容后，左侧状态栏显示 `📌copied: …` 或 `📄copied: …`，默认 1 秒后消失，再次复制会重新计时。上下文预览会缩短目录、移除外层代码围栏，调大预览长度后例如 `📌copied: ../# Copy Anchor.txt:5-7\n## 使用…`；普通复制直接预览原文。路径过长时从文件名前部省略，优先保留尾部和扩展名，例如 `../..ME.txt`；空间不足以同时保留行号时先省略行号。换行显示为字面的 `\n`，预览不会改变剪贴板内容。

## 配置

在 VS Code 命令面板执行 **Preferences: Open User Settings (JSON) / 首选项: 打开用户设置 (JSON)**，将配置写入顶层对象。只对当前项目生效时，写入项目的 `.vscode/settings.json`；工作区设置优先于用户设置。

如果文件已有设置，把下面示例里的字段合并到现有对象，不要再嵌套一个对象。布尔值写 `true` / `false`，数字不加引号。所有配置修改后即时生效，无需重载窗口。

### 完整配置：默认行为

```json
{
  "contextKit.copyAnchor.enabled": true,
  "contextKit.copyAnchor.contextMode": true,
  "contextKit.copyAnchor.previewMaxLength": 30,
  "contextKit.copyAnchor.previewDuration": 1
}
```

### 每个字段的含义与写法

| 字段                                     | 类型 / 默认值    | 含义与取值                                                                                                                                                                                 |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contextKit.copyAnchor.enabled`          | boolean / `true` | **整个 Copy Anchor 的总开关**。`false` 时隐藏左右状态栏，停用复制与切换快捷键、停止复制提示、清空内存复制快照；不会修改当前剪贴板，也不影响 JSON Explorer。重新启用请在设置中改回 `true`。 |
| `contextKit.copyAnchor.contextMode`      | boolean / `true` | 仅在功能启用时有效。`true` 为 📌 上下文复制；`false` 为 📄 普通复制。此项不控制功能是否开启。                                                                                              |
| `contextKit.copyAnchor.previewMaxLength` | integer / `30`   | 范围 **1–1000**。限制左侧复制预览的字符数，包含截断标记，不包含 `📌copied: ` / `📄copied: ` 前缀。过长路径优先保留文件名尾部和扩展名；仅影响提示，不影响剪贴板。                           |
| `contextKit.copyAnchor.previewDuration`  | number / `1`     | 范围 **0–3600**，单位秒，支持小数。`0` 不显示左侧提示，`0.5` 显示半秒，`3` 显示三秒。重复复制或切换会重新计时；修改预览设置时当前提示立即隐藏。右侧模式标识不受此项影响。                  |

单个字段的写法分别为 `"contextKit.copyAnchor.enabled": false`、`"contextKit.copyAnchor.contextMode": false`、`"contextKit.copyAnchor.previewMaxLength": 80` 和 `"contextKit.copyAnchor.previewDuration": 2.5`。

双按 Ctrl+\ 或点击右侧图标修改的是 **contextMode**，不会改变 **enabled**。模式优先保存到已经设置该字段的工作区配置，否则保存到用户配置。切换命令会按当前模式重新复制记住的内容；直接编辑 `contextMode` 设置只改变模式，不重新复制。关闭再开启总开关会保留模式设置，但不会恢复已清空的复制快照。

### 完整示例：普通复制，预览更长

```json
{
  "contextKit.copyAnchor.enabled": true,
  "contextKit.copyAnchor.contextMode": false,
  "contextKit.copyAnchor.previewMaxLength": 80,
  "contextKit.copyAnchor.previewDuration": 2.5
}
```

功能仍然开启，显示 📄，可以切回上下文复制。若只想隐藏复制预览，把 `previewDuration` 改为 `0`。

### 完整示例：关闭整个功能

```json
{
  "contextKit.copyAnchor.enabled": false,
  "contextKit.copyAnchor.contextMode": true,
  "contextKit.copyAnchor.previewMaxLength": 30,
  "contextKit.copyAnchor.previewDuration": 1
}
```

后三项保留供重新启用时使用，关闭期间均不生效。Ctrl+C / Cmd+C 回归编辑器自身行为，双按 Ctrl+\ 不再切换模式。

## 快捷键

| 操作               | Windows / Linux | macOS                | 命令 ID                        |
| ------------------ | --------------- | -------------------- | ------------------------------ |
| 按当前模式复制     | Ctrl+C          | Cmd+C                | `contextKit.copyAnchor.copy`   |
| 切换模式并重新复制 | Ctrl+\，Ctrl+\  | Control+\，Control+\ | `contextKit.copyAnchor.toggle` |

复制要求编辑器有非空选区；未选中时保留原生复制当前行行为。切换模式只要求编辑器有焦点，它改变 `contextMode`，不会改变功能总开关 `enabled`。功能关闭时，两种绑定均不生效。

快捷键使用 **用户 `keybindings.json`**，不写在 `settings.json` 中，也不是项目的 `.vscode/keybindings.json`。命令面板执行 **Preferences: Open Keyboard Shortcuts (JSON) / 首选项: 打开键盘快捷方式 (JSON)** 即可编辑。也可以打开键盘快捷方式界面，搜索下面的命令 ID 后修改按键。

文件顶层是 **数组 `[]`**。已有配置时，将示例中的条目加入原数组，不要覆盖已有条目或嵌套第二个数组。以下示例分别独立使用，不要将默认版与自定义版同时粘贴。

| 字段      | 含义与写法                                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`     | 按键组合，小写书写，例如 `ctrl+alt+j`；macOS 的 Command 写作 `cmd`，Control 写作 `ctrl`。空格分隔两段式快捷键；JSON 字符串中的反斜杠写作 `\\`。                      |
| `command` | 要调用的命令 ID。以 `-` 开头表示移除扩展提供的默认绑定，不是执行命令。                                                                                               |
| `when`    | 生效条件。保留 `config.…enabled`，确保整个功能关闭后释放快捷键；`editorTextFocus` 限定编辑器正文焦点，`editorHasSelection` 限定有选区，`isMac` / `!isMac` 区分系统。 |

快捷键中的 `config.…enabled` 读取 `settings.json` 的总开关；它不是需要额外创建的设置。修改后即时生效。新增一个绑定不会自动删除原默认绑定，所以改键示例同时包含移除条目。若以前添加过相同命令的用户绑定，还需在原数组里手动删除那些旧条目。

### 完整示例：默认快捷键（跨平台）

扩展已经提供这些默认键位，不自定义时无需写入。以下是等效的用户配置：

```json
[
  {
    "key": "ctrl+c",
    "command": "contextKit.copyAnchor.copy",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus && editorHasSelection && !isMac"
  },
  {
    "key": "cmd+c",
    "command": "contextKit.copyAnchor.copy",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus && editorHasSelection && isMac"
  },
  {
    "key": "ctrl+\\ ctrl+\\",
    "command": "contextKit.copyAnchor.toggle",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus"
  }
]
```

### 完整示例：保留复制键，把模式切换改为 Ctrl+Alt+C

Windows、Linux 和 macOS 均使用 Control+Alt+C；macOS 的 Alt 对应 Option。原 Ctrl+C / Cmd+C 复制绑定继续由扩展提供，无需重复配置。

```json
[
  {
    "key": "ctrl+\\ ctrl+\\",
    "command": "-contextKit.copyAnchor.toggle",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus"
  },
  {
    "key": "ctrl+alt+c",
    "command": "contextKit.copyAnchor.toggle",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus"
  }
]
```

### 完整示例：保留原生 Ctrl+C / Cmd+C，单独用 Ctrl+Alt+Y 触发插件复制

这里仅更改“按当前模式复制”的按键；模式切换仍使用默认的双按 Ctrl+\。macOS 同样使用 Control+Option+Y。

```json
[
  {
    "key": "ctrl+c",
    "command": "-contextKit.copyAnchor.copy",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus && editorHasSelection"
  },
  {
    "key": "cmd+c",
    "command": "-contextKit.copyAnchor.copy",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus && editorHasSelection"
  },
  {
    "key": "ctrl+alt+y",
    "command": "contextKit.copyAnchor.copy",
    "when": "config.contextKit.copyAnchor.enabled && editorTextFocus && editorHasSelection"
  }
]
```

### 冲突与边界

默认 Ctrl+\ 原本用于拆分编辑器；作为两段式快捷键的第一段时，会等待第二次按键。使用上述改键示例移除默认切换绑定后，就可以释放该前缀。自定义组合也可能与其他扩展或系统按键冲突，请在键盘快捷方式界面检查。

右键菜单和菜单栏的原生「复制」仍是普通复制；终端、搜索框不受上述编辑器绑定影响。用户自定义绑定优先于扩展默认绑定。关闭 Copy Anchor 后无法通过模式切换键重新启用，需要在设置中把 `contextKit.copyAnchor.enabled` 改回 `true`。

## 迁移说明

本模块来自迁移时重新读取的 Copy Anchor 工作目录。该源目录没有 Git 历史，读取时的源文件 SHA-256 记录在 `docs/copy-anchor-source.sha256`。

旧模式设置 `copyAnchor.enabled` 或早期 `contextKit.copyAnchor.enabled` 应改写为 `contextKit.copyAnchor.contextMode`；现在的 `contextKit.copyAnchor.enabled` 专门控制整个模块，默认 `true`。已有配置不自动迁移，请按上面的完整示例确认。其他旧配置使用 `contextKit.copyAnchor.` 前缀。使用 Context Kit 时请禁用独立 Copy Anchor 扩展，避免快捷键冲突及重复状态栏。

## 开发结构

- `index.ts`：注册 `registerCopyAnchorFeature(context, logger)`，管理右侧模式、左侧复制预览、配置变化与串行切换队列。
- `config.ts`：读取整个功能的总开关。
- `commands.ts`：选区快照、原生复制回退、全选路径、上次复制内容与外部剪贴板覆盖检测。
- `core/contextText.ts`：路径/行号代码块、空行修剪和围栏保护，纯逻辑。
- `core/copyPreview.ts`：状态栏文本预览、路径缩短与 Unicode 截断，纯逻辑。

命令与设置使用 `contextKit.copyAnchor.*`。Ctrl+C / Cmd+C 绑定只在编辑器有选区时生效，双按 Ctrl+\ 或点击模式状态栏会切换模式并更新剪贴板内容。总开关和模式分别持久化，预览默认值沿用源项目。

全部状态栏、监听器、定时器和内存复制快照随模块释放；错误写入 Context Kit 共用日志通道。模块不依赖 JSON Explorer，两个模块仅通过 VS Code 文档与剪贴板自然配合。
