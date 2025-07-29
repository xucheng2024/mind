# PWA Performance Features Guide

## 🚀 如何使用新功能

### **1. 启动应用**
```bash
# 开发模式
npm run dev -- --host

# 生产构建
npm run build
npm run preview
```

### **2. 性能监控**

#### **实时性能指标**
- 右上角显示实时性能数据
- FCP (First Contentful Paint) - 首次内容绘制
- LCP (Largest Contentful Paint) - 最大内容绘制  
- FID (First Input Delay) - 首次输入延迟
- CLS (Cumulative Layout Shift) - 累积布局偏移

#### **性能评分**
- 🟢 **绿色** - 优秀 (90+)
- 🟡 **黄色** - 需要改进 (50-89)
- 🔴 **红色** - 较差 (<50)

### **3. 懒加载图片**

#### **使用方法：**
```jsx
import LazyImage from '../components/LazyImage';

<LazyImage
  src="/image.jpg"
  alt="Description"
  className="w-full h-32 rounded-lg"
  onLoad={() => console.log('Image loaded!')}
/>
```

#### **特性：**
- ✅ 只在进入视口时加载
- ✅ 加载时显示占位符
- ✅ 加载失败时显示错误状态
- ✅ 平滑的淡入动画

### **4. Toast 通知**

#### **使用方法：**
```jsx
import toast from 'react-hot-toast';

// 成功通知
toast.success('操作成功！');

// 错误通知
toast.error('操作失败！');

// 信息通知
toast.info('提示信息');

// 加载通知
const loadingToast = toast.loading('正在处理...');
// 完成后
toast.dismiss(loadingToast);
toast.success('处理完成！');
```

#### **通知类型：**
- 🟢 **Success** - 成功操作
- 🔴 **Error** - 错误提示
- 🔵 **Info** - 信息提示
- ⏳ **Loading** - 加载状态

### **5. 性能优化工具**

#### **防抖函数：**
```jsx
import { debounce } from '../lib/performance';

const handleSearch = debounce((searchTerm) => {
  // 搜索逻辑
}, 300);
```

#### **节流函数：**
```jsx
import { throttle } from '../lib/performance';

const handleScroll = throttle(() => {
  // 滚动处理逻辑
}, 100);
```

#### **性能测量：**
```jsx
import { measurePerformance } from '../lib/performance';

measurePerformance('Button Click', () => {
  // 需要测量的代码
  console.log('This action was measured');
});
```

### **6. 动画效果**

#### **页面动画：**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content with animation
</motion.div>
```

#### **悬停效果：**
```jsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Interactive element
</motion.div>
```

### **7. 缓存管理**

#### **清理旧缓存：**
```jsx
import { clearOldCaches } from '../lib/performance';

// 清理旧版本缓存
await clearOldCaches();
```

#### **检查更新：**
```jsx
import { checkForUpdates } from '../lib/performance';

// 检查 Service Worker 更新
await checkForUpdates();
```

### **8. 网络监控**

#### **网络状态监听：**
```jsx
import { monitorNetworkStatus } from '../lib/performance';

monitorNetworkStatus((status) => {
  console.log('Network changed:', status);
  // status.effectiveType - 网络类型 (4g, 3g, 2g, slow-2g)
  // status.downlink - 下载速度 (Mbps)
  // status.rtt - 往返时间 (ms)
  // status.saveData - 是否开启省流量模式
});
```

### **9. 内存管理**

#### **内存使用监控：**
```jsx
import { cleanupMemory } from '../lib/performance';

// 显示内存使用情况
cleanupMemory();
```

### **10. 实际使用示例**

#### **在表单中使用：**
```jsx
import { debounce } from '../lib/performance';
import toast from 'react-hot-toast';

const FormComponent = () => {
  const handleSubmit = debounce(async (formData) => {
    try {
      const loadingToast = toast.loading('提交中...');
      
      // 提交逻辑
      await submitForm(formData);
      
      toast.dismiss(loadingToast);
      toast.success('提交成功！');
    } catch (error) {
      toast.error('提交失败，请重试');
    }
  }, 500);

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
};
```

#### **在列表中使用懒加载：**
```jsx
import LazyImage from '../components/LazyImage';

const ProductList = ({ products }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <LazyImage
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <h3>{product.name}</h3>
        </div>
      ))}
    </div>
  );
};
```

## 🎯 性能最佳实践

### **1. 图片优化**
- 使用 WebP 格式
- 提供多种尺寸
- 启用懒加载
- 压缩图片大小

### **2. 代码分割**
- 按路由分割
- 按功能分割
- 动态导入

### **3. 缓存策略**
- 静态资源长期缓存
- API 数据短期缓存
- 离线优先策略

### **4. 用户体验**
- 骨架屏加载
- 平滑动画
- 即时反馈
- 错误处理

## 📊 性能指标目标

| 指标 | 优秀 | 需要改进 | 较差 |
|------|------|----------|------|
| FCP  | < 1.8s | 1.8s - 3s | > 3s |
| LCP  | < 2.5s | 2.5s - 4s | > 4s |
| FID  | < 100ms | 100ms - 300ms | > 300ms |
| CLS  | < 0.1 | 0.1 - 0.25 | > 0.25 |

## 🔧 调试工具

### **Chrome DevTools**
1. 打开 Performance 标签
2. 记录页面加载
3. 分析性能瓶颈

### **Lighthouse**
1. 运行性能审计
2. 查看优化建议
3. 监控 Core Web Vitals

### **React DevTools**
1. 检查组件渲染
2. 分析内存使用
3. 优化重渲染 