// Frontend image compression utilities using browser-image-compression
// PWA and Vercel compatible
import imageCompression from 'browser-image-compression';

/**
 * Compress image file or blob using browser-image-compression
 * @param {File|Blob} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.5, // More aggressive size limit
    maxWidthOrHeight: 800, // Smaller dimensions for better compression  
    useWebWorker: true,
    quality: 0.7, // Lower quality for better compression
    alwaysKeepResolution: false,
    fileType: 'image/jpeg', // Force JPEG for better compression
    initialQuality: 0.7,
    ...options
  };

  try {
    console.log('🖼️ Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    const compressedFile = await imageCompression(file, defaultOptions);
    
    console.log('✅ Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📊 Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%');
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Convert file to base64 string
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Base64 string without data URL prefix
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert blob to file with specified name
 * @param {Blob} blob - The blob to convert
 * @param {string} filename - The filename
 * @param {string} type - The MIME type
 * @returns {File} - File object
 */
export function blobToFile(blob, filename, type = blob.type) {
  return new File([blob], filename, { type });
}

/**
 * Compress and prepare image for upload
 * @param {File|Blob} imageFile - The image file
 * @param {string} filename - The target filename
 * @param {Object} compressionOptions - Compression options
 * @returns {Promise<{base64: string, compressedFile: File}>}
 */
export async function prepareImageForUpload(imageFile, filename, compressionOptions = {}) {
  try {
    // Convert blob to file if needed
    const file = imageFile instanceof File ? imageFile : blobToFile(imageFile, filename);
    
    // Compress the image
    const compressedFile = await compressImage(file, compressionOptions);
    
    // Convert to base64
    const base64 = await fileToBase64(compressedFile);
    
    return {
      base64,
      compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
    };
  } catch (error) {
    console.error('❌ Image preparation failed:', error);
    throw new Error('Failed to prepare image for upload');
  }
}

export default {
  compressImage,
  fileToBase64,
  blobToFile,
  prepareImageForUpload
};
