import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './GridSplitter.module.css';
import HelpModal from './components/HelpModal';
import Sidebar from './components/Sidebar';
import PreviewOverlay from './components/PreviewOverlay';
import FloatingToolbar from './components/FloatingToolbar';
import ContextMenu from './components/ContextMenu';
import TutorialOverlay from './components/TutorialOverlay';
import CropToolOverlay from './components/CropToolOverlay';
import GridImageLibrary from './components/GridImageLibrary';
import { getCanvasCoordsUtil, findEdgeHitUtil, initGridCoords } from './utils/gridUtils';
import { useGridExport } from './hooks/useGridExport';
import { useGridCanvas } from './hooks/useGridCanvas';
import { usePreviewRender } from './hooks/usePreviewRender';
import { useGridState } from './hooks/useGridState';

// Shared components
import GenericTutorial from '../../components/Shared/GenericTutorial';
import GenericHelpModal from '../../components/Shared/GenericHelpModal';
import { useToolOnboarding } from '../../components/Shared/useToolOnboarding';
import { Layout, MousePointer2, Scissors, Download, Info, Play, Grid as GridIcon } from 'lucide-react';

const gridTutorialSteps = [
  {
    title: "مرحباً بك في مقسم الصور!",
    content: "هذه الأداة مصممة لتقسيم صورك إلى شبكة احترافية بدقة عالية جداً.",
    icon: <Layout size={40} color="var(--c1)" />
  },
  {
    title: "تحديد الشبكة",
    content: "اختر عدد الأعمدة والصفوف من القائمة الجانبية. سيقوم النظام بحساب التقسيم تلقائياً.",
    icon: <GridIcon size={40} color="var(--c2)" />
  },
  {
    title: "تعديل يدوي ذكي",
    content: "يمكنك سحب حواف المربعات في مساحة العمل لتعديل حجم كل خلية بشكل مستقل إذا كنت لا تريد تقسيماً متساوياً.",
    icon: <MousePointer2 size={40} color="var(--c1)" />
  },
  {
    title: "تصدير احترافي",
    content: "حمل جميع الأجزاء دفعة واحدة في ملف ZIP واحد، أو اضغط باليمين على أي خلية لتحميلها منفردة.",
    icon: <Download size={40} color="var(--c3)" />
  }
];

const gridHelpSections = [
  {
    title: "كيفية البدء",
    icon: <Layout size={18} />,
    content: "ارفع صورتك، ثم اختر عدد الصفوف والأعمدة. يمكنك رؤية المعاينة الحية فوراً في مساحة العمل."
  },
  {
    title: "اختصارات التحكم",
    icon: <MousePointer2 size={18} />,
    content: "استخدم زر المسافة (Space) مع الماوس للتحريك (Pan)، وبكرة الماوس للزوم. اضغط مرتين على أي خلية لتعديلها."
  },
  {
    title: "تسمية الملفات",
    icon: <Scissors size={18} />,
    content: "يمكنك تغيير 'البادئة' (Prefix) لتسمية جميع الملفات الناتجة بشكل منظم (مثلاً: image_1, image_2)."
  }
];

