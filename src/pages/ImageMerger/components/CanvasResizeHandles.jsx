import { useState, useCallback, useRef } from 'react';

// Canvas border resize handles (HTML overlay)
const BORDER_HANDLES = [
  { id: 'tl', style: { top: -5, left: -5, cursor: 'nw-resize' } },
  { id: 'tm', style: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
  { id: 'tr', style: { top: -5, right: -5, cursor: 'ne-resize' } },
  { id: 'ml', style: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' } },
  { id: 'mr', style: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' } },
  { id: 'bl', style: { bottom: -5, left: -5, cursor: 'sw-resize' } },
  { id: 'bm', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
  { id: 'br', style: { bottom: -5, right: -5, cursor: 'se-resize' } },
];

export default function CanvasResizeHandles({ canvasWidth, canvasHeight, setCanvasWidth, setCanvasHeight, zoom }) {
  const dragRef = useRef(null);

  const onHandleMouseDown = useCallback((e, handleId) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = canvasWidth;
    const startH = canvasHeight;

    dragRef.current = { handleId, startX, startY, startW, startH };

    const onMove = (me) => {
      if (!dragRef.current) return;
      const { handleId, startX, startY, startW, startH } = dragRef.current;
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;

      if (handleId.includes('r')) setCanvasWidth(Math.max(100, Math.round(startW + dx)));
      if (handleId.includes('l')) setCanvasWidth(Math.max(100, Math.round(startW - dx)));
      if (handleId.includes('b')) setCanvasHeight(Math.max(100, Math.round(startH + dy)));
      if (handleId.includes('t') && handleId !== 'tl' && handleId !== 'tr') setCanvasHeight(Math.max(100, Math.round(startH - dy)));
      if (handleId === 'tl' || handleId === 'tr') setCanvasHeight(Math.max(100, Math.round(startH - dy)));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [canvasWidth, canvasHeight, zoom, setCanvasWidth, setCanvasHeight]);

  return (
    <>
      {BORDER_HANDLES.map(({ id, style }) => (
        <div
          key={id}
          onMouseDown={(e) => onHandleMouseDown(e, id)}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: 'white',
            border: '1.5px solid #007AFF',
            borderRadius: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            ...style,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}
