import { useEffect } from 'react';

export function useGridCanvas({ canvasRef, img, cells, zoom, pan, namingType, showRulers, showGrid }) {
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    let overlaps = [];
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const c1 = cells[i];
        const c2 = cells[j];
        const xOverlap = Math.max(0, Math.min(c1.x + c1.w, c2.x + c2.w) - Math.max(c1.x, c2.x));
        const yOverlap = Math.max(0, Math.min(c1.y + c1.h, c2.y + c2.h) - Math.max(c1.y, c2.y));
        if (xOverlap > 0 && yOverlap > 0) {
          overlaps.push({ x: Math.max(c1.x, c2.x), y: Math.max(c1.y, c2.y), w: xOverlap, h: yOverlap });
        }
      }
    }

    ctx.fillStyle = "rgba(255, 23, 68, 0.4)";
    for(let o of overlaps) ctx.fillRect(o.x, o.y, o.w, o.h);

    ctx.lineWidth = Math.max(2, 2 / zoom);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const arabicAlphabet = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
    
    cells.forEach((cell, index) => {
      let label = (index + 1).toString().padStart(2, '0');
      if (namingType === 'letters') label = String.fromCharCode(65 + (index % 26));
      else if (namingType === 'arabic') label = arabicAlphabet[index % arabicAlphabet.length];
      
      if (showGrid) {
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = Math.max(6, 6 / zoom);
        ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = Math.max(2, 2 / zoom);
        ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

        // Draw Handles (Corners)
        const hs = Math.max(6, 8 / zoom); // Handle size
        ctx.fillStyle = "#00e676";
        ctx.strokeStyle = "white";
        ctx.lineWidth = Math.max(1, 1 / zoom);

        const corners = [
          { x: cell.x, y: cell.y },
          { x: cell.x + cell.w, y: cell.y },
          { x: cell.x, y: cell.y + cell.h },
          { x: cell.x + cell.w, y: cell.y + cell.h }
        ];

        corners.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, hs / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      if (showRulers) {
        // Labels
        ctx.fillStyle = "white";
        ctx.font = `bold ${Math.min(Math.max(12, cell.h * 0.15), 60 / zoom)}px Arial`;
        ctx.shadowBlur = 10; ctx.shadowColor = "black";
        ctx.fillText(label, cell.x + cell.w/2, cell.y + cell.h/2);
        ctx.shadowBlur = 0;

        // Dimensions
        ctx.fillStyle = "#00e676";
        ctx.font = `bold ${Math.max(10, 16 / zoom)}px Arial`;
        ctx.shadowBlur = 4;
        ctx.fillText(`${Math.round(cell.w)}px`, cell.x + cell.w/2, cell.y - Math.max(10, 15/zoom));
        ctx.fillText(`${Math.round(cell.h)}px`, cell.x + cell.w + Math.max(20, 25/zoom), cell.y + cell.h/2);
        ctx.shadowBlur = 0;
      }
    });
  }, [img, cells, zoom, pan, namingType, showRulers, showGrid, canvasRef]);
}
