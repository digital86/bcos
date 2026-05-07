/**
 * Utility for image processing: conversion to WebP, resizing and compression.
 * Aimed at optimizing performance and SEO for the BCOS platform.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Converts any image DataURL to a compressed WebP DataURL.
 * Resizes the image if it exceeds specified dimensions.
 */
export const optimizeImage = async (
  dataUrl: string,
  options: ResizeOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.6,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Allow cross-origin images if they are from a CORS-enabled source
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to specified format with quality setting
      const optimizedDataUrl = canvas.toDataURL(format, quality);
      resolve(optimizedDataUrl);
    };

    img.onerror = (err) => {
      console.error('Error loading image for optimization:', err);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = dataUrl;
  });
};

/**
 * Helper to check if a string is a base64 DataURL
 */
export const isDataUrl = (s: string) => s.startsWith('data:');

/**
 * Converts a File object (from input) to an optimized WebP DataURL
 */
export const fileToOptimizedWebP = async (
  file: File,
  options: ResizeOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const optimized = await optimizeImage(dataUrl, options);
        resolve(optimized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
