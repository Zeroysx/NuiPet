# NuiPet v0.2.2 发布说明

作者：暂逝的晚河（Wanhe）

NuiPet 是基于虚拟主播鹿弈Nui形象制作的轻量桌面宠物。本版本为 Windows x64 版本，重点修复 v0.2.1 后续计划中的动作、退出、菜单视觉和动画资源问题，并新增 Windows 安装包。

## 更新重点

- 跳跃动作增加 y 轴位移，播放时会自然上跳并落回原位。
- 右键菜单“退出”和托盘“退出”统一调用原生退出流程，避免只隐藏窗口或残留进程。
- 右键菜单视觉重新打磨，保持紧凑尺寸并减少按钮文字溢出。
- 已清理精灵图中的绿幕/抠图残留像素。
- 新增 Inno Setup 安装包 `NuiPet-v0.2.2-setup.exe`，同时保留便携式 Windows x64 文件。

## 使用说明

安装包用户可运行 `NuiPet-v0.2.2-setup.exe` 安装并启动 NuiPet。

便携式使用时，请保持以下文件在同一目录中：

- `NuiPet-win_x64.exe`
- `resources.neu`

双击 `NuiPet-win_x64.exe` 启动桌宠。右键桌宠可打开菜单，切换动作、调整缩放、切换置顶或退出。左键点击会触发互动文本；拖动桌宠时会播放方向绑定的奔跑动画。

## 已知限制

- 本版本不包含自动更新、代码签名、MSIX 或跨平台安装包。
- 卸载程序只删除安装目录中的程序文件，不清理用户系统级 Neutralino 存储数据。

## 链接

- 爱发电赞助：https://www.ifdian.net/a/Wan_he
- B站主页：https://space.bilibili.com/1470484820?spm_id_from=333.337.0.0
- BUG反馈：liujiaqi.wanhe@gmail.com

## 版本号

v0.2.2

## 技术栈

- Neutralinojs 桌面壳
- HTML / CSS / JavaScript 前端
- WebP spritesheet 动画资源
- Inno Setup Windows 安装包
