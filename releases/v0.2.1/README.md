# NuiPet v0.2.1 发布说明

作者：暂逝的晚河（Wanhe）

NuiPet 是基于虚拟主播鹿弈Nui形象制作的轻量桌面宠物。本版本为 Windows x64 版本，主要收拢 v0.2.0 阶段发现的菜单、动作绑定和动画资源问题。

## 更新重点

- 修复右键菜单在不同缩放比例下可能裁剪底部按钮的问题。
- 菜单打开时调整缩放，窗口会保持菜单安全尺寸。
- 动画元数据异常时回退到待机动作，避免宠物显示为空白。
- 动作菜单改为按 `pet.json` 中的 `menuActions` 生成，菜单按钮和动作元数据保持一致。
- `happy_run` 和 `run` 仅通过拖动触发，不显示在右键菜单中。
- 拖动奔跑动作已绑定左右方向，不再随机选择奔跑行。
- 当前菜单动作键为 `idle`、`wave`、`jump`、`cry`、`idle_alt`、`walk`、`think`、`idle_long`、`nod`、`sit`。
- 已补入新的 `sit` 坐下动画并绑定到右键菜单。
- `nod` 已移除尾部空帧，避免动画结尾消失。

## 使用说明

请保持以下两个文件在同一目录中：

- `NuiPet-win_x64.exe`
- `resources.neu`

双击 `NuiPet-win_x64.exe` 启动桌宠。右键桌宠可打开菜单，切换动作、调整缩放、切换置顶或退出。左键点击会触发互动文本；拖动桌宠时会播放方向绑定的奔跑动画。

## 已知限制

- 后续 v0.2.2 将继续优化跳跃 y 轴位移、菜单退出进程、菜单视觉设计和绿幕像素残留。

## 链接

- 爱发电赞助：https://www.ifdian.net/a/Wan_he
- B站主页：https://space.bilibili.com/1470484820?spm_id_from=333.337.0.0
- BUG反馈：liujiaqi.wanhe@gmail.com

## 版本号

v0.2.1

## 技术栈

- Neutralinojs 桌面壳
- HTML / CSS / JavaScript 前端
- WebP spritesheet 动画资源
