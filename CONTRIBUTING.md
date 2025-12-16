# 贡献指南

感谢您考虑为 SSL证书查询工具 做出贡献！

## 📋 行为准则

请始终保持友善和尊重。我们致力于为每个人提供一个无骚扰的体验。

## 🐛 报告问题

在提交问题之前：

1. **搜索现有 Issues** - 确保问题尚未被报告
2. **使用最新版本** - 确认问题在最新版本中仍然存在
3. **提供详细信息** - 包括：
   - 操作系统版本
   - Go 版本
   - 完整的错误信息
   - 复现步骤

### Issue 模板

```markdown
**描述问题**
清晰简洁地描述问题

**复现步骤**
1. 点击 '...'
2. 输入 '...'
3. 看到错误

**预期行为**
描述您期望发生什么

**环境信息**
- OS: [例如 Windows 11]
- Go版本: [例如 1.21.5]
- 应用版本: [例如 v1.0.0]

**截图**
如果可能，添加截图
```

## 💡 提出新功能

我们欢迎功能建议！请：

1. 先在 Discussions 中讨论
2. 说明功能的用途和价值
3. 如果可能，提供实现思路

## 🔧 开发贡献

### 开发环境设置

```bash
# 1. Fork 项目并克隆
git clone https://github.com/你的用户名/ssl-cert-checker.git
cd ssl-cert-checker

# 2. 安装依赖
cd frontend
npm install
cd ..

# 3. 运行开发模式
wails dev
```

### 代码规范

#### Go 代码

- 使用 `gofmt` 格式化代码
- 遵循 [Effective Go](https://go.dev/doc/effective_go) 指南
- 添加必要的注释
- 错误处理要完善

```go
// 好的示例
func CheckCertificate(domain string) QueryResult {
    if domain == "" {
        return QueryResult{
            Success: false,
            Error:   "域名不能为空",
        }
    }
    // ...
}
```

#### JavaScript 代码

- 使用 ES6+ 语法
- 使用有意义的变量名
- 添加必要的注释
- 保持函数简短

```javascript
// 好的示例
async function loadWatchedDomains() {
    try {
        const result = await GetWatchedDomains();
        if (result.success) {
            renderDomains(result.domains);
        }
    } catch (error) {
        showError(`加载失败: ${error.message}`);
    }
}
```

#### CSS 代码

- 使用有意义的类名
- 遵循BEM命名规范（可选）
- 保持样式模块化
- 注释复杂的样式

```css
/* 好的示例 */
.domain-card {
    display: flex;
    padding: 16px;
    border-radius: 12px;
    background: #ffffff;
}

.domain-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### 提交规范

使用语义化的提交信息：

```
<type>: <description>

[optional body]

[optional footer]
```

**Type 类型：**

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链更新

**示例：**

```
feat: 添加桌面通知功能

- 实现证书过期桌面通知
- 支持自定义通知间隔
- 添加通知开关设置

Closes #123
```

### Pull Request 流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发并测试**
   - 确保代码可以正常编译
   - 测试新功能是否正常工作
   - 确认没有破坏现有功能

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 你的功能描述"
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - 填写清晰的标题和描述
   - 关联相关的 Issue
   - 如果有截图，请附上

5. **代码审查**
   - 回应审查意见
   - 根据反馈修改代码
   - 保持 PR 简洁（一个 PR 解决一个问题）

### PR 模板

```markdown
**描述**
简要描述这个 PR 做了什么

**改动类型**
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重大变更
- [ ] 文档更新

**测试**
- [ ] 本地测试通过
- [ ] 构建成功
- [ ] 无新的警告或错误

**关联 Issue**
Closes #(issue编号)

**截图**
如果有UI变更，请添加截图
```

## 📦 构建和发布

### 本地构建

```bash
# 开发构建
wails dev

# 生产构建
wails build

# 构建特定平台
wails build -platform windows/amd64
```

### 测试检查清单

在提交 PR 前，请确认：

- [ ] 代码可以成功编译
- [ ] 所有功能正常工作
- [ ] UI 显示正常（浅色/深色主题）
- [ ] 没有控制台错误
- [ ] 数据库操作正常
- [ ] 已更新相关文档

## 🎨 UI/UX 设计原则

### 配色规范

**浅色主题：**
- 背景：#f8fafc → #ffffff
- 文字：#1e293b
- 强调：#3b82f6
- 边框：#cbd5e1

**深色主题：**
- 背景：#0f172a → #1e293b
- 文字：#e2e8f0
- 强调：#3b82f6
- 边框：rgba(71, 85, 105, 0.5)

### 交互规范

- 按钮悬停有明显反馈
- 操作完成显示 Toast 提示
- 加载状态显示动画
- 错误提示清晰明确

## 📚 开发资源

- [Wails 文档](https://wails.io/docs/introduction)
- [Go 标准库](https://pkg.go.dev/std)
- [MDN Web 文档](https://developer.mozilla.org/)

## 💬 获取帮助

如果您有任何疑问：

- 查看 [README.md](README.md)
- 搜索 [Issues](https://github.com/你的用户名/ssl-cert-checker/issues)
- 在 [Discussions](https://github.com/你的用户名/ssl-cert-checker/discussions) 提问
- 发送邮件到 luokx3@163.com

## 🙏 致谢

感谢所有贡献者的付出！

---

再次感谢您的贡献！❤️
