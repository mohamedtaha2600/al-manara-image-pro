import { useState, useCallback } from 'react';
import { getHitHandle, getCursorForHandle } from './useCanvasRender';

export function useCanvasInteract({ canvasRef, zoom, pan, setPan, layout, canvasWidth, canvasHeight, activeId, setActiveId, getLayoutData, setCanvasImages, dragState, setDragState }) {
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState('default');

  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [canvasRef, zoom]);

  const onMouseDown = useCallback((e, spacePressed, activeTool) => {
    if (e.button !== 0) return;

    // Pan mode
    if (spacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const { items } = getLayoutData();

    // Check handle first
    if (activeId) {
      const activeItem = items.find(i => i.id === activeId);
      if (activeItem) {
        const hit = getHitHandle(x, y, activeItem, zoom);
        if (hit) {
          setDragState({ type: 'resize', handle: hit, id: activeId, startX: x, startY: y, origX: activeItem.x, origY: activeItem.y, origW: activeItem.w, origH: activeItem.h });
          return;
        }
      }
    }

    // Check image body
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        setActiveId(item.id);
        setDragState({ type: 'move', id: item.id, startX: x, startY: y, origX: item.x, origY: item.y, currentX: item.x, currentY: item.y });
        return;
      }
    }
    setActiveId(null);
  }, [canvasRef, pan, getCanvasCoords, getLayoutData, activeId, zoom, setActiveId, setDragState]);

  const onMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const { items } = getLayoutData();

    // Resize drag
    if (dragState?.type === 'resize') {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      const { handle, origX, origY, origW, origH, id } = dragState;
      let nx = origX, ny = origY, nw = origW, nh = origH;

      if (handle === 'tl') { nx = origX + dx; ny = origY + dy; nw = Math.max(20, origW - dx); nh = Math.max(20, origH - dy); }
      else if (handle === 'tm') { ny = origY + dy; nh = Math.max(20, origH - dy); }
      else if (handle === 'tr') { nw = Math.max(20, origW + dx); ny = origY + dy; nh = Math.max(20, origH - dy); }
      else if (handle === 'ml') { nx = origX + dx; nw = Math.max(20, origW - dx); }
      else if (handle === 'mr') { nw = Math.max(20, origW + dx); }
      else if (handle === 'bl') { nx = origX + dx; nw = Math.max(20, origW - dx); nh = Math.max(20, origH + dy); }
      else if (handle === 'bm') { nh = Math.max(20, origH + dy); }
      else if (handle === 'br') { nw = Math.max(20, origW + dx); nh = Math.max(20, origH + dy); }

      setCanvasImages(prev => prev.map(img => img.id === id ? { ...img, freeX: nx, freeY: ny, freeW: nw, freeH: nh } : img));
      return;
    }

    // Move drag
    if (dragState?.type === 'move') {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      let nx = dragState.origX + dx;
      let ny = dragState.origY + dy;

      if (layout === 'free') {
        // Magnetic snap
        const snap = 12 / zoom;
        const sx = [0, canvasWidth];
        const sy = [0, canvasHeight];
        items.forEach(i => { if (i.id !== dragState.id) { sx.push(i.x, i.x + i.w); sy.push(i.y, i.y + i.h); } });
        const snapTo = (v, targets) => { let b = v, bd = snap; targets.forEach(t => { const d = Math.abs(v - t); if (d < bd) { bd = d; b = t; } }); return b; };
        const activeItem = items.find(i => i.id === dragState.id);
        if (activeItem) {
          const snL = snapTo(nx, sx); if (snL !== nx) nx = snL; else { const snR = snapTo(nx + activeItem.w, sx); if (snR !== nx + activeItem.w) nx = snR - activeItem.w; }
          const snT = snapTo(ny, sy); if (snT !== ny) ny = snT; else { const snB = snapTo(ny + activeItem.h, sy); if (snB !== ny + activeItem.h) ny = snB - activeItem.h; }
        }
        setCanvasImages(prev => prev.map(img => img.id === dragState.id ? { ...img, freeX: nx, freeY: ny } : img));
      }
      setDragState(prev => ({ ...prev, currentX: nx, currentY: ny }));
      return;
    }

    // Hover cursor
    if (activeId) {
      const activeItem = items.find(i => i.id === activeId);
      if (activeItem) {
        const hit = getHitHandle(x, y, activeItem, zoom);
        if (hit) { setCursor(getCursorForHandle(hit)); return; }
        if (x >= activeItem.x && x <= activeItem.x + activeItem.w && y >= activeItem.y && y <= activeItem.y + activeItem.h) { setCursor('move'); return; }
      }
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) { setCursor('move'); return; }
    }
    setCursor('default');
  }, [isPanning, panStart, dragState, getCanvasCoords, getLayoutData, activeId, zoom, layout, canvasWidth, canvasHeight, setCanvasImages, setPan, setDragState]);

  const onMouseUp = useCallback((e) => {
    setIsPanning(false);
    if (dragState?.type === 'move' && layout !== 'free') {
      const { x, y } = getCanvasCoords(e);
      const { items } = getLayoutData();
      const target = items.find(i => i.id !== dragState.id && x >= i.x && x <= i.x + i.w && y >= i.y && y <= i.y + i.h);
      if (target) {
        setCanvasImages(prev => {
          const arr = [...prev];
          const i1 = arr.findIndex(i => i.id === dragState.id);
          const i2 = arr.findIndex(i => i.id === target.id);
          [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
          return arr;
        });
      }
    }
    setDragState(null);
  }, [dragState, layout, getCanvasCoords, getLayoutData, setCanvasImages, setDragState]);

  return { onMouseDown, onMouseMove, onMouseUp, cursor, isPanning };
}
