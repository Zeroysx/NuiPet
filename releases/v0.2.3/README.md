# NuiPet v0.2.3 发布说明

作者：暮逝的晚河（Wanhe）

NuiPet 是基于虚拟主播鹿弈Nui形象制作的轻量桌面宠物。本版本为 Windows x64 发布包，包含 Inno Setup 安装器和便携版文件，重点完成 v0.2.3 的安装包路径整理、睡眠动作、右键菜单停靠和交互反馈修复。

## 更新重点

- Windows 安装器路径改为 Inno Setup 引导构建，移除了不可靠的 IExpress fallback。
- 新增独立的 `sleep` 睡眠动作，右键菜单显示为“休眠”，并可由自动待机调度触发。
- 重新设计 row 10 睡眠动作：从站立困倦过渡到方向一致的趴下睡着，睡眠帧带小 `Z` 气泡引导，将第二帧前方下伏膝盖修正为光滑露出的膝盖，保持时间更长，并回到待机动作。
- 右键菜单会停靠在桌宠旁边并扩展原生窗口宽度，不再覆盖角色。
- 缩放时会重新计算已打开菜单的位置，避免菜单跟随旧尺寸或被窗口裁切。
- 拖拽动画重命名为 `run_right` 和 `run_left`，旧动作键保留兼容别名。
- 单击和双击使用独立反应动作组，避免视觉反馈互相覆盖。
- `idle_long` 不再出现在菜单和自动待机池中，但仍保留兼容别名访问。

## 使用说明

推荐运行 `NuiPet-v0.2.3-setup.exe` 进行安装。便携版使用时请保持以下文件在同一目录中：

- `NuiPet-win_x64.exe`
- `resources.neu`

双击 `NuiPet-win_x64.exe` 启动桌宠。右键桌宠可打开菜单，切换动作、调整缩放、切换置顶或退出。左键点击会触发互动文本；拖动桌宠时会播放方向绑定的奔跑动画。

## 已知限制

- 本版本不包含自动更新、代码签名、MSIX 或跨平台安装包。
- 使用安装器卸载时只删除安装目录中的程序文件；Neutralino 的用户级存储数据不会自动清理。
- 便携版卸载时只需删除发布目录。

## 链接

- 爱发电赞助：https://www.ifdian.net/a/Wan_he
- B站主页：https://space.bilibili.com/1470484820?spm_id_from=333.337.0.0
- BUG反馈：liujiaqi.wanhe@gmail.com

## 版本号

v0.2.3

## 技术栈

- Neutralinojs 桌面壳
- HTML / CSS / JavaScript 前端
- WebP spritesheet 动画资源
- Inno Setup Windows x64 安装包
- 便携版 Windows x64 发布包
