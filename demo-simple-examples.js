/**
 * 简化版Demo示例
 * 展示最基本的上传和获取流程
 */

import { apiClient } from './src/lib/api.js';
import { compressImage, fileToBase64 } from './src/lib/imageUtils.js';

/**
 * 示例1: 普通字段的基本操作
 */
async function basicUserDataExample() {
  console.log('📝 示例1: 普通字段操作\n');

  // 1. 准备数据
  const userData = {
    full_name: '张三',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    clinic_id: 'clinic-001',
    user_id: 'user-' + Date.now(),
    // ... 其他字段
  };

  try {
    // 2. 上传到数据库（自动AES加密）
    console.log('📤 上传用户数据...');
    const createResult = await apiClient.createUser(userData);
    console.log('✅ 创建成功，ID:', createResult.data.row_id);

    // 3. 从数据库获取（自动AES解密）
    console.log('📥 获取用户数据...');
    const getResult = await apiClient.getUser('clinic-001', createResult.data.row_id);
    console.log('✅ 获取成功:', {
      姓名: getResult.data.full_name,
      电话: getResult.data.phone,
      邮箱: getResult.data.email
    });

    return getResult.data;
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
}

/**
 * 示例2: 图片的基本操作
 */
async function basicImageExample(imageFile) {
  console.log('🖼️ 示例2: 图片操作\n');

  try {
    // 1. 压缩图片
    console.log('📦 压缩图片...');
    const compressedImage = await compressImage(imageFile);
    console.log(`压缩: ${(imageFile.size/1024).toFixed(1)}KB → ${(compressedImage.size/1024).toFixed(1)}KB`);

    // 2. 上传图片（自动加密存储）
    console.log('☁️ 上传图片...');
    const base64Data = await fileToBase64(compressedImage);
    const filename = `image_${Date.now()}.jpg`;
    
    const uploadResult = await apiClient.uploadFile('selfies', filename, base64Data, 'image/jpeg');
    console.log('✅ 上传成功:', uploadResult.data.path);

    // 3. 获取访问URL
    console.log('🔗 获取URL...');
    const urlResult = await apiClient.getSignedUrl('selfies', filename, 94608000);
    console.log('✅ URL获取成功，过期时间:', new Date(urlResult.data.expiresAt).toLocaleString());

    // 4. 在页面显示图片
    if (typeof window !== 'undefined') {
      displayImage(urlResult.data.signedUrl, '上传的图片');
    }

    return {
      path: uploadResult.data.path,
      url: urlResult.data.signedUrl
    };
  } catch (error) {
    console.error('❌ 图片操作失败:', error.message);
  }
}

/**
 * 示例3: 组合操作（用户+图片）
 */
async function combinedExample(imageFile) {
  console.log('🚀 示例3: 组合操作\n');

  try {
    // 1. 先处理图片
    const imageResult = await basicImageExample(imageFile);
    
    // 2. 创建包含图片的用户记录
    const userData = {
      full_name: '李四',
      phone: '13900139000',
      email: 'lisi@example.com',
      selfie: imageResult.url, // 图片URL
      clinic_id: 'clinic-001',
      user_id: 'user-with-image-' + Date.now(),
    };

    console.log('👤 创建用户（包含图片）...');
    const createResult = await apiClient.createUser(userData);
    
    console.log('📥 获取完整用户数据...');
    const getResult = await apiClient.getUser('clinic-001', createResult.data.row_id);
    
    console.log('✅ 完整流程成功!');
    console.log('用户:', getResult.data.full_name);
    console.log('图片URL已保存:', getResult.data.selfie ? '是' : '否');

    // 显示用户的图片
    if (typeof window !== 'undefined' && getResult.data.selfie) {
      displayImage(getResult.data.selfie, '用户头像');
    }

    return getResult.data;
  } catch (error) {
    console.error('❌ 组合操作失败:', error.message);
  }
}

/**
 * 在页面显示图片的工具函数
 */
function displayImage(imageUrl, title) {
  const container = document.getElementById('image-display') || createImageContainer();
  
  const div = document.createElement('div');
  div.style.cssText = 'margin: 10px 0; text-align: center;';
  
  const label = document.createElement('p');
  label.textContent = title;
  label.style.cssText = 'margin: 5px 0; font-weight: bold;';
  
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.cssText = 'max-width: 200px; max-height: 200px; border: 1px solid #ccc; border-radius: 4px;';
  
  div.appendChild(label);
  div.appendChild(img);
  container.appendChild(div);
}

function createImageContainer() {
  const container = document.createElement('div');
  container.id = 'image-display';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    max-height: 500px;
    overflow-y: auto;
    background: white;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  `;
  
  const title = document.createElement('h3');
  title.textContent = '📸 图片显示';
  title.style.margin = '0 0 15px 0';
  container.appendChild(title);
  
  document.body.appendChild(container);
  return container;
}

/**
 * 创建简单的测试界面
 */
function createSimpleInterface() {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>📋 基本操作Demo</h1>
      
      <div style="margin: 20px 0;">
        <button onclick="runExample1()" style="margin: 5px; padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 4px;">
          运行示例1 (普通字段)
        </button>
        
        <input type="file" id="fileInput" accept="image/*" style="margin: 5px;" />
        <button onclick="runExample2()" style="margin: 5px; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px;">
          运行示例2 (图片)
        </button>
        
        <button onclick="runExample3()" style="margin: 5px; padding: 10px 15px; background: #6f42c1; color: white; border: none; border-radius: 4px;">
          运行示例3 (组合)
        </button>
      </div>
      
      <div id="log" style="background: #f8f9fa; padding: 15px; border-radius: 4px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap;">
等待运行...
      </div>
    </div>
  `;

  // 重定向console到页面
  const logDiv = document.getElementById('log');
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    logDiv.textContent += args.join(' ') + '\n';
    logDiv.scrollTop = logDiv.scrollHeight;
  };

  console.error = (...args) => {
    originalError(...args);
    logDiv.textContent += '❌ ' + args.join(' ') + '\n';
    logDiv.scrollTop = logDiv.scrollHeight;
  };

  // 全局函数
  window.runExample1 = async () => {
    logDiv.textContent = '';
    await basicUserDataExample();
  };

  window.runExample2 = async () => {
    const input = document.getElementById('fileInput');
    if (!input.files[0]) {
      console.error('请先选择图片文件');
      return;
    }
    logDiv.textContent = '';
    await basicImageExample(input.files[0]);
  };

  window.runExample3 = async () => {
    const input = document.getElementById('fileInput');
    if (!input.files[0]) {
      console.error('请先选择图片文件');
      return;
    }
    logDiv.textContent = '';
    await combinedExample(input.files[0]);
  };
}

// 浏览器环境自动创建界面
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', createSimpleInterface);
}

// 导出函数
export {
  basicUserDataExample,
  basicImageExample,
  combinedExample,
  createSimpleInterface
};
