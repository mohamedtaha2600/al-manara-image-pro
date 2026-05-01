import { useState, useCallback, useEffect } from 'react';

export function useMergerState() {
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [cells, setCells] = useState([]);
  const [library, setLibrary] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [prefix, setPrefix] = useState('merged_image');
  const [exportFormat, setExportFormat] = useState('png');
  const [statusMsg, setStatusMsg] = useState('');
  const [globalPadding, setGlobalPadding] = useState({ x: 0, y: 0 });

  const initCells = useCallback((w = canvasSize.width, h = canvasSize.height, c = cols, r = rows) => {
    const newCells = [];
    const cellW = w / c;
    const cellH = h / r;
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        newCells.push({
          id: `cell-${i}-${j}`,
          x: j * cellW, y: i * cellH, w: cellW, h: cellH,
          originalX: j * cellW, originalY: i * cellH, originalW: cellW, originalH: cellH,
          img: null, padding: { x: 0, y: 0 }
        });
      }
    }
    setCells(newCells);
  }, [cols, rows, canvasSize]);

  useEffect(() => { initCells(); }, [cols, rows, canvasSize]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLibrary(prev => [...prev, { id: Date.now(), img, name: file.name, w: img.width, h: img.height }]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return {
    cells, setCells, cols, setCols, rows, setRows, library, setLibrary,
    canvasSize, setCanvasSize, prefix, setPrefix, exportFormat, setExportFormat,
    statusMsg, setStatusMsg, globalPadding, setGlobalPadding, handleFile, initCells
  };
}
