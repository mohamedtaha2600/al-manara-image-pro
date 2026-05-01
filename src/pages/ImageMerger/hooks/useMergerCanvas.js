import { useEffect } from 'react';

export function useMergerCanvas({ canvasRef, cells, zoom, pan, showRulers, showGrid, canvasSize, globalPadding }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cells.forEach(cell => {
      const { x, y, w, h, img } = cell;
      if (img) {
        const px = globalPadding.x + (cell.padding?.x || 0);
        const py = globalPadding.y + (cell.padding?.y || 0);
        const scale = Math.max((w - px*2) / img.width, (h - py*2) / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = x + px + (w - px*2 - dw) / 2;
        const dy = y + py + (h - py*2 - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + px, y + py, w - px*2, h - py*2);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.strokeRect(x, y, w, h);
      }
    });

    if (showRulers) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 20); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(20, i); ctx.stroke();
      }
    }
  }, [cells, showRulers, showGrid, canvasSize, globalPadding]);
}
