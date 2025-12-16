# 🔒 SSL证书查询工具

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![Wails](https://img.shields.io/badge/Wails-v2.11.0-673AB8?logo=wails)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)

一款现代化的SSL/TLS证书有效期监控工具，支持批量查询、自动刷新、通知预警等功能

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用指南](#-使用指南) • [技术栈](#-技术栈) • [截图预览](#-截图预览)

</div>

---

## ✨ 功能特性

### 🔍 证书查询
- **单个域名查询** - 快速查询单个域名的SSL证书信息
- **批量查询** - 支持一次性查询多个域名，自动并发处理
- **SAN域名展示** - 完整显示证书支持的所有域名（Subject Alternative Names）
- **详细信息** - 颁发者、序列号、版本、有效期等完整信息

### ⭐ 关注域名管理
- **域名收藏** - 添加常用域名到关注列表，快速监控
- **备注功能** - 为每个域名添加自定义备注，便于识别
- **手动录入** - 支持手动录入无法自动查询的证书信息
- **批量操作** - 批量刷新、导出、删除，提高管理效率
- **批量导入** - 支持CSV/TXT格式批量导入域名列表

### 🔔 通知预警
- **自定义阈值** - 可配置预警天数（1-365天）
- **状态标识** - 安全🟢、警告🟠、危险🔴、过期⚫四级状态
- **通知开关** - 为每个域名独立配置是否启用通知
- **预警提示** - 自动检测即将过期的证书并提醒

### 📊 数据统计
- **可视化图表** - 证书状态分布饼图、剩余天数柱状图
- **颁发者统计** - 展示证书颁发者分布情况（Top 10）
- **即将过期列表** - 快速查看30天内即将过期的证书
- **总览卡片** - 总数、安全、警告、危险、过期分类统计

### 🎯 高级功能
- **智能搜索** - 支持域名/备注关键词实时搜索
- **多维度排序** - 按剩余天数、状态、域名字母排序
- **CSV导出** - 导出关注域名列表为CSV格式
- **历史记录** - 自动保存查询历史，支持清空

### 🎨 用户体验
- **双主题切换** - 浅色/深色主题自由切换
- **响应式设计** - 适配不同分辨率屏幕
- **现代化UI** - 淡雅配色，视觉舒适
- **快捷操作** - Logo点击返回首页
- **Toast提示** - 操作反馈清晰明确

---

## 🚀 快速开始

### 环境要求

- **Go** 1.21 或更高版本
- **Node.js** 16.0 或更高版本
- **Wails CLI** v2.11.0

### 安装 Wails

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 克隆项目

```bash
git clone https://github.com/你的用户名/ssl-cert-checker.git
cd ssl-cert-checker
```

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install
cd ..
```

### 开发模式运行

```bash
wails dev
```

### 构建生产版本

```bash
wails build
```

构建完成后，可执行文件位于 `build/bin/ssl-cert-checker.exe`

---

## 📖 使用指南

### 1️⃣ 单个查询

在"单个查询"页面输入域名（如 `www.baidu.com`），点击"查询"按钮即可获取证书信息。

### 2️⃣ 批量查询

切换到"批量查询"页面，每行输入一个域名，点击"开始批量查询"。

```
www.baidu.com
github.com
www.google.com
```

### 3️⃣ 添加关注域名

1. 切换到"关注域名"页面
2. 点击"➕ 添加关注"按钮
3. 输入域名和可选的备注
4. 点击"添加"完成

### 4️⃣ 批量导入

支持CSV格式批量导入：

```csv
www.example1.com,生产环境主站
www.example2.com,测试环境API
api.example.com,支付接口
```

### 5️⃣ 手动录入证书

对于无法自动查询的域名（如内网环境），可以手动录入证书信息：

1. 在关注域名列表中找到目标域名
2. 点击"手动录入"
3. 输入证书的生效时间和过期时间
4. 保存

### 6️⃣ 配置通知

1. 在关注域名列表中点击域名的"通知设置"
2. 启用通知开关
3. 设置预警阈值（天数）
4. 保存

### 7️⃣ 导出数据

点击"📊 导出全部"或选择特定域名后"💾 批量导出"，即可导出CSV格式文件。

### 8️⃣ 系统设置

在"系统设置"页面可配置：

- **查询超时时间** - 默认5秒
- **预警阈值** - 全局默认预警天数
- **自动刷新间隔** - 定时刷新关注域名
- **主题切换** - 浅色/深色主题
- **历史记录保留** - 清理历史记录

---

## 🛠️ 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Wails v2.11.0
- **数据库**: SQLite (modernc.org/sqlite)
- **并发**: Goroutines + sync.Mutex

### 前端
- **技术**: 原生 JavaScript (ES6+)
- **样式**: CSS3 (Grid + Flexbox)
- **模块化**: ES Modules
- **构建**: Vite

### 数据存储
- **历史记录**: SQLite 本地数据库
- **关注域名**: SQLite 持久化存储
- **系统设置**: LocalStorage

---

## 📁 项目结构

```
ssl-cert-checker-web/
├── app.go                    # 后端核心逻辑
├── main.go                   # 程序入口
├── go.mod                    # Go依赖管理
├── wails.json                # Wails配置
├── build/                    # 构建配置
│   ├── appicon.png          # 应用图标
│   └── windows/             # Windows配置
└── frontend/                 # 前端代码
    ├── index.html           # 入口HTML
    ├── package.json         # 前端依赖
    └── src/
        ├── main.js          # 主逻辑 (79.9KB)
        ├── app.css          # 主样式 (57.6KB)
        ├── style.css        # 侧边栏样式 (4.6KB)
        ├── features.js      # 高级功能 (27.3KB)
        ├── features.css     # 功能样式 (16.6KB)
        └── assets/          # 静态资源
            └── fonts/       # 字体文件
```

---

## 📊 数据库设计

### certificates 表（历史记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| domain | TEXT | 域名 |
| issuer | TEXT | 颁发者 |
| subject | TEXT | 主体 |
| not_before | DATETIME | 生效时间 |
| not_after | DATETIME | 过期时间 |
| days_remaining | INTEGER | 剩余天数 |
| is_valid | BOOLEAN | 是否有效 |
| status | TEXT | 状态（safe/warning/danger/expired） |
| serial_number | TEXT | 序列号 |
| version | INTEGER | 版本 |
| query_time | DATETIME | 查询时间 |

### watched_domains 表（关注域名）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| domain | TEXT | 域名（唯一） |
| nickname | TEXT | 备注 |
| added_time | DATETIME | 添加时间 |
| last_check_time | DATETIME | 最后检查时间 |
| notify_enabled | BOOLEAN | 是否启用通知 |
| notify_threshold | INTEGER | 预警阈值（天） |
| is_manual | BOOLEAN | 是否手动录入 |
| manual_expire_date | DATETIME | 手动过期时间 |
| manual_start_date | DATETIME | 手动生效时间 |

---

## 🎨 界面预览

### 主题风格

**浅色主题**（默认）
- 全局背景：浅灰白渐变 (#f8fafc → #ffffff → #f1f5f9)
- 卡片背景：纯白 (#ffffff)
- 文字颜色：深灰黑 (#1e293b)
- 强调色：蓝色 (#3b82f6)

**深色主题**
- 全局背景：深蓝黑渐变 (#0f172a → #1e293b → #334155)
- 卡片背景：半透明深色 (rgba(30, 41, 59, 0.9))
- 文字颜色：浅灰白 (#e2e8f0)

---

## 🔑 核心API

### 后端API方法

```go
// 证书查询
CheckCertificate(domain string) QueryResult
BatchCheckCertificates(domains string) BatchQueryResult

// 关注域名管理
AddWatchedDomain(domain, nickname string) QueryResult
GetWatchedDomains() WatchedDomainsResult
RemoveWatchedDomain(id int64) error
UpdateWatchedDomainNickname(id int64, nickname string) error
RefreshWatchedDomain(domain string) QueryResult

// 通知配置
UpdateNotifySettings(id int64, enabled bool, threshold int) error
CheckNotifications() NotificationResult

// 手动录入
UpdateManualCertInfo(id int64, startDate, expireDate string) error
DisableManualMode(id int64) error

// 历史记录
GetHistory(limit int) HistoryQueryResult
ClearHistory() error

// 批量导入
ImportDomainsFromText(text string) ImportDomainsResult
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- Go代码遵循 `gofmt` 格式化规范
- JavaScript使用ES6+语法
- 提交信息使用英文，格式：`type: description`

---

## 📝 待开发功能

### 高优先级
- [ ] 桌面通知系统（证书即将过期时弹窗提醒）
- [ ] 自动刷新定时器（后台定时刷新所有关注域名）
- [ ] 证书链分析（展示完整证书链）

### 中优先级
- [ ] 证书对比功能
- [ ] 导出PDF报告
- [ ] 证书历史趋势图
- [ ] WHOIS查询集成
- [ ] 邮件通知

### 低优先级
- [ ] 多语言支持（国际化）
- [ ] API接口暴露
- [ ] 插件系统
- [ ] 云端同步
- [ ] 团队协作功能

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 👨‍💻 作者

**系统管理员**
- Email: luokx3@163.com
- GitHub: [@你的GitHub用户名](https://github.com/你的用户名)

---

## 🙏 致谢

- [Wails](https://wails.io/) - 强大的Go桌面应用框架
- [SQLite](https://www.sqlite.org/) - 轻量级嵌入式数据库
- 所有贡献者和使用者

---

## 📮 反馈与支持

如果您在使用过程中遇到问题或有任何建议，欢迎：

- 提交 [Issue](https://github.com/你的用户名/ssl-cert-checker/issues)
- 发送邮件至 luokx3@163.com
- 在 [Discussions](https://github.com/你的用户名/ssl-cert-checker/discussions) 中讨论

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！ ⭐**

Made with ❤️ by 系统管理员

</div>