export default function GridSplitterTool() {
  const { showTutorial, setShowTutorial, showHelp, setShowHelp } = useToolOnboarding('grid-splitter');
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const viewerCanvasRef = useRef(null);
  
  // ── Unified State Management ────────────────────────────────────────
  const {
    img, setImg, imgInfo, setImgInfo, library, setLibrary, cells, setCells,
    cols, setCols, rows, setRows, prefix, setPrefix, namingType, setNamingType,
    exportFormat, setExportFormat, isZip, setIsZip, globalPadding, setGlobalPadding,
    skipManual, setSkipManual, statusMsg, setStatusMsg, showStatus, handleFile
  } = useGridState();

  // ── Viewport State ──────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
  // ── Modal/Overlay States ──────────────────────────────────────────
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [previewZoom, setPreviewZoom] = useState(1);

  // ── Crop State ──────────────────────────────────────────────────────
  const [cropBox, setCropBox] = useState(null);

  // ── Interaction Logic ──────────────────────────────────────────────
  const stateRef = useRef({
    isPanning: false, isDragging: false, spacePressed: false,
    panStartX: 0, panStartY: 0, initialPanX: 0, initialPanY: 0,
    activeCell: null, resizeEdge: null, dragStartX: 0, dragStartY: 0,
    lastTouchDist: 0, shouldAutoUpdateGrid: true
  });

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, cell: null, isEmpty: false, canvasX: 0, canvasY: 0 });

  // ── Custom Hooks ────────────────────────────────────────────────────
  const { handleDownloadAll, downloadSingle } = useGridExport({ 
    img, cells, prefix, namingType, exportFormat, isZip, setIsDownloading, setStatusMsg, contextMenu, setContextMenu 
  });

  useGridCanvas({ canvasRef, img, cells, zoom, pan, namingType, showRulers, showGrid, cropBox: activeTool === 'crop' ? cropBox : null });
  usePreviewRender({ previewMode, previewIndex, img, cells, viewerCanvasRef, containerRef: previewRef });

  // ── Callbacks ───────────────────────────────────────────────────────
  const fitToScreen = useCallback((loadedImg = img) => {
    if (!loadedImg || !previewRef.current) return;
    const pw = previewRef.current.clientWidth - 100;
    const ph = previewRef.current.clientHeight - 100;
    const ratio = Math.min(pw / loadedImg.width, ph / loadedImg.height);
    setZoom(ratio > 0 ? ratio : 0.1);
    setPan({ x: 0, y: 0 }); 
  }, [img]);

  const initCropBox = useCallback((loadedImg = img) => {
    if (!loadedImg) return;
    setCropBox({ x: 0, y: 0, w: loadedImg.width, h: loadedImg.height });
  }, [img]);

  const applyCrop = useCallback(() => {
    if (!img || !cropBox) return;
    const { x, y, w, h } = cropBox;
    if (w < 10 || h < 10) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w); canvas.height = Math.round(h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    const newImg = new Image();
    newImg.onload = () => {
      setImg(newImg);
      setImgInfo(`${Math.round(w)}x${Math.round(h)}px`);
      setCells(initGridCoords(newImg, cols, rows));
      setCropBox(null);
      fitToScreen(newImg);
      setActiveTool('select');
    };
    newImg.src = canvas.toDataURL();
  }, [img, cropBox, cols, rows, fitToScreen, setImg, setImgInfo, setCells]);

  const handleSetActiveTool = (tool) => {
    if (activeTool === 'crop' && tool !== 'crop') applyCrop();
    if (tool === 'crop' && activeTool !== 'crop') initCropBox();
    setActiveTool(tool);
  };

  // ── Global Events ───────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      if (e.code === 'Space') { e.preventDefault(); stateRef.current.spacePressed = true; setSpacePressed(true); }
      if (e.code === 'Enter' && activeTool === 'crop') applyCrop();
      if (e.code === 'Escape' && activeTool === 'crop') { setCropBox(null); setActiveTool('select'); }
    };
    const onUp = (e) => {
      if (e.code === 'Space') { stateRef.current.spacePressed = false; setSpacePressed(false); }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [activeTool, applyCrop]);

  const getCanvasCoords = (e) => getCanvasCoordsUtil(e, img, canvasRef, previewRef, zoom);
  const findEdgeHit = (x, y) => findEdgeHitUtil(x, y, img, cells, zoom);

  const onMouseMove = useCallback((e) => {
    const cx = e.clientX || e.touches?.[0]?.clientX;
    const cy = e.clientY || e.touches?.[0]?.clientY;
    if (!cx || !cy) return;

    if (activeTool === 'picker') {
      const { canvasX, canvasY } = getCanvasCoords({ clientX: cx, clientY: cy });
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
        setStatusMsg(`اللون المختار: ${hex} (RGB: ${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
      }
      return;
    }

    if (stateRef.current.isPanning) {
      const dx = cx - stateRef.current.panStartX;
      const dy = cy - stateRef.current.panStartY;
      if (previewMode) setPreviewPan({ x: stateRef.current.initialPanX + dx, y: stateRef.current.initialPanY + dy });
      else setPan({ x: stateRef.current.initialPanX + dx, y: stateRef.current.initialPanY + dy });
      return;
    }

    if (previewMode) return;
    const { canvasX, canvasY } = getCanvasCoords({ clientX: cx, clientY: cy });

    // Cursors
    if (!stateRef.current.spacePressed && activeTool === 'select' && previewRef.current && !stateRef.current.isDragging) {
      const hit = findEdgeHit(canvasX, canvasY);
      if (hit) {
        if (hit.edge === 'left' || hit.edge === 'right') previewRef.current.style.cursor = 'ew-resize';
        else if (hit.edge === 'top' || hit.edge === 'bottom') previewRef.current.style.cursor = 'ns-resize';
        else previewRef.current.style.cursor = hit.edge === 'top-left' || hit.edge === 'bottom-right' ? 'nwse-resize' : 'nesw-resize';
      } else previewRef.current.style.cursor = 'default';
    }

    if (!stateRef.current.isDragging || !stateRef.current.activeCell) return;
    const dx = canvasX - stateRef.current.dragStartX;
    const dy = canvasY - stateRef.current.dragStartY;
    const { activeCell, resizeEdge, initialCell } = stateRef.current;

    setCells(prev => prev.map(c => {
      if (c.id === activeCell.id) {
        let nc = { ...c, isManual: true };
        if (resizeEdge.includes('right')) nc.w = Math.min(Math.max(10, initialCell.w + dx), img.width - initialCell.x);
        if (resizeEdge.includes('left')) { nc.x = Math.max(0, Math.min(initialCell.x + dx, initialCell.x + initialCell.w - 10)); nc.w = initialCell.x + initialCell.w - nc.x; }
        if (resizeEdge.includes('bottom')) nc.h = Math.min(Math.max(10, initialCell.h + dy), img.height - initialCell.y);
        if (resizeEdge.includes('top')) { nc.y = Math.max(0, Math.min(initialCell.y + dy, initialCell.y + initialCell.h - 10)); nc.h = initialCell.y + initialCell.h - nc.y; }
        return nc;
      }
      return c;
    }));
  }, [img, activeTool, previewMode, zoom, getCanvasCoords, findEdgeHit]);

  const onMouseDown = useCallback((e) => {
    const cx = e.clientX || e.touches?.[0]?.clientX;
    const cy = e.clientY || e.touches?.[0]?.clientY;
    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    if (activeTool === 'pan' || stateRef.current.spacePressed || e.button === 1) {
      stateRef.current.isPanning = true;
      setIsPanning(true);
      stateRef.current.panStartX = cx; stateRef.current.panStartY = cy;
      stateRef.current.initialPanX = previewMode ? previewPan.x : pan.x;
      stateRef.current.initialPanY = previewMode ? previewPan.y : pan.y;
      return;
    }
    if (activeTool === 'crop') return;
    if (!previewMode && activeTool === 'select') {
      const { canvasX, canvasY } = getCanvasCoords({ clientX: cx, clientY: cy });
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
  }, [activeTool, contextMenu, previewMode, previewPan, pan, getCanvasCoords, findEdgeHit]);

  const onMouseUp = useCallback(() => {
    stateRef.current.isPanning = false;
    setIsPanning(false);
    stateRef.current.isDragging = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}
      <div className={styles.mainLayout}>
        
        {/* Sidebar */}
        <Sidebar 
          cols={cols} setCols={setCols} rows={rows} setRows={setRows} prefix={prefix} setPrefix={setPrefix} 
          namingType={namingType} setNamingType={setNamingType} exportFormat={exportFormat} setExportFormat={setExportFormat}
          isZip={isZip} setIsZip={setIsZip} img={img} isDownloading={isDownloading} handleDownloadAll={handleDownloadAll}
          setShowHelp={setShowHelp} globalPadding={globalPadding} setGlobalPadding={setGlobalPadding} 
          skipManual={skipManual} setSkipManual={setSkipManual} handleResetAll={() => setCells(initGridCoords(img, cols, rows))} 
          setShowTutorial={setShowTutorial} handleFile={handleFile}
        />

        {/* Floating Toolbar */}
        <FloatingToolbar
          activeTool={activeTool} setActiveTool={handleSetActiveTool} hasCells={cells.length > 0} 
          previewMode={previewMode} setPreviewMode={setPreviewMode} 
          setPreviewIndex={setPreviewIndex}
          showRulers={showRulers} setShowRulers={setShowRulers}
          showGrid={showGrid} setShowGrid={setShowGrid}
          fitToScreen={fitToScreen}
          isSpacePressed={spacePressed} color="var(--c1)"
        />

        {/* Workspace */}
        <div 
          className={styles.previewArea} ref={previewRef} 
          onMouseDown={onMouseDown} 
          onContextMenu={(e) => {
            e.preventDefault(); if (!img) return;
            const { canvasX, canvasY } = getCanvasCoords(e);
            const cell = cells.find(c => canvasX >= c.x && canvasX <= c.x + c.w && canvasY >= c.y && canvasY <= c.y + c.h);
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, cell, canvasX, canvasY });
          }}
          onWheel={(e) => {
            if(!img) return;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            if (previewMode) setPreviewZoom(z => Math.max(0.05, Math.min(15, z * delta)));
            else setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
          }}
          style={{ cursor: isPanning || spacePressed ? 'grabbing' : 'default' }}
        >

          <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {activeTool === 'crop' && (
              <CropToolOverlay 
                img={img} cropBox={cropBox} setCropBox={setCropBox} zoom={zoom} 
                applyCrop={applyCrop} onCancel={() => { setCropBox(null); setActiveTool('select'); }} 
              />
            )}
          </div>

          {img && <div className={styles.canvasImgInfo}>{imgInfo}</div>}

          <PreviewOverlay
            previewMode={previewMode} setPreviewMode={setPreviewMode} previewIndex={previewIndex} setPreviewIndex={setPreviewIndex}
            cells={cells} setCells={setCells} showRulers={true} activeTool={activeTool} viewerCanvasRef={viewerCanvasRef}
            previewPan={previewPan} previewZoom={previewZoom} img={img}
          />

          <ContextMenu 
            contextMenu={contextMenu} setContextMenu={setContextMenu} downloadSingle={downloadSingle}
            handleResetCell={(id) => setCells(prev => prev.map(c => c.id === id ? { ...c, x: c.originalX, y: c.originalY, w: c.originalW, h: c.originalH, isManual: false } : c))}
            deleteCell={() => setCells(prev => prev.filter(c => c.id !== contextMenu.cell.id))}
          />
        </div>

        {/* Library Panel */}
        <GridImageLibrary 
          library={library} currentImg={img} setImg={setImg} setImgInfo={setImgInfo} 
          setPrefix={setPrefix} setCells={setCells} cols={cols} rows={rows} fitToScreen={fitToScreen}
        />

        {/* Overlays & Modals */}
        <GenericTutorial show={showTutorial} onClose={() => setShowTutorial(false)} steps={gridTutorialSteps} />
        <GenericHelpModal show={showHelp} onClose={() => setShowHelp(false)} title="دليل مقسم الصور" sections={gridHelpSections} />

      </div>
    </div>
  );
}
