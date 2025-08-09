/**
 * 完整工作流程Demo
 * 
 * 展示：
 * 1. 普通字段上传到数据库并获取显示
 * 2. 图片上传并获取显示
 */

import { apiClient } from './src/lib/api.js';
import { compressImage, fileToBase64 } from './src/lib/imageUtils.js';

class CompleteWorkflowDemo {
  constructor() {
    this.clinicId = 'demo-clinic-001';
  }

  /**
   * Demo 1: 普通字段的完整流程
   */
  async demonstrateUserDataFlow() {
    console.log('🔄 Demo 1: 普通字段上传到数据库并获取显示\n');

    try {
      // Step 1: 准备用户数据
      const userData = {
        full_name: '张三',
        id_last4: '1234',
        dob: '15/06/1990',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        postal_code: '100000',
        block_no: '123',
        street: '中山路',
        building: 'A栋',
        floor: '10',
        unit: '1001',
        other_health_notes: '无特殊病史',
        is_guardian: false,
        signature: '', // 暂时为空
        selfie: '', // 暂时为空
        clinic_id: this.clinicId,
        user_id: 'demo-user-' + Date.now(),
        created_at: new Date().toISOString()
      };

      console.log('📤 Step 1: 上传用户数据到数据库');
      console.log('原始数据:', {
        姓名: userData.full_name,
        身份证后4位: userData.id_last4,
        出生日期: userData.dob,
        电话: userData.phone,
        邮箱: userData.email
      });

      // Step 2: 通过API上传（服务端会AES加密）
      const createResult = await apiClient.createUser(userData);
      
      if (!createResult.success) {
        throw new Error('用户创建失败');
      }

      console.log('✅ 用户创建成功，row_id:', createResult.data.row_id);

      // Step 3: 从数据库获取用户数据（服务端会AES解密）
      console.log('\n📥 Step 2: 从数据库获取用户数据');
      
      const getResult = await apiClient.getUser(this.clinicId, createResult.data.row_id);
      
      if (!getResult.success) {
        throw new Error('获取用户数据失败');
      }

      console.log('✅ 用户数据获取成功');
      console.log('解密后数据:', {
        姓名: getResult.data.full_name,
        身份证后4位: getResult.data.id_last4,
        出生日期: getResult.data.dob,
        电话: getResult.data.phone,
        邮箱: getResult.data.email,
        地址: `${getResult.data.street} ${getResult.data.building} ${getResult.data.floor}层 ${getResult.data.unit}室`
      });

      console.log('\n🎉 普通字段流程完成！');
      console.log('总结: 数据在服务端自动AES加密存储，获取时自动解密\n');

      return {
        originalData: userData,
        savedData: createResult.data,
        retrievedData: getResult.data
      };

    } catch (error) {
      console.error('❌ 普通字段流程失败:', error.message);
      throw error;
    }
  }

  /**
   * Demo 2: 图片的完整流程
   */
  async demonstrateImageFlow(imageFile) {
    console.log('🖼️ Demo 2: 图片上传并获取显示\n');

    try {
      // Step 1: 压缩图片
      console.log('📦 Step 1: 压缩图片');
      const originalSize = imageFile.size;
      const compressedImage = await compressImage(imageFile);
      const compressedSize = compressedImage.size;
      
      console.log(`原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`压缩后: ${(compressedSize / 1024).toFixed(2)} KB`);
      console.log(`压缩率: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);

      // Step 2: 转换为base64并上传
      console.log('\n☁️ Step 2: 上传图片到存储');
      const base64Data = await fileToBase64(compressedImage);
      const filename = `demo_${Date.now()}_${imageFile.name}`;

      // 上传到storage（服务端会base64+salt加密）
      const uploadResult = await apiClient.uploadFile('selfies', filename, base64Data, 'image/jpeg');
      
      if (!uploadResult.success) {
        throw new Error('图片上传失败');
      }

      console.log('✅ 图片上传成功:', uploadResult.data.path);

      // Step 3: 获取signed URL
      console.log('\n🔗 Step 3: 获取图片访问URL');
      const signedUrlResult = await apiClient.getSignedUrl('selfies', filename, 94608000); // 3年过期
      
      if (!signedUrlResult.success) {
        throw new Error('获取signed URL失败');
      }

      const signedUrl = signedUrlResult.data.signedUrl;
      console.log('✅ Signed URL获取成功');
      console.log('URL:', signedUrl.substring(0, 80) + '...');
      console.log('过期时间:', new Date(signedUrlResult.data.expiresAt).toLocaleString());

      // Step 4: 在页面中显示图片
      console.log('\n🖼️ Step 4: 显示图片');
      this.displayImageInPage(signedUrl, filename);

      console.log('\n🎉 图片流程完成！');
      console.log('总结: 图片压缩 → 加密存储 → 获取signed URL → 显示');

      return {
        originalFile: imageFile,
        compressedFile: compressedImage,
        uploadPath: uploadResult.data.path,
        signedUrl: signedUrl,
        expiresAt: signedUrlResult.data.expiresAt
      };

    } catch (error) {
      console.error('❌ 图片流程失败:', error.message);
      throw error;
    }
  }

