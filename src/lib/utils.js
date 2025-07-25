// 工具函数集合
import CryptoJS from 'crypto-js';

export function hash(val) {
  return val ? CryptoJS.SHA256(val.trim().toLowerCase()).toString() : '';
}

export function encrypt(val, key) {
  return val ? CryptoJS.AES.encrypt(val.toString(), key).toString() : '';
}

export function isPhone(val) {
  return /^\d+$/.test(val);
}

export function isEmail(val) {
  return val.includes('@');
}

export async function sha256Hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim().toLowerCase());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 