// Utility function collection
import CryptoJS from 'crypto-js';

export function hash(val) {
  return val ? CryptoJS.SHA256(val.trim().toLowerCase()).toString() : '';
}

export function encrypt(val, key) {
  return val ? CryptoJS.AES.encrypt(val.toString(), key).toString() : '';
}

export function decrypt(val, key) {
  if (!val) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(val, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return val; // If decryption fails, return original value
  }
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

 