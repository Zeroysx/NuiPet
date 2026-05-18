# NuiPet v0.2.1-beta 测试版说明

作者：暮逝的晚河（Wanhe）

NuiPet 是基于虚拟主播鹿弈Nui形象制作的轻量桌面宠物。本测试版为 Windows x64 版本，主要用于验证 v0.2.1 阶段对 v0.2.0 问题的修复。

## 测试重点

- 右键菜单在不同缩放比例下不应裁剪底部按钮。
- 菜单打开时调整缩放，不应让菜单尺寸跟随宠物模型错误裁剪。
- 动画元数据异常时应回退到待机动作，避免宠物显示为空白。
- 动作菜单应按 `pet.json` 中的 `menuActions` 生成，并能直接触发每个已开放的行级动作。
- `happy_run` 和 `run` 仅通过拖动触发，不显示在右键菜单中。
- 拖动奔跑动作已绑定左右方向，不再随机选择奔跑行。
- 当前菜单动作键为 `idle`、`wave`、`jump`、`cry`、`idle_alt`、`walk`、`think`、`idle_long`、`nod`、`sit`。

## 使用说明

请保持以下两个文件在同一目录中：

- `NuiPet-win_x64.exe`
- `resources.neu`

双击 `NuiPet-win_x64.exe` 启动桌宠。右键桌宠可打开菜单，切换动作、调整缩放、切换置顶或退出。左键点击会触发互动文本；拖动桌宠时会播放移动动画。

## 已知限制

- 已补入新的 `sit` 坐下动画并绑定到右键菜单。
- 原 `wake`、`blink`、`idle_breathe`、`idle_look`、`idle_stretch`、`idle_blink` 已按实际视觉效果改名或别名到待机2、思考、长待机、点头，其中思考类只保留一个 `think`。
- 已重新清空 row 12 后写入坐下动画，避免旧帧和坐下帧堆叠。
- `nod` 已移除尾部空帧，避免动画结尾消失。

## 链接

- 爱发电赞助：https://www.ifdian.net/a/Wan_he
- B站主页：https://space.bilibili.com/1470484820?spm_id_from=333.337.0.0
- BUG反馈：liujiaqi.wanhe@gmail.com

## 版本号

v0.2.1-beta

## 技术栈

- Neutralinojs 桌面壳
- HTML / CSS / JavaScript 前端
- WebP spritesheet 动画资源
