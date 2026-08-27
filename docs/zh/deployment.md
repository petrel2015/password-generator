# 部署

English version: [Deployment](../en/deployment.md).

## 站点的托管方式

PW·GEN 是无构建步骤的纯静态站点。在线实例运行在 **GitHub Pages** 上：

- 托管：GitHub Pages（项目站点）
- 来源：**`main` 分支、仓库根目录（`/`）**（撰写本文时已经 Pages API 核实）
- 公开地址：https://petrel2015.github.io/password-generator/

## 为什么不需要 base-path 配置

`index.html` 里的资源引用全部是**相对路径**（`css/style.css`、`js/app.js`…），赞赏组件懒加载的供应商脚本也相对文档解析。GitHub Pages 项目站点伺服在子路径（`/password-generator/`）下，相对路径无需任何配置即可正确解析。因此站点在域名根、任意子路径、localhost、乃至 `file://` 下都能工作。

## 首次启用（新仓库）

1. 把项目推到 GitHub。
2. 仓库 **Settings → Pages → Build and deployment → Source**：选择 *Deploy from a branch*，分支 `main`，目录 `/ (root)`。
3. 保存；一两分钟内部署完成。

## 变更后重新部署

无需运行任何东西——推送到 `main`，GitHub Pages 会自动重新发布工作目录。推送前请在本地确认要发布的就是最终形态（没有构建步骤兜底）：

```bash
npm test                                   # 29 项测试必须全过
python3 -m http.server 8471                # 然后亲手点一遍 http://127.0.0.1:8471/
```

## 上线后验证清单

首次部署及每次重大变更后过一遍：

1. `curl -sI https://petrel2015.github.io/password-generator/` 返回 `HTTP 200`。
2. 页面打开即有已生成的密码与熵值（不是 `—`）。
3. 浏览器控制台无报错（生成、切换语言、赞赏弹窗开合）。
4. 每个选项各改一次，确认密码即时刷新。
5. 复制可用（按钮闪「已复制」）。
6. 赞赏弹窗两个标签页都能渲染二维码。
7. 切到中文再切回；刷新——语言被记住。

## 自定义域名（可选）

由于所有资源路径均为相对路径，GitHub Pages 自定义域名无需改代码：

1. 在仓库根添加 `CNAME` 文件写入域名，或在 **Settings → Pages → Custom domain** 里设置（会自动创建该文件）。
2. 配置 DNS（裸域 A 记录指向 Pages IP，或子域 CNAME）。
3. 证书签发后开启 **Enforce HTTPS**。

注意：根目录的 `CNAME` 文件是部署配置而非产品代码——测试不会覆盖它，但对该应用完全无害。
