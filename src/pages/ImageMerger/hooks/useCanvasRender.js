import { useCallback } from 'react';

const HANDLE_CURSORS = {
  tl: 'nw-resize', tm: 'n-resize', tr: 'ne-resize',
  ml: 'w-resize',                  mr: 'e-resize',
  bl: 'sw-resize', bm: 's-resize', br: 'se-resize',
};

export function getHandlePositions(x, y, w, h) {
  return [
    { id: 'tl', hx: x,       hy: y       },
    { id: 'tm', hx: x + w/2, hy: y       },
    { id: 'tr', hx: x + w,   hy: y       },
    { id: 'ml', hx: x,       hy: y + h/2 },
    { id: 'mr', hx: x + w,   hy: y + h/2 },
    { id: 'bl', hx: x,       hy: y + h   },
    { id: 'bm', hx: x + w/2, hy: y + h   },
    { id: 'br', hx: x + w,   hy: y + h   },
  ];
}

export function getHitHandle(cx, cy, item, zoom) {
  const hs = 10 / zoom;
  const { x, y, w, h } = item;
  for (const { id, hx, hy } of getHandlePositions(x, y, w, h)) {
    if (Math.abs(cx - hx) < hs && Math.abs(cy - hy) < hs) return id;
  }
  return null;
}

export function getCursorForHandle(handle) {
  return HANDLE_CURSORS[handle] || 'default';
}

export function useCanvasRender({ canvasRef, getLayoutData, bgColor, activeId, dragState, zoom, showNumbers }) {
  const renderCanvas = useCallback((isDownload = false) => {
    const canvas = isDownload ? document.createElement('canvas') : canvasRef.current;
    if (!canvas) return null;

    const { totalW, totalH, items } = getLayoutData();
    canvas.width = totalW;
    canvas.height = totalH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw each image
    items.forEach((item, idx) => {
      let { x, y, w, h } = item;
      if (!isDownload && dragState?.id === item.id) {
        x = dragState.currentX ?? x;
        y = dragState.currentY ?? y;
      }

      if (item.img?.complete && w > 0 && h > 0) {
        ctx.drawImage(item.img, x, y, w, h);
      } else {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px sans-serif';
        ctx.fillText('...', x + w / 2, y + h / 2);
      }

      // Number badge
      if (showNumbers && !isDownload) {
        ctx.save();
        const fs = Math.max(12, Math.min(w, h) * 0.1);
        const pad = fs * 0.5;
        ctx.font = `bold ${fs}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const numW = ctx.measureText((idx + 1).toString()).width + pad * 2;
        const numH = fs + pad;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, numW, numH, 4);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText((idx + 1).toString(), x + 8 + numW / 2, y + 8 + numH / 2);
        ctx.restore();
      }

      // Professional selection UI (skip on download)
      if (!isDownload && activeId === item.id) {
        ctx.save();
        // Blue tint overlay
        ctx.fillStyle = 'rgba(0, 122, 255, 0.06)';
        ctx.fillRect(x, y, w, h);

        // Selection border
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        // 8 handles
        const hs = 8 / zoom;
        getHandlePositions(x, y, w, h).forEach(({ hx, hy }) => {
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 4 / zoom;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#007AFF';
          ctx.lineWidth = 1.2 / zoom;
          ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
        });
        ctx.restore();
      }
    });

    return canvas;
  }, [canvasRef, getLayoutData, bgColor, activeId, dragState, zoom, showNumbers]);

  return { renderCanvas };
}
