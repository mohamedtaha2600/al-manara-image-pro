import { useEffect } from 'react';

export function useWatermarkCanvas({ canvasRef, img, watermark, settings, zoom, pan }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1. Draw Original Image
      ctx.drawImage(img, 0, 0);

      // 2. Draw Watermark
      ctx.save();
      ctx.globalAlpha = settings.opacity / 100;

      const drawContent = (x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((settings.rotation * Math.PI) / 180);

        if (settings.type === 'text') {
          ctx.font = `${settings.fontWeight} ${settings.fontSize}px ${settings.fontFamily}`;
          ctx.fillStyle = settings.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Hybrid Mode: Logo + Text
          if (settings.showLogoWithText && settings.hybridLogo) {
            const lw = (settings.hybridLogo.width * settings.logoScale) / 100;
            const lh = (settings.hybridLogo.height * settings.logoScale) / 100;
            const margin = 15;
            
            if (settings.logoPos === 'above') {
              ctx.drawImage(settings.hybridLogo, -lw/2, -settings.fontSize/2 - lh - margin, lw, lh);
              ctx.fillText(settings.text, 0, 0);
            } else {
              ctx.fillText(settings.text, 0, 0);
              ctx.drawImage(settings.hybridLogo, -lw/2, settings.fontSize/2 + margin, lw, lh);
            }
          } else {
            ctx.fillText(settings.text, 0, 0);
          }
        } else if (settings.type === 'image' && watermark) {
          const w = (watermark.width * settings.imageScale) / 100;
          const h = (watermark.height * settings.imageScale) / 100;
          ctx.drawImage(watermark, -w/2, -h/2, w, h);
        }
        ctx.restore();
      };

      if (settings.isTiled) {
        const stepX = settings.type === 'text' ? settings.fontSize * 4 : (watermark?.width || 100) * 2;
        const stepY = settings.type === 'text' ? settings.fontSize * 3 : (watermark?.height || 100) * 2;
        for (let y = 0; y < canvas.height + stepY; y += stepY) {
          for (let x = 0; x < canvas.width + stepX; x += stepX) {
            drawContent(x, y);
          }
        }
      } else {
        drawContent(settings.x, settings.y);
      }

      // 3. Draw Guides (Only when dragging)
      if (settings.isDragging) {
        ctx.strokeStyle = 'rgba(233, 30, 99, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1 / zoom;

        // Vertical Guide
        ctx.beginPath();
        ctx.moveTo(settings.x, 0);
        ctx.lineTo(settings.x, canvas.height);
        ctx.stroke();

        // Horizontal Guide
        ctx.beginPath();
        ctx.moveTo(0, settings.y);
        ctx.lineTo(canvas.width, settings.y);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      ctx.restore();
    };

    render();
  }, [img, watermark, settings, zoom, pan]);
}
