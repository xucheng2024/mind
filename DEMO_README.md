# 完整工作流程Demo

这里提供了两个Demo文件，展示普通字段和图片的完整上传、存储、获取和显示流程。

## 📁 Demo文件

### 1. `demo-complete-workflow.js` - 完整详细版
- 包含3个完整的Demo演示
- 详细的步骤说明和日志
- 完整的错误处理
- 可视化的测试界面

### 2. `demo-simple-examples.js` - 简化基础版
- 3个基础示例
- 核心代码展示
- 简单易懂

## 🔄 工作流程说明

### 普通字段流程

```
用户数据 → API上传 → 服务端AES加密 → 数据库存储
                     ↓
显示界面 ← API获取 ← 服务端AES解密 ← 数据库读取
```

**关键点:**
- 前端只处理原始数据
- 服务端自动AES加密所有字段
- 获取时自动解密返回

### 图片流程

```
原始图片 → 前端压缩 → base64转换 → API上传 → 服务端base64+salt加密 → 存储
                                      ↓
显示图片 ← Signed URL ← API获取 ← 服务端解密 ← 存储读取
```

**关键点:**
- 前端负责压缩优化
- 服务端负责加密存储
- 使用Signed URL安全访问（3年有效期）

## 🚀 如何运行Demo

### 浏览器中运行

1. 打开浏览器开发者工具
2. 在HTML页面中引入demo文件
3. 自动显示测试界面

```html
<!DOCTYPE html>
<html>
<head>
    <title>Demo测试</title>
</head>
<body>
    <script type="module" src="./demo-simple-examples.js"></script>
</body>
</html>
```

### Node.js中运行

```javascript
import { basicUserDataExample, basicImageExample } from './demo-simple-examples.js';

// 运行普通字段示例
await basicUserDataExample();

// 运行图片示例（需要提供图片文件）
const imageFile = new File([imageData], 'test.jpg', { type: 'image/jpeg' });
await basicImageExample(imageFile);
```

## 📝 Demo详解

### Demo 1: 普通字段操作

```javascript
// 1. 准备数据
const userData = {
  full_name: '张三',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  // ... 其他字段
};

// 2. 上传（自动加密）
const result = await apiClient.createUser(userData);

// 3. 获取（自动解密）
const user = await apiClient.getUser(clinicId, result.data.row_id);
console.log(user.data.full_name); // "张三" - 已解密
```

**流程说明:**
- `createUser`: 数据发送到服务端，自动AES加密后存储
- `getUser`: 从数据库读取，自动AES解密后返回
- 前端无需处理任何加密逻辑

### Demo 2: 图片操作

```javascript
// 1. 压缩图片
const compressed = await compressImage(imageFile);

// 2. 上传图片（自动加密存储）
const base64 = await fileToBase64(compressed);
const uploadResult = await apiClient.uploadFile('selfies', filename, base64, 'image/jpeg');

// 3. 获取访问URL
const urlResult = await apiClient.getSignedUrl('selfies', filename, 94608000);

// 4. 显示图片
<img src={urlResult.data.signedUrl} alt="图片" />
```

**流程说明:**
- `uploadFile`: 图片base64数据发送到服务端，自动base64+salt加密存储
- `getSignedUrl`: 获取3年有效期的安全访问URL
- 直接用URL显示图片，浏览器会自动处理解密

### Demo 3: 组合操作

```javascript
// 1. 先上传图片获取URL
const imageResult = await basicImageExample(imageFile);

// 2. 创建用户记录（包含图片URL）
const userData = {
  full_name: '李四',
  selfie: imageResult.url, // 图片URL
  // ... 其他字段
};

const user = await apiClient.createUser(userData);

// 3. 获取用户数据（包含图片URL）
const fullUser = await apiClient.getUser(clinicId, user.data.row_id);

// 4. 显示用户头像
<img src={fullUser.data.selfie} alt="用户头像" />
```

**流程说明:**
- 图片URL也会被AES加密存储
- 获取用户时图片URL自动解密
- 可以直接使用解密后的URL显示图片

## 🔒 安全机制

### 数据加密
- **普通字段**: AES-256加密
- **图片文件**: base64+salt加密
- **图片URL**: AES-256加密（存储在用户记录中时）

### 访问控制
- **图片访问**: 通过Signed URL，3年有效期
- **数据访问**: 通过API认证和clinic_id隔离

### 环境要求
```bash
# 必须设置的环境变量
AES_KEY=Qw8zT1pL6vB2nX4rS7yD9eF3hJ5kM8pR
```

## ⚠️ 注意事项

1. **环境变量**: 必须设置`AES_KEY`环境变量
2. **图片格式**: 建议使用JPEG格式，压缩效果更好
3. **文件大小**: 会自动压缩到0.5MB以下
4. **URL过期**: Signed URL有3年有效期，过期需重新获取
5. **错误处理**: 所有操作都有详细的错误提示

## 🎯 实际应用

在实际项目中：

1. **SelfiePage.jsx** 使用图片上传流程
2. **AuthorizationPage.jsx** 使用签名图片上传流程  
3. **SubmitPage.jsx** 使用用户数据创建流程
4. **数据显示页面** 使用数据获取和图片显示流程

这些Demo展示了完整的数据流向，可以直接参考用于实际开发。