  /**
   * Demo 3: 完整用户注册流程（包含图片）
   */
  async demonstrateCompleteRegistration(imageFile) {
    console.log('🚀 Demo 3: 完整用户注册流程\n');

    try {
      // Step 1: 处理图片
      const imageResult = await this.demonstrateImageFlow(imageFile);

      // Step 2: 创建包含图片URL的用户数据
      console.log('\n👤 Step 5: 创建包含图片的用户记录');
      
      const userData = {
        full_name: '李四',
        id_last4: '5678',
        dob: '20/03/1985',
        phone: '13900139000',
        email: 'lisi@example.com',
        postal_code: '200000',
        block_no: '456',
        street: '南京路',
        building: 'B栋',
        floor: '8',
        unit: '802',
        other_health_notes: '有轻微高血压',
        is_guardian: true,
        signature: '', // 实际应用中会有签名URL
        selfie: imageResult.signedUrl, // 图片URL
        clinic_id: this.clinicId,
        user_id: 'demo-user-complete-' + Date.now(),
        created_at: new Date().toISOString()
      };

      // 创建用户记录
      const createResult = await apiClient.createUser(userData);
      
      if (!createResult.success) {
        throw new Error('完整用户创建失败');
      }

      console.log('✅ 包含图片的用户记录创建成功');

      // Step 3: 获取完整用户数据
      console.log('\n📥 Step 6: 获取完整用户数据（包含图片）');
      
      const getResult = await apiClient.getUser(this.clinicId, createResult.data.row_id);
      
      if (!getResult.success) {
        throw new Error('获取完整用户数据失败');
      }

      console.log('✅ 完整用户数据获取成功');
      console.log('用户信息:', {
        姓名: getResult.data.full_name,
        电话: getResult.data.phone,
        是否监护人: getResult.data.is_guardian ? '是' : '否',
        健康备注: getResult.data.other_health_notes,
        自拍照URL: getResult.data.selfie ? '已设置' : '未设置'
      });

      // Step 4: 显示用户的自拍照
      if (getResult.data.selfie) {
        console.log('\n🖼️ Step 7: 显示用户自拍照');
        this.displayImageInPage(getResult.data.selfie, '用户自拍照');
      }

      console.log('\n🎉 完整注册流程完成！');

      return {
        userData: getResult.data,
        imageData: imageResult
      };

    } catch (error) {
      console.error('❌ 完整注册流程失败:', error.message);
      throw error;
    }
  }

