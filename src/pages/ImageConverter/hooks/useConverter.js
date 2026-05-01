import { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

// 🚀 Fast Canvas Conversion (Instant)
const canvasConvert = (file, targetFormat) => {
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
        
        const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              url: URL.createObjectURL(blob),
              blob,
              size: blob.size
            });
          } else reject(new Error('Canvas conversion failed'));
        }, mimeType, 0.95);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const useConverter = () => {
  const [ffmpeg] = useState(() => new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    if (isLoadingRef.current || isLoaded) return;
    isLoadingRef.current = true;
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [ffmpeg, isLoaded]);

  const convertFile = useCallback(async (file, targetFormat) => {
    // 1. Check if we can use Fast Track (Canvas)
    const fastFormats = ['webp', 'png', 'jpg'];
    const isImage = file.type.startsWith('image/');
    
    if (isImage && fastFormats.includes(targetFormat)) {
      return await canvasConvert(file, targetFormat);
    }

    // 2. Otherwise, use Advanced Track (FFmpeg)
    if (!isLoaded) await load();

    const inputName = 'input_' + file.name;
    const outputName = `output.${targetFormat}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Command selection based on format
    let command = ['-i', inputName];
    
    if (targetFormat === 'gif' && file.type.startsWith('video')) {
      // Optimized Video to GIF settings
      command.push('-vf', 'fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse');
    }
    
    command.push(outputName);

    await ffmpeg.exec(command);
    
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: `image/${targetFormat}` });
    const url = URL.createObjectURL(blob);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return { url, blob, size: blob.size };
  }, [ffmpeg, isLoaded, load]);

  return {
    load,
    isLoaded,
    progress,
    convertFile
  };
};
