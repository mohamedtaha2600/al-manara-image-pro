export const initGridCoords = (img, c, r) => {
  if (!img) return [];
  const cellW = img.width / c;
  const cellH = img.height / r;
  const newCells = [];
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      newCells.push({ 
        id: row * c + col, 
        x: col * cellW, 
        y: row * cellH, 
        w: cellW, 
        h: cellH,
        originalX: col * cellW,
        originalY: row * cellH,
        originalW: cellW,
        originalH: cellH
      });
    }
  }
  return newCells;
};

export const getCanvasCoordsUtil = (e, img, canvasRef, previewRef, zoom) => {
  if (!img || !canvasRef.current || !previewRef.current) return { canvasX: 0, canvasY: 0 };
  const rect = canvasRef.current.getBoundingClientRect();
  const canvasX = (e.clientX - (rect.left + rect.width / 2)) / zoom + img.width / 2;
  const canvasY = (e.clientY - (rect.top + rect.height / 2)) / zoom + img.height / 2;
  return { canvasX, canvasY };
};

export const findEdgeHitUtil = (x, y, img, cells, zoom) => {
  if (!img) return null;
  const threshold = 15 / zoom; 
  for (let cell of cells) {
    const isNearLeft = Math.abs(x - cell.x) < threshold;
    const isNearRight = Math.abs(x - (cell.x + cell.w)) < threshold;
    const isNearTop = Math.abs(y - cell.y) < threshold;
    const isNearBottom = Math.abs(y - (cell.y + cell.h)) < threshold;
    const withinX = x >= cell.x - threshold && x <= cell.x + cell.w + threshold;
    const withinY = y >= cell.y - threshold && y <= cell.y + cell.h + threshold;
    if (withinX && withinY) {
      if (isNearLeft && isNearTop) return { cell, edge: 'top-left' };
      if (isNearRight && isNearBottom) return { cell, edge: 'bottom-right' };
      if (isNearLeft && isNearBottom) return { cell, edge: 'bottom-left' };
      if (isNearRight && isNearTop) return { cell, edge: 'top-right' };
      if (isNearLeft) return { cell, edge: 'left' };
      if (isNearRight) return { cell, edge: 'right' };
      if (isNearTop) return { cell, edge: 'top' };
      if (isNearBottom) return { cell, edge: 'bottom' };
    }
  }
  return null;
};
