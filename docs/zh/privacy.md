# 隐私说明

English version: [Privacy](../en/privacy.md).

以下每一条都对照源码（`js/*.js`、`index.html`）逐项核实过，并附文件级指引方便你复核。

## 存储了什么

| 项目 | 位置 | 键 | 生命周期 | 用途 |
| --- | --- | --- | --- | --- |
| 语言选择（`en` 或 `zh`） | localStorage | `pg-lang` | 直到你清除站点数据 | 记住界面语言（`js/i18n.js`，`setLang`） |

**此外什么都不存。** 页面自身代码从不把密码写入 localStorage、sessionStorage、Cookie、IndexedDB 或任何磁盘缓存。生成设置（长度、字符类、易读、黑名单）刻意不持久化——刷新即重置。

## 网络行为

- **运行时零数据请求。** 脚本中不存在 `fetch`、`XMLHttpRequest`、`sendBeacon`、`WebSocket`，没有分析统计代码，不加载任何外部字体、CDN 或追踪器。
- 被获取的只有页面**自身的静态资源**（2 个 CSS、4 个 JS），外加同源内联的 `js/vendor/qrcode-generator.js`——且仅在首次打开赞赏弹窗时（懒加载）。
- **仅存在一处出站跳转，且为刻意设计、只在手机端发生：** 点赞赏弹窗的支付宝标签页会跳转官方 `https://qr.alipay.com/…` 链接。此后适用支付宝站点/App 自身的隐私政策；页面本身不附带发送任何数据。

## 剪贴板

剪贴板只在**你点击复制时被写入**，且**从不被读取**。剪贴板 API 不可用时尝试一次旧式 `execCommand('copy')` 兜底——同样只发生在你点击之后。

## 实际含义

生成的密码只存在于三处：页面内存、屏幕、以及（在你显式点复制后的）剪贴板。关闭标签页或重新生成即丢弃。

## 本项目控制范围之外

- 使用在线实例时，**GitHub Pages**（托管方）会像任何 Web 服务器一样记录标准请求日志（IP、时间戳）；那是托管基础设施，不是本应用。从仓库自托管即可完全掌控。
- 浏览器自身的行为（密码管理器的表单填充、URL 的浏览历史）同样不在页面控制之内。

## 复核指引

- 存储写入：在 `js/` 内检索 `localStorage` → 仅 `js/i18n.js` 中的 `pg-lang`。
- 网络：在 `js/` 内检索 `fetch|XMLHttpRequest|sendBeacon|WebSocket` → 无命中；唯一的脚本注入是同源二维码库（`js/donation.js`，`loadQrLib`）。
- 剪贴板：`js/app.js` 的 `copyText()` —— 只写、点击触发。