  /**
   * 在页面中显示图片
   */
  displayImageInPage(imageUrl, title = '图片') {
    if (typeof window === 'undefined') {
      console.log('📱 浏览器环境外，无法显示图片');
      return;
    }

    // 创建图片容器
    let container = document.getElementById('demo-images');
    if (!container) {
      container = document.createElement('div');
      container.id = 'demo-images';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
        background: white;
        border: 2px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
      `;
      document.body.appendChild(container);

      // 添加标题
      const header = document.createElement('h3');
      header.textContent = '📸 图片展示';
      header.style.cssText = 'margin: 0 0 15px 0; color: #333;';
      container.appendChild(header);
    }

    // 创建图片元素
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'margin-bottom: 15px; text-align: center;';

    const label = document.createElement('p');
    label.textContent = title;
    label.style.cssText = 'margin: 0 0 8px 0; font-size: 14px; color: #666;';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = title;
    img.style.cssText = `
      max-width: 100%;
      max-height: 150px;
      border-radius: 6px;
      border: 1px solid #ddd;
      object-fit: cover;
    `;

    img.onload = () => {
      console.log(`✅ 图片 "${title}" 显示成功`);
    };

    img.onerror = () => {
      console.log(`❌ 图片 "${title}" 加载失败`);
      img.style.display = 'none';
      label.textContent = `${title} - 加载失败`;
      label.style.color = 'red';
    };

    imgContainer.appendChild(label);
    imgContainer.appendChild(img);
    container.appendChild(imgContainer);
  }

  /**
   * 创建测试界面
   */
  createTestInterface() {
    if (typeof window === 'undefined') {
      console.log('📱 非浏览器环境，跳过界面创建');
      return;
    }

    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 800px;">
        <h1>🔄 完整工作流程Demo</h1>
        
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Demo说明:</h3>
          <ul>
            <li><strong>Demo 1:</strong> 普通字段上传到数据库并获取显示</li>
            <li><strong>Demo 2:</strong> 图片上传并获取显示</li>
            <li><strong>Demo 3:</strong> 完整用户注册流程（包含图片）</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0;">
          <button id="runDemo1" style="margin: 10px; padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            🔄 运行Demo 1 (普通字段)
          </button>
          
          <input type="file" id="imageInput" accept="image/*" style="margin: 10px;" />
          <button id="runDemo2" style="margin: 10px; padding: 12px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            🖼️ 运行Demo 2 (图片)
          </button>
          
          <button id="runDemo3" style="margin: 10px; padding: 12px 20px; background: #6f42c1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            🚀 运行Demo 3 (完整流程)
          </button>
        </div>
        
        <div id="console" style="background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 12px; height: 400px; overflow-y: auto; white-space: pre-wrap;">
等待Demo运行...
        </div>
      </div>
    `;

    const consoleDiv = document.getElementById('console');
    const originalLog = console.log;
    const originalError = console.error;

    // 重定向console到页面
    console.log = (...args) => {
      originalLog(...args);
      consoleDiv.textContent += args.join(' ') + '\n';
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };

    console.error = (...args) => {
      originalError(...args);
      consoleDiv.textContent += '❌ ' + args.join(' ') + '\n';
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };

    // 绑定按钮事件
    document.getElementById('runDemo1').addEventListener('click', async () => {
      consoleDiv.textContent = '';
      try {
        await this.demonstrateUserDataFlow();
      } catch (error) {
        console.error('Demo 1 失败:', error.message);
      }
    });

    document.getElementById('runDemo2').addEventListener('click', async () => {
      const input = document.getElementById('imageInput');
      if (!input.files[0]) {
        console.error('请先选择图片文件');
        return;
      }
      
      consoleDiv.textContent = '';
      try {
        await this.demonstrateImageFlow(input.files[0]);
      } catch (error) {
        console.error('Demo 2 失败:', error.message);
      }
    });

    document.getElementById('runDemo3').addEventListener('click', async () => {
      const input = document.getElementById('imageInput');
      if (!input.files[0]) {
        console.error('请先选择图片文件');
        return;
      }
      
      consoleDiv.textContent = '';
      try {
        await this.demonstrateCompleteRegistration(input.files[0]);
      } catch (error) {
        console.error('Demo 3 失败:', error.message);
      }
    });
  }
}

// 使用示例
async function runCompleteDemo() {
  console.log('🎯 完整工作流程Demo启动\n');
  
  const demo = new CompleteWorkflowDemo();
  
  // 如果在浏览器环境，创建测试界面
  if (typeof window !== 'undefined') {
    demo.createTestInterface();
  } else {
    // Node.js环境的示例
    console.log('Node.js环境示例:');
    console.log('const demo = new CompleteWorkflowDemo();');
    console.log('await demo.demonstrateUserDataFlow();');
    console.log('await demo.demonstrateImageFlow(imageFile);');
    console.log('await demo.demonstrateCompleteRegistration(imageFile);');
  }
}

// 导出
export default CompleteWorkflowDemo;

// 浏览器环境自动运行
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', runCompleteDemo);
}

// 控制台使用示例
export { runCompleteDemo };
