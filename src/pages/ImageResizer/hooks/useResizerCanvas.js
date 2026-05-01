import { useEffect } from 'react';

export function useResizerCanvas({ canvasRef, img, cropBox, zoom, pan }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1. Draw original image dimmed
      ctx.globalAlpha = 0.4;
      ctx.drawImage(img, 0, 0);
      
      // 2. Draw Highlighted Crop Area
      ctx.globalAlpha = 1.0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // 3. Draw Crop Box Border & Handles
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
      ctx.setLineDash([]);

      // --- Rule of Thirds Grid ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1 / zoom;
      
      // Vertical Lines
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y);
        ctx.lineTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y + cropBox.h);
        ctx.stroke();
      }
      // Horizontal Lines
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h * i) / 3);
        ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h * i) / 3);
        ctx.stroke();
      }

      // Handles
      const handleSize = 8 / zoom;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 2 / zoom;

      const handles = [
        { x: cropBox.x, y: cropBox.y }, // Top Left
        { x: cropBox.x + cropBox.w, y: cropBox.y }, // Top Right
        { x: cropBox.x, y: cropBox.y + cropBox.h }, // Bottom Left
        { x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h }, // Bottom Right
        { x: cropBox.x + cropBox.w / 2, y: cropBox.y }, // Top Mid
        { x: cropBox.x + cropBox.w / 2, y: cropBox.y + cropBox.h }, // Bottom Mid
        { x: cropBox.x, y: cropBox.y + cropBox.h / 2 }, // Left Mid
        { x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h / 2 }, // Right Mid
      ];

      handles.forEach(h => {
        ctx.beginPath();
        ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        ctx.fill();
        ctx.stroke();
      });
    };

    render();
  }, [img, cropBox, zoom, pan]);
}
