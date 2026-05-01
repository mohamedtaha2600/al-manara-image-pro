import { useState, useCallback, useRef } from 'react';
import { compressImage } from '../utils/compressionUtils';

export const useImageBatch = () => {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const processingQueue = useRef(false);

  const addImages = useCallback(async (files) => {
    const newImagesPromises = Array.from(files).map(async (file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const originalUrl = URL.createObjectURL(file);
      
      // Extract dimensions
      const dimensions = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = originalUrl;
      });

      return {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        compressedSize: 0,
        originalUrl,
        compressedUrl: null,
        status: 'pending',
        progress: 0,
        savings: 0
      };
    });

    const newImages = await Promise.all(newImagesPromises);
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const clearImages = useCallback(() => {
    images.forEach(img => {
      if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
    setGlobalProgress(0);
  }, [images]);

  const removeImage = useCallback((id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const processBatch = useCallback(async (quality, format, maxWidth = null, scale = 1) => {
    if (processingQueue.current) return;
    processingQueue.current = true;
    setIsProcessing(true);
    
    const pendingImages = images.filter(img => img.status !== 'done');
    let completedCount = 0;

    for (const img of pendingImages) {
      setImages(prev => prev.map(i => 
        i.id === img.id ? { ...i, status: 'processing', progress: 30 } : i
      ));

      try {
        const targetFormat = format === 'original' ? img.file.type : format;
        const result = await compressImage(img.file, quality / 100, targetFormat, maxWidth, scale);
        
        setImages(prev => prev.map(i => {
          if (i.id === img.id) {
            const savings = ((i.originalSize - result.size) / i.originalSize) * 100;
            return {
              ...i,
              compressedUrl: result.url,
              compressedSize: result.size,
              status: 'done',
              progress: 100,
              savings: savings > 0 ? savings.toFixed(1) : 0
            };
          }
          return i;
        }));
      } catch (error) {
        console.error('Compression error:', error);
        setImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, status: 'error', progress: 0 } : i
        ));
      }

      completedCount++;
      setGlobalProgress((completedCount / pendingImages.length) * 100);
    }

    setIsProcessing(false);
    processingQueue.current = false;
  }, [images]);

  return {
    images,
    isProcessing,
    globalProgress,
    addImages,
    clearImages,
    removeImage,
    processBatch,
    setImages
  };
};
