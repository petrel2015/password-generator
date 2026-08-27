# 文档索引

主 [README](../../README.zh.md) 概括了项目是什么；这里提供各专题的详细文档。
English documentation: [Documentation index](../en/index.md).

## 用户文档

- [使用](./usage.md) — 分步操作、输入与限制、边界行为表、移动端布局。
- [常见问题](./faq.md) — 范围类问答：工具能做什么、不能做什么。
- [隐私](./privacy.md) — 存了什么、发了什么，逐条对照源码核实。
- [故障排查](./troubleshooting.md) — 症状 → 可能原因 → 修复动作。

## 技术文档

- [开发](./development.md) — 环境要求、命令表、测试覆盖说明、目录结构、生产形态本地预览。
- [部署](./deployment.md) — 托管方式、首次启用步骤、上线后验证清单。

## 功能设计文档

两个包含重要设计决策的子系统的设计文档：

- [密码生成引擎](./features/password-engine.md) — 随机源、字符类保底、易读模式、黑名单、熵模型。
- [赞赏弹窗](./features/donation-dialog.md) — 浏览器实时生成二维码、移动端跳转与回退、无障碍契约。
