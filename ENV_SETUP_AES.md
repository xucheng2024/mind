# AES加密环境变量设置

## ⚠️ 重要：必须设置服务端环境变量

**只有服务端需要设置AES密钥环境变量，前端不需要AES加密！**

在 `.env` 文件中添加：

```bash
# AES Encryption Configuration - 必须设置！
# 32字符的强密钥用于服务端数据加密
AES_KEY=Qw8zT1pL6vB2nX4rS7yD9eF3hJ5kM8pR
```

## 生成强密钥

### 方法1: 使用OpenSSL
```bash
openssl rand -base64 32
```

### 方法2: 使用Node.js
```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('base64'));
```

### 方法3: 手动生成32位字符串
确保密钥至少32个字符，例如：
```
MySecretKey123456789012345678901
```

## 验证设置

服务端启动时会显示：
- ✅ `🔐 服务端API已启用AES加密` - 表示AES加密已启用
- ⚠️ `使用默认AES密钥` - 表示需要设置环境变量

## 错误处理

如果没有设置环境变量，应用会显示错误：

### 服务端错误
```
❌ 错误: 未设置 AES_KEY 环境变量
Error: AES_KEY environment variable is required
```



### 密钥长度错误
```
❌ 错误: AES_KEY 长度必须至少32个字符
Error: AES_KEY must be at least 32 characters long
```

## 架构说明

- **服务端加密**: 所有用户数据使用AES-256加密后存储到数据库
- **前端无加密**: 前端不处理任何敏感数据加密，所有加密由服务端统一处理
- **文件加密**: 图片文件通过storage API使用base64+salt加密存储

## 安全注意事项

1. **只需设置服务端环境变量** - 前端不需要AES密钥
2. **使用强密钥** - 至少32个字符
3. **定期轮换密钥**
4. **备份密钥以防数据丢失**
5. **不要提交密钥到版本控制**
