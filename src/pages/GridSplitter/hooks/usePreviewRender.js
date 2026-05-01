import { useEffect } from 'react';

export function usePreviewRender({ previewMode, previewIndex, img, cells, viewerCanvasRef, containerRef }) {
  useEffect(() => {
    if (previewMode && img && cells.length > 0 && viewerCanvasRef.current) {
      const canvas = viewerCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const cell = cells[previewIndex];
      
      const container = containerRef?.current;
      if(!container) return;

      const maxWidth = container.clientWidth * 0.95;
      const maxHeight = container.clientHeight * 0.85;
      
      const scale = Math.min(maxWidth / cell.w, maxHeight / cell.h);
      const drawW = cell.w * scale;
      const drawH = cell.h * scale;
      
      canvas.width = drawW;
      canvas.height = drawH;
      
      ctx.clearRect(0, 0, drawW, drawH);
      ctx.drawImage(img, cell.x, cell.y, cell.w, cell.h, 0, 0, drawW, drawH);
    }
  }, [previewMode, previewIndex, img, cells, viewerCanvasRef]);
}
