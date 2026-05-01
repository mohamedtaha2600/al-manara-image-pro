import { useState, useRef, useEffect } from 'react';
import styles from './GridSplitter.module.css';
import HelpModal from './components/HelpModal';
import Sidebar from './components/Sidebar';
import PreviewOverlay from './components/PreviewOverlay';
import FloatingToolbar from './components/FloatingToolbar';
import ContextMenu from './components/ContextMenu';
import TutorialOverlay from './components/TutorialOverlay';
import { initGridCoords, getCanvasCoordsUtil, findEdgeHitUtil } from './utils/gridUtils';
import { useGridExport } from './hooks/useGridExport';
import { useGridCanvas } from './hooks/useGridCanvas';
import { usePreviewRender } from './hooks/usePreviewRender';

export default function GridSplitterTool() {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  
  const [img, setImg] = useState(null);
  const [imgInfo, setImgInfo] = useState('لم يتم تحميل صورة');
  const [cells, setCells] = useState([]);
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [prefix, setPrefix] = useState('');
  const [namingType, setNamingType] = useState('numbers');
  const [exportFormat, setExportFormat] = useState('png');
  const [isZip, setIsZip] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Tools & UI State
  const [activeTool, setActiveTool] = useState('select');
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const viewerCanvasRef = useRef(null);

  // D&D and Context Menu
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, cell: null, isEmpty: false, canvasX: 0, canvasY: 0 });

  const stateRef = useRef({
    isPanning: false,
    isDragging: false,
    spacePressed: false,
    panStartX: 0,
    panStartY: 0,
    initialPanX: 0,
    initialPanY: 0,
    activeCell: null,
    resizeEdge: null,
    dragStartX: 0,
    dragStartY: 0,
    lastTouchDist: 0,
    shouldAutoUpdateGrid: true
  });

  const { handleDownloadAll, downloadSingle } = useGridExport({ 
    img, cells, prefix, namingType, exportFormat, isZip, setIsDownloading, setStatusMsg, contextMenu, setContextMenu 
  });

  const [globalPadding, setGlobalPadding] = useState({ x: 0, y: 0 });
  const [skipManual, setSkipManual] = useState(true);

  useGridCanvas({ canvasRef, img, cells, zoom, pan, namingType, showRulers, showGrid });
  usePreviewRender({ previewMode, previewIndex, img, cells, viewerCanvasRef, containerRef: previewRef });

  // Initial Tutorial Check
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('almanara-splitter-tutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 1000);
      localStorage.setItem('almanara-splitter-tutorial', 'true');
    }
  }, []);

  // Live Auto Update for rows/cols
  useEffect(() => {
    if (img && stateRef.current.shouldAutoUpdateGrid) {
      setCells(initGridCoords(img, cols, rows));
    }
  }, [cols, rows, img]);

  // Apply Global Padding
  useEffect(() => {
    if (!img || cells.length === 0) return;
    setCells(prev => prev.map(cell => {
      if (skipManual && cell.isManual) return cell;
      if (cell.originalW === undefined) return cell;
      const px = globalPadding.x;
      const py = globalPadding.y;
      return {
        ...cell,
        x: cell.originalX + px,
        y: cell.originalY + py,
        w: Math.max(10, cell.originalW - px * 2),
        h: Math.max(10, cell.originalH - py * 2)
      };
    }));
  }, [globalPadding, skipManual, img]);

  // Auto-sort cells
  useEffect(() => {
    if (cells.length === 0) return;
    setCells(prev => {
      const sorted = [...prev].sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 10) return yDiff;
        return a.x - b.x;
      });
      const remapped = sorted.map((c, i) => ({ ...c, id: i }));
      const idOrderChanged = remapped.some((c, i) => c.id !== prev[i]?.id);
      return idOrderChanged ? remapped : prev;
    });
  }, [cells.length]);

  const fitToScreen = (loadedImg = img) => {
    if (!loadedImg || !previewRef.current) return;
    if (previewMode) {
      setPreviewPan({ x: 0, y: 0 });
      setPreviewZoom(1);
      return;
    }
    const pw = previewRef.current.clientWidth;
    const ph = previewRef.current.clientHeight;
    const ratio = Math.min((pw - 60) / loadedImg.width, (ph - 60) / loadedImg.height);
    setZoom(ratio > 0 ? ratio : 0.1);
    setPan({ x: 0, y: 0 }); 
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        setImg(tempImg);
        setImgInfo(`${tempImg.width}x${tempImg.height}px`);
        setPrefix(file.name.split('.')[0]);
        const fmt = file.type.split('/')[1] || 'png';
        setExportFormat(fmt === 'jpeg' ? 'jpg' : fmt);
        fitToScreen(tempImg);
        setCells(initGridCoords(tempImg, cols, rows));
      };
      tempImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleResetCell = (cellId) => {
    setCells(prev => prev.map(c => {
      if (String(c.id) === String(cellId)) {
        return {
          ...c,
          x: c.originalX ?? c.x,
          y: c.originalY ?? c.y,
          w: c.originalW ?? c.w,
          h: c.originalH ?? c.h,
          isManual: false
        };
      }
      return c;
    }));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleResetAll = () => {
    setGlobalPadding({ x: 0, y: 0 });
    setCells(prev => prev.map(c => ({
      ...c,
      x: c.originalX ?? c.x,
      y: c.originalY ?? c.y,
      w: c.originalW ?? c.w,
      h: c.originalH ?? c.h,
      isManual: false
    })));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const getCanvasCoords = (e) => getCanvasCoordsUtil(e, img, canvasRef, previewRef, zoom);
  const findEdgeHit = (x, y) => findEdgeHitUtil(x, y, img, cells, zoom);

  // Touch Support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({ 
        clientX: touch.clientX, 
        clientY: touch.clientY, 
        button: 0, 
        preventDefault: () => e.preventDefault() 
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      stateRef.current.lastTouchDist = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Simulate mouse move for panning/dragging
      // ... (global listener will handle it if we emit window events, but let's do it directly)
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist / stateRef.current.lastTouchDist;
      stateRef.current.lastTouchDist = dist;
      if (previewMode) setPreviewZoom(z => Math.max(0.05, Math.min(15, z * delta)));
      else setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
    }
  };

  // Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(e.code === 'Space') {
        stateRef.current.spacePressed = true;
        if(previewRef.current && activeTool !== 'pan') previewRef.current.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if(e.code === 'Space') {
        stateRef.current.spacePressed = false;
        if(previewRef.current && activeTool !== 'pan') previewRef.current.style.cursor = 'default';
      }
    };
    const handleGlobalMouseUp = () => {
      stateRef.current.isPanning = false;
      stateRef.current.isDragging = false;
      stateRef.current.activeCell = null;
      stateRef.current.resizeEdge = null;
      if(previewRef.current && (activeTool === 'pan' || stateRef.current.spacePressed)) {
        previewRef.current.style.cursor = 'grab';
      }
    };

    const handleGlobalMouseMove = (e) => {
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      if (!clientX || !clientY) return;

      const { canvasX, canvasY } = getCanvasCoords({ clientX, clientY });

      if (stateRef.current.isPanning) {
        const dx = clientX - stateRef.current.panStartX;
        const dy = clientY - stateRef.current.panStartY;
        if (previewMode) {
          setPreviewPan({ x: stateRef.current.initialPanX + dx, y: stateRef.current.initialPanY + dy });
        } else {
          setPan({ x: stateRef.current.initialPanX + dx, y: stateRef.current.initialPanY + dy });
        }
        return;
      }

      if (previewMode) return;

      // Cursor for edge hit
      if (!stateRef.current.spacePressed && activeTool === 'select' && previewRef.current && !stateRef.current.isDragging) {
        const hit = findEdgeHit(canvasX, canvasY);
        if (hit) {
          if (hit.edge === 'left' || hit.edge === 'right') previewRef.current.style.cursor = 'ew-resize';
          else if (hit.edge === 'top' || hit.edge === 'bottom') previewRef.current.style.cursor = 'ns-resize';
          else if (hit.edge.includes('-')) previewRef.current.style.cursor = hit.edge === 'top-left' || hit.edge === 'bottom-right' ? 'nwse-resize' : 'nesw-resize';
        } else {
          previewRef.current.style.cursor = 'default';
        }
      }

      if (!stateRef.current.isDragging || !stateRef.current.activeCell) return;

      const dx = canvasX - stateRef.current.dragStartX;
      const dy = canvasY - stateRef.current.dragStartY;
      const { activeCell, resizeEdge, initialCell } = stateRef.current;

      setCells(prev => prev.map(c => {
        if (c.id === activeCell.id) {
          let nc = { ...c, isManual: true };
          if (resizeEdge.includes('right')) nc.w = Math.min(Math.max(10, initialCell.w + dx), img.width - initialCell.x);
          if (resizeEdge.includes('left')) {
            nc.x = Math.max(0, Math.min(initialCell.x + dx, initialCell.x + initialCell.w - 10));
            nc.w = initialCell.x + initialCell.w - nc.x;
          }
          if (resizeEdge.includes('bottom')) nc.h = Math.min(Math.max(10, initialCell.h + dy), img.height - initialCell.y);
          if (resizeEdge.includes('top')) {
            nc.y = Math.max(0, Math.min(initialCell.y + dy, initialCell.y + initialCell.h - 10));
            nc.h = initialCell.y + initialCell.h - nc.y;
          }

          // Magnetic Snapping
          if (!e.altKey) {
            const snapThreshold = 15 / zoom;
            const xTargets = [0, img.width];
            const yTargets = [0, img.height];
            prev.forEach(other => {
              if (other.id === c.id) return;
              xTargets.push(other.x, other.x + other.w);
              yTargets.push(other.y, other.y + other.h);
            });
            const getClosest = (val, targets) => {
              let closest = val;
              let minDiff = snapThreshold;
              targets.forEach(t => {
                const diff = Math.abs(val - t);
                if (diff < minDiff) { minDiff = diff; closest = t; }
              });
              return closest;
            };

            if (resizeEdge.includes('left')) { nc.x = getClosest(nc.x, xTargets); nc.w = initialCell.x + initialCell.w - nc.x; }
            if (resizeEdge.includes('right')) { const r = getClosest(nc.x + nc.w, xTargets); nc.w = Math.max(10, r - nc.x); }
            if (resizeEdge.includes('top')) { nc.y = getClosest(nc.y, yTargets); nc.h = initialCell.y + initialCell.h - nc.y; }
            if (resizeEdge.includes('bottom')) { const b = getClosest(nc.y + nc.h, yTargets); nc.h = Math.max(10, b - nc.y); }
            
            nc.x = Math.max(0, Math.min(nc.x, img.width - nc.w));
            nc.y = Math.max(0, Math.min(nc.y, img.height - nc.h));
          }

          return nc;
        }
        return c;
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [img, activeTool, previewMode, zoom, pan]);

  const handleMouseDown = (e) => {
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    if (!clientX || !clientY) return;

    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    if (activeTool === 'pan' || stateRef.current.spacePressed || e.button === 1) {
      stateRef.current.isPanning = true;
      stateRef.current.panStartX = clientX;
      stateRef.current.panStartY = clientY;
      stateRef.current.initialPanX = previewMode ? previewPan.x : pan.x;
      stateRef.current.initialPanY = previewMode ? previewPan.y : pan.y;
      if (previewRef.current) previewRef.current.style.cursor = 'grabbing';
      return;
    }
    if (!previewMode && activeTool === 'select') {
      const { canvasX, canvasY } = getCanvasCoords({ clientX, clientY });
      const hit = findEdgeHit(canvasX, canvasY);
      if (hit) {
        stateRef.current.isDragging = true;
        stateRef.current.activeCell = hit.cell;
        stateRef.current.initialCell = { ...hit.cell };
        stateRef.current.resizeEdge = hit.edge;
        stateRef.current.dragStartX = canvasX;
        stateRef.current.dragStartY = canvasY;
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!img || activeTool === 'pan') return;
    const { canvasX, canvasY } = getCanvasCoords(e);
    if (canvasX < 0 || canvasY < 0 || canvasX > img.width || canvasY > img.height) return;
    const cell = cells.find(c => canvasX >= c.x && canvasX <= c.x + c.w && canvasY >= c.y && canvasY <= c.y + c.h);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, cell, isEmpty: !cell, canvasX, canvasY });
  };

  const addCellHere = () => {
    const cw = img.width / cols, ch = img.height / rows;
    const gx = Math.floor(contextMenu.canvasX / cw) * cw, gy = Math.floor(contextMenu.canvasY / ch) * ch;
    setCells(prev => [...prev, { id: Date.now(), x: gx, y: gy, w: cw, h: ch, originalX: gx, originalY: gy, originalW: cw, originalH: ch, isManual: true }]);
    setContextMenu({ ...contextMenu, visible: false });
  };

  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} onStartTutorial={() => { setShowHelpModal(false); setShowTutorial(true); }} />}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      <div className={styles.mainLayout}>
        <Sidebar 
          isDragOver={isDragOver} handleDragOver={handleDragOver} handleDragLeave={handleDragLeave} handleDrop={handleDrop} handleFile={handleFile}
          cols={cols} setCols={setCols} rows={rows} setRows={setRows} prefix={prefix} setPrefix={setPrefix} namingType={namingType} setNamingType={setNamingType}
          exportFormat={exportFormat} setExportFormat={setExportFormat}
          isZip={isZip} setIsZip={setIsZip} img={img} isDownloading={isDownloading} handleDownloadAll={handleDownloadAll}
          setShowHelpModal={setShowHelpModal} globalPadding={globalPadding} setGlobalPadding={setGlobalPadding} skipManual={skipManual} setSkipManual={setSkipManual}
          handleResetAll={handleResetAll} setShowTutorial={setShowTutorial}
        />

        <div 
          className={styles.previewArea} ref={previewRef} 
          onMouseDown={handleMouseDown} 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onContextMenu={handleContextMenu}
          onWheel={(e) => {
            if(!img) return;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            if (previewMode) setPreviewZoom(z => Math.max(0.05, Math.min(15, z * delta)));
            else setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
          }}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        >
          <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>

          {img && <div className={styles.canvasImgInfo}>{imgInfo}</div>}

          <PreviewOverlay
            previewMode={previewMode} setPreviewMode={setPreviewMode} previewIndex={previewIndex} setPreviewIndex={setPreviewIndex}
            cells={cells} setCells={setCells} showRulers={showRulers} activeTool={activeTool} viewerCanvasRef={viewerCanvasRef}
            previewPan={previewPan} previewZoom={previewZoom} img={img}
          />

          <ContextMenu 
            contextMenu={contextMenu} setContextMenu={setContextMenu} addCellHere={addCellHere}
            downloadSingle={downloadSingle} deleteCell={() => { setCells(prev => prev.filter(c => c.id !== contextMenu.cell.id)); setContextMenu({ ...contextMenu, visible: false }); }}
            openInViewer={() => { const idx = cells.findIndex(c => c.id === contextMenu.cell.id); if(idx !== -1) { setPreviewIndex(idx); setPreviewMode(true); } setContextMenu({ ...contextMenu, visible: false }); }}
            previewMode={previewMode} handleResetCell={handleResetCell}
          />

          <FloatingToolbar
            activeTool={activeTool} setActiveTool={setActiveTool} showRulers={showRulers} setShowRulers={setShowRulers}
            showGrid={showGrid} setShowGrid={setShowGrid} hasCells={cells.length > 0} previewMode={previewMode}
            setPreviewMode={setPreviewMode} setPreviewIndex={setPreviewIndex} fitToScreen={fitToScreen}
          />
        </div>
      </div>
    </div>
  );
}
