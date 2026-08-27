# 开发

如何在本地参与 PW·GEN 的开发。English version: [Development](../en/development.md).

## 环境要求

- **站点本身零要求** —— 纯 HTML/CSS/JS，无任何运行时依赖。
- **测试工具链需要 Node.js**（任一在维护期内的版本；测试只用普通 `assert`，对引擎无严格要求）与 npm，用于安装三个开发依赖。

## 命令

以下命令均在本仓库真实执行并通过：

| 命令 | 作用 | 状态 |
| --- | --- | --- |
| `npm install` | 安装测试专用开发依赖（`jsqr`、`pngjs`，以及与内联编码器对应的 `qrcode` / `qrcode-generator`） | ✅ 干净安装，0 漏洞 |
| `npm test` | 运行两套测试：`node test/generator-test.js && node test/donation-test.js` | ✅ 29 通过，0 失败 |
| `python3 -m http.server 8471` | 把工作目录伺服在 `http://127.0.0.1:8471/` —— 由于没有构建步骤，这就是生产形态 | ✅ 已验证 |

本项目刻意**没有构建、没有打包器、也没有配置 lint**。部署即复制工作目录（见[部署](./deployment.md)）。

## 测试覆盖什么

**`test/app-test.js` —— 8 项，最小 DOM 桩测 UI 接线**（真实加载
`js/app.js` + `js/i18n.js` + `js/generator.js`，无需浏览器）：

- 初始渲染：16 位密码、全池熵值、分隔符切换器默认禁用。
- 易复述开关：4 位分组、连字符/下划线切换、切换器启停、分隔符不计入字符数。
- 易朗读 / 易输入：被剔除字符不出现在输出、熵值读数跟随候选池
  （105 → 90 → 82 比特）；黑名单联动。

**`test/generator-test.js` —— 22 项，经 UMD 导出直接测纯逻辑：**

- 字符类构建：全量集合、易输入剔除（数字收敛为 `347`）、仅清晰符号子集。
- 易朗读：逐类同音剔除、可朗读符号子集、易输入 + 易朗读叠加（池 94 → 35）。
- 易复述分组：`groupPassword` 分段、选中分隔符出池、分隔符绝不泄入生成结果、排版不影响熵。
- 黑名单：跨类移除、被排空的类跳过、整池耗尽抛错、黑名单 + 易输入组合连跑 200 次。
- 生成不变量：精确长度、每个勾选类都有覆盖、输出字符全部落在有效池内，覆盖长度 4–64。
- 200 次连跑断言被剔除字符永不出现。
- 错误契约：未选类、长度小于类数。
- 数学：`entropyBits` 等于 `长度 × log2(池)`，40 / 60 / 80 比特强度阈值，`randomInt` 5000 次抽样边界，以及一次走真实 Web Crypto 随机源的端到端生成。

**`test/donation-test.js` —— 13 项契约测试：**

- 二维码往返：两条支付载荷经 编码 → 栅格化（pngjs）→ 解码（jsqr）后逐字符还原。
- 二维码几何：纠错级别 M、静区 ≥ 4 模块、约 220 px。
- 对 `js/donation.js` 的源码契约检查：载荷与规范完全一致、禁用 `alipays://` 方案、不引用任何图片文件、无 `img/` 目录、页脚入口文案精确、中英键位一致、移动端跳转规则（仅支付宝可跳、微信禁止跳）、基于可见性的回退 + 显式「显示二维码」按钮、无障碍钩子（ESC、遮罩关闭、aria 属性、焦点归还）、供应商脚本懒加载、`[data-donation]` 挂载契约，以及 JS 用到的每个 `donation-*` 类都在 CSS 中存在。

## 目录结构

```
index.html                  页面骨架；按序加载 CSS 与四个脚本
css/style.css               设计体系：CSS 变量（--ink/--paper/--red/…）、布局、组件
css/donation.css            赞赏遮罩/弹窗/标签页样式，复用同一套变量
js/generator.js             UMD 纯核心：buildClasses / generate / entropyBits / strengthLevel / randomInt
js/i18n.js                  中英词典、检测（已存选择 > 浏览器语言）、经 data-i18n-* 属性应用
js/app.js                   DOM 接线：选项 → 生成器 → 输出/强度条/警告、复制、语言按钮
js/donation.js              自包含页脚入口 + 二维码弹窗；只触碰自己的 DOM
js/vendor/qrcode-generator.js  MIT 第三方二维码编码器（勿修改）
test/generator-test.js      核心单元测试（node）
test/donation-test.js       赞赏契约测试（node）
docs/                       本套文档（中英镜像）
```

脚本加载顺序只有一处讲究：`app.js` 依赖 `PG.generator` 与 `PG.i18n` 已存在，因此二者必须先于它加载。`donation.js` 以 `defer` 加载，且只可选地读取 `PG.i18n`。

## 约定

- 四个第一方脚本保持 **ES5 兼容语法**（无箭头函数、无 `const`/`let`）；除非整库一起升级，请维持现状。
- **界面文案统一放 `js/i18n.js`** —— 每个新字符串都要加进**两份**词典。静态标记用 `data-i18n`、`data-i18n-placeholder`、`data-i18n-aria-label`、`data-i18n-alt`；动态字符串调用 `PG.i18n.t(key, params)`，占位符写作 `{param}`。
- **赞赏组件是即插即用件**：只靠一个 `[data-donation]` 挂载点、`css/donation.css` 和可选的 `PG.i18n` 就必须能工作。改动前先跑那 13 项契约测试。
- `js/vendor/` 下的内联文件是第三方代码，不要顺手「美化」。
- 文档引用的截图在 `docs/img/`（WebP，宽 ≤1600）。UI 有实质变化时请重拍，别让文档走样。

## 在本地验证生产形态

站点是纯静态的，「生产构建」就是经 HTTP 伺服的工作目录本身：

```bash
python3 -m http.server 8471
# 打开 http://127.0.0.1:8471/ 走一遍页面：生成、调选项、
# 复制、切换语言、打开赞赏弹窗
```

提交变更前：运行 `npm test`（29 项必须全过），并把伺服出来的页面亲手点一遍——测试套件看不见 CSS 与 DOM 行为。
