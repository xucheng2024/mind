# 自定义验证码登录系统

## 更改概述

我已经将 Supabase Magic Link 登录替换为自定义的5位数字验证码系统，使用 Resend 发送邮件。

## 新功能特点

1. **5位数字验证码**：自动生成随机5位数字
2. **5分钟过期时间**：验证码在5分钟后自动过期
3. **失败次数限制**：最多允许5次验证失败
4. **Resend 邮件服务**：使用专业的邮件发送服务
5. **实时倒计时**：显示验证码剩余有效时间

## 文件修改

### 1. LoginPage.jsx
- 移除了 Supabase Magic Link 逻辑
- 添加了自定义验证码生成和验证
- 添加了两阶段 UI（邮箱输入 → 验证码输入）
- 添加了过期时间检查和重发功能

### 2. server.js (新文件)
- Express 服务器处理 API 请求
- 集成 Resend 邮件发送服务
- 提供 `/api/send-verification` 端点

### 3. package.json
- 添加了新的依赖：express, cors, dotenv, concurrently
- 添加了新的脚本：server, dev:full
- 设置为 ES 模块类型

### 4. .env
- 添加了 RESEND_API_KEY 环境变量

## 设置步骤

### 1. 获取 Resend API Key
1. 访问 [resend.com](https://resend.com)
2. 创建账户并获取 API Key
3. 在 `.env` 文件中设置 `RESEND_API_KEY`

### 2. 配置发送域名
在 `server.js` 中将 `noreply@yourdomain.com` 替换为你的实际域名。

### 3. 启动应用

```bash
# 同时启动前端和后端
npm run dev:full

# 或者分别启动
npm run server  # 启动 API 服务器 (端口 3001)
npm run dev     # 启动 Vite 开发服务器 (端口 5173)
```

## 工作流程

1. 用户输入邮箱地址
2. 系统生成5位数字验证码
3. 通过 Resend 发送验证码邮件
4. 用户输入验证码
5. 系统验证码是否正确且未过期
6. 验证成功后创建用户会话并跳转到 profile 页面

## 安全特性

- **时间限制**：验证码5分钟后自动过期
- **尝试限制**：最多5次验证失败
- **一次性使用**：验证码使用后失效
- **随机生成**：每次都生成新的随机验证码

## 注意事项

1. 确保 RESEND_API_KEY 已正确设置
2. 确保发送域名已在 Resend 中验证
3. 生产环境中应该使用 HTTPS
4. 可以考虑添加更多安全措施，如 IP 限制等
