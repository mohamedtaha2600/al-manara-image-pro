import { useCallback } from 'react';

// 🚀 Fast Canvas Conversion (Instant & Private)
const canvasConvert = (file, targetFormat, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Handle format mapping
        let mimeType = `image/${targetFormat}`;
        if (targetFormat === 'jpg') mimeType = 'image/jpeg';
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              url: URL.createObjectURL(blob),
              blob,
              size: blob.size
            });
          } else reject(new Error('فشل التحويل. حاول استخدام صيغة أخرى.'));
        }, mimeType, quality); 
      };
      img.onerror = () => reject(new Error('خطأ في تحميل الصورة. تأكد من أن الملف سليم.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
    reader.readAsDataURL(file);
  });
};

export const useConverter = () => {
  const convertFile = useCallback(async (file, targetFormat, quality) => {
    // Only handle image types via canvas
    if (file.type.startsWith('image/')) {
      return await canvasConvert(file, targetFormat, quality);
    } else {
      throw new Error('هذه الأداة تدعم تحويل الصور فقط حالياً.');
    }
  }, []);

  return {
    convertFile,
    isLoaded: true // Always ready now
  };
};
