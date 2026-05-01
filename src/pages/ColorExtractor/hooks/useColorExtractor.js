import { useState, useRef, useEffect, useCallback } from 'react';
import { extractColors } from '../utils/colorUtils';

export function useColorExtractor({ activeIndex, files, setFiles }) {
  const [palette, setPalette] = useState([]);
  const [colorCount, setColorCount] = useState(8);
  const [quality, setQuality] = useState(10);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // select, pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0, show: false, color: '#000000' });
  const [imgElement, setImgElement] = useState(null);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const zoomCanvasRef = useRef(null);
  const stateRef = useRef({ isPanning: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });

  const activeFile = files[activeIndex] || null;

  const fitToScreen = useCallback((img = imgElement) => {
    if (!img || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 100;
    const ph = containerRef.current.clientHeight - 100;
    const ratio = Math.min(cw / img.width, ph / img.height);
    setZoom(Math.min(ratio, 1) * 0.9);
    setPan({ x: 0, y: 0 });
  }, [imgElement]);

  const handleExtract = useCallback(async (img = imgElement, count = colorCount, qual = quality) => {
    if (!img) return;
    setIsExtracting(true);
    try {
      const colors = await extractColors(img, count, qual);
      setPalette(colors);
      setFiles(prev => prev.map((f, i) => i === activeIndex ? { ...f, extractedPalette: colors } : f));
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  }, [imgElement, colorCount, quality, activeIndex, setFiles]);

  useEffect(() => {
    if (activeFile) {
      const img = new Image();
      img.onload = () => {
        setImgElement(img);
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        fitToScreen(img);
        if (activeFile.extractedPalette) {
          setPalette(activeFile.extractedPalette);
        } else {
          handleExtract(img);
        }
      };
      img.src = activeFile.previewUrl;
    } else {
      setImgElement(null);
      setPalette([]);
    }
  }, [activeFile?.id, activeIndex]);

  const handleCanvasMouseMove = (e, isSpacePressed) => {
    if (!imgElement || activeTool !== 'select' || isSpacePressed || !canvasRef.current) {
      setPickerPos(prev => ({ ...prev, show: false }));
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (x < 0 || y < 0 || x > imgElement.width || y > imgElement.height) {
      setPickerPos(prev => ({ ...prev, show: false }));
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const color = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    
    setPickerPos({ x: e.clientX, y: e.clientY, show: true, color });

    if (zoomCanvasRef.current) {
      const zCtx = zoomCanvasRef.current.getContext('2d');
      zCtx.imageSmoothingEnabled = false;
      zCtx.clearRect(0, 0, 80, 80);
      zCtx.drawImage(
        canvasRef.current,
        Math.floor(x) - 5, Math.floor(y) - 5, 11, 11,
        0, 0, 80, 80
      );
    }
  };

  const handleCanvasClick = () => {
    if (pickerPos.show && activeTool === 'select') {
      if (!palette.includes(pickerPos.color)) {
        const newPalette = [pickerPos.color, ...palette].slice(0, 24);
        setPalette(newPalette);
        setFiles(fprev => fprev.map((f, i) => i === activeIndex ? { ...f, extractedPalette: newPalette } : f));
      }
    }
  };

  return {
    palette, setPalette,
    colorCount, setColorCount,
    quality, setQuality,
    isExtracting, handleExtract,
    activeTool, setActiveTool,
    zoom, setZoom,
    pan, setPan,
    pickerPos, setPickerPos,
    imgElement,
    canvasRef, containerRef, zoomCanvasRef,
    stateRef,
    fitToScreen,
    handleCanvasMouseMove,
    handleCanvasClick
  };
}
