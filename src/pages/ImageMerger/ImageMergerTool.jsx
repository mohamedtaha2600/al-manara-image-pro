import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ImageMerger.module.css';
import { Layers, UploadCloud, Download, Settings, X } from 'lucide-react';
import FloatingToolbar from '../GridSplitter/components/FloatingToolbar';
import { useCanvasRender } from './hooks/useCanvasRender';
import { useCanvasInteract } from './hooks/useCanvasInteract';
import ImageLibraryPanel from './components/ImageLibraryPanel';
import CanvasResizeHandles from './components/CanvasResizeHandles';

const CM_TO_PX = 37.7952755906;
const PRESETS = [
  { id: 'custom',    name: 'مخصص',              w: 1200, h: 800  },
  { id: 'a4_p',     name: 'A4 (طولي)',          w: 2480, h: 3508 },
  { id: 'a4_l',     name: 'A4 (عرضي)',          w: 3508, h: 2480 },
  { id: 'insta_sq', name: 'انستجرام (مربع)',    w: 1080, h: 1080 },
  { id: 'insta_st', name: 'ستوري / ريلز',       w: 1080, h: 1920 },
  { id: 'youtube',  name: 'غلاف يوتيوب',        w: 1920, h: 1080 },
  { id: 'facebook', name: 'فيسبوك',             w: 1200, h: 630  },
  { id: 'twitter',  name: 'تويتر / X',          w: 1200, h: 675  },
];

export default function ImageMergerTool() {
  const fileInputRef  = useRef(null);
  const canvasRef     = useRef(null);
  const workspaceRef  = useRef(null);

  // ── Library / Canvas Images ──────────────────────────────────────────
  const [library, setLibrary]           = useState([]);
  const [canvasImages, setCanvasImages] = useState([]);

  // ── Layout ───────────────────────────────────────────────────────────
  const [layout,     setLayout]     = useState('horizontal');
  const [gridCols,   setGridCols]   = useState(2);
  const [gridRows,   setGridRows]   = useState(2);
  const [gridPreset, setGridPreset] = useState('auto');
  const [padding,    setPadding]    = useState(10);
  const [bgColor,    setBgColor]    = useState('#ffffff');

  // ── Canvas Size ──────────────────────────────────────────────────────
  const [canvasWidth,  setCanvasWidth]  = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [unit,         setUnit]         = useState('px');
  const [presetId,     setPresetId]     = useState('custom');

  // ── Export ───────────────────────────────────────────────────────────
  const [exportFormat, setExportFormat] = useState('image/png');
  const [quality,      setQuality]      = useState(0.9);

  // ── Viewport ─────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(0.6);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });

  // ── UI State ─────────────────────────────────────────────────────────
  const [statusMsg,    setStatusMsg]    = useState('');
  const [showNumbers,  setShowNumbers]  = useState(false);
  const [activeTool,   setActiveTool]   = useState('select');
  const [activeId,     setActiveId]     = useState(null);
  const [dragState,    setDragState]    = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); setSpacePressed(true); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.target.tagName !== 'INPUT') {
        if (activeId) { setCanvasImages(prev => prev.filter(i => i.id !== activeId)); setActiveId(null); }
      }
      if (e.key === 'Escape') setActiveId(null);
    };
    const onUp = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [activeId]);

  const showStatus = useCallback((msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 3000); }, []);

  // ── Layout Data ──────────────────────────────────────────────────────
  const getLayoutData = useCallback(() => {
    const images = canvasImages;
    const totalW = canvasWidth, totalH = canvasHeight;
    const items = [];

    if (layout === 'free') {
      images.forEach(img => items.push({ id: img.id, img: img.img, x: img.freeX, y: img.freeY, w: img.freeW, h: img.freeH }));
    } else if (layout === 'horizontal') {
      const count = images.length;
      if (count > 0) {
        const itemW = (totalW - padding * (count + 1)) / count;
        images.forEach((img, idx) => {
          const x = padding + idx * (itemW + padding);
          const h = Math.min(totalH - padding * 2, itemW * (img.originalH / img.originalW));
          items.push({ id: img.id, img: img.img, x, y: (totalH - h) / 2, w: itemW, h });
        });
      }
    } else if (layout === 'vertical') {
      const count = images.length;
      if (count > 0) {
        const itemH = (totalH - padding * (count + 1)) / count;
        images.forEach((img, idx) => {
          const y = padding + idx * (itemH + padding);
          const w = Math.min(totalW - padding * 2, itemH * (img.originalW / img.originalH));
          items.push({ id: img.id, img: img.img, x: (totalW - w) / 2, y, w, h: itemH });
        });
      }
    } else if (layout === 'grid') {
      const cols = parseInt(gridCols) || 2;
      const rows = gridPreset === 'auto' ? Math.ceil(images.length / cols) : (parseInt(gridRows) || 2);
      const cW = (totalW - padding * (cols + 1)) / cols;
      const cH = (totalH - padding * (rows + 1)) / rows;
      images.forEach((img, i) => {
        if (i >= rows * cols) return;
        const col = i % cols, row = Math.floor(i / cols);
        const cx = padding + col * (cW + padding), cy = padding + row * (cH + padding);
        const sc = Math.min(cW / img.originalW, cH / img.originalH);
        const w = img.originalW * sc, h = img.originalH * sc;
        items.push({ id: img.id, img: img.img, x: cx + (cW - w) / 2, y: cy + (cH - h) / 2, w, h });
      });
    }
    return { totalW, totalH, items };
  }, [canvasImages, layout, canvasWidth, canvasHeight, padding, gridCols, gridRows, gridPreset]);

  // ── Canvas Rendering ─────────────────────────────────────────────────
  const { renderCanvas } = useCanvasRender({ canvasRef, getLayoutData, bgColor, activeId, dragState, zoom, showNumbers });

  useEffect(() => {
    let frameId;
    const loop = () => { renderCanvas(); frameId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [renderCanvas]);

  // ── Canvas size sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) { canvasRef.current.width = canvasWidth; canvasRef.current.height = canvasHeight; }
  }, [canvasWidth, canvasHeight]);

  // ── Fit to Screen ────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    if (!workspaceRef.current) return;
    const pw = workspaceRef.current.clientWidth  - 100;
    const ph = workspaceRef.current.clientHeight - 100;
    if (pw <= 0 || ph <= 0) return;
    setZoom(Math.max(0.05, Math.min(pw / canvasWidth, ph / canvasHeight)));
    setPan({ x: 0, y: 0 });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => { setTimeout(fitToScreen, 80); }, [canvasWidth, canvasHeight, fitToScreen]);

  // ── Mouse Interaction ────────────────────────────────────────────────
  const { onMouseDown, onMouseMove, onMouseUp, cursor, isPanning } = useCanvasInteract({
    canvasRef, zoom, pan, setPan, layout, canvasWidth, canvasHeight,
    activeId, setActiveId, getLayoutData, setCanvasImages, dragState, setDragState
  });

  // ── Wheel Zoom ───────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.05, Math.min(10, z * (e.deltaY > 0 ? 0.92 : 1.09))));
  }, []);

  // ── File Upload ──────────────────────────────────────────────────────
  const handleFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return;
    valid.forEach((file, fileIdx) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const item = { id: Math.random().toString(36).substr(2, 9), img, url, name: file.name, originalW: img.width, originalH: img.height };
        setLibrary(prev => [...prev, item]);
        // Auto-place only the very first image on empty canvas
        setCanvasImages(prev => {
          if (prev.length === 0 && fileIdx === 0) {
            const sc = Math.min((canvasWidth * 0.8) / img.width, (canvasHeight * 0.8) / img.height, 1);
            const w = img.width * sc, h = img.height * sc;
            return [{ ...item, freeX: (canvasWidth - w) / 2, freeY: (canvasHeight - h) / 2, freeW: w, freeH: h }];
          }
          return prev;
        });
      };
    });
  }, [canvasWidth, canvasHeight]);

  // ── Drag from library into workspace ─────────────────────────────────
  const handleWorkspaceDrop = useCallback((e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('libraryItemId');
    if (!id) return;
    const item = library.find(i => i.id === id);
    if (!item || canvasImages.some(i => i.id === id)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    let dropX = rect ? (e.clientX - rect.left) / zoom : canvasWidth / 2;
    let dropY = rect ? (e.clientY - rect.top)  / zoom : canvasHeight / 2;

    const sc = Math.min((canvasWidth * 0.4) / item.originalW, (canvasHeight * 0.4) / item.originalH, 1);
    const w = item.originalW * sc, h = item.originalH * sc;
    setCanvasImages(prev => [...prev, { ...item, freeX: dropX - w / 2, freeY: dropY - h / 2, freeW: w, freeH: h }]);
  }, [library, canvasImages, canvasWidth, canvasHeight, zoom]);

  // ── Download ─────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!canvasImages.length) return;
    showStatus('جاري التصدير...');
    const canvas = renderCanvas(true);
    if (!canvas) return;
    const ext = exportFormat === 'image/jpeg' ? 'jpg' : exportFormat === 'image/webp' ? 'webp' : 'png';
    const a = document.createElement('a');
    a.href = canvas.toDataURL(exportFormat, quality);
    a.download = `AlManara_Merger_${Date.now()}.${ext}`;
    a.click();
    showStatus('تم التحميل!');
  }, [canvasImages, renderCanvas, exportFormat, quality, showStatus]);

  // ── Display helpers ───────────────────────────────────────────────────
  const toDisplay = v => unit === 'cm' ? Number((v / CM_TO_PX).toFixed(2)) : Math.round(v);
  const fromDisplay = v => unit === 'cm' ? Math.round(v * CM_TO_PX) : Math.round(v);

  // ── Drag over workspace ───────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  // ═══════════════════════════ RENDER ══════════════════════════════════
  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}

      <div className={styles.mainLayout}>

        {/* ── RIGHT SIDEBAR ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}><Layers size={22} /> دامج الصور الاحترافي</div>
          </div>

          <div className={styles.sidebarContent}>
            <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => fileInputRef.current.click()}>
              <UploadCloud size={18} /> إضافة صور للمكتبة
            </button>

            {/* Layout */}
            <div className={styles.sidebarSection}>
              <div className={styles.sectionTitle}>تخطيط الكولاج</div>
              <select className={styles.select} value={layout} onChange={e => { setLayout(e.target.value); setTimeout(fitToScreen, 100); }}>
                <option value="horizontal">أفقي (جنباً لجنب)</option>
                <option value="vertical">عمودي (فوق بعض)</option>
                <option value="grid">شبكي منظّم</option>
                <option value="free">حر (كولاج متقدم)</option>
              </select>

              {layout === 'grid' && (
                <div style={{ marginTop: 10 }}>
                  <select className={styles.select} value={gridPreset} onChange={e => {
                    const v = e.target.value; setGridPreset(v);
                    if (v !== 'auto' && v !== 'custom') { const [c,r] = v.split('x'); setGridCols(+c); setGridRows(+r); }
                  }}>
                    <option value="auto">تلقائي</option>
                    <option value="2x2">2 × 2</option>
                    <option value="3x3">3 × 3</option>
                    <option value="2x3">2 × 3</option>
                    <option value="3x2">3 × 2</option>
                    <option value="custom">مخصص</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1 }}><label className={styles.label}>أعمدة</label><input className={styles.input} type="number" min="1" value={gridCols} onChange={e => { setGridCols(Math.max(1, +e.target.value)); setGridPreset('custom'); }} /></div>
                    {gridPreset !== 'auto' && <div style={{ flex: 1 }}><label className={styles.label}>صفوف</label><input className={styles.input} type="number" min="1" value={gridRows} onChange={e => { setGridRows(Math.max(1, +e.target.value)); setGridPreset('custom'); }} /></div>}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Size */}
            <div className={styles.sidebarSection}>
              <div className={styles.sectionTitle}>إعدادات اللوحة (Canvas)</div>
              <select className={styles.select} value={presetId} onChange={e => {
                setPresetId(e.target.value);
                const p = PRESETS.find(x => x.id === e.target.value);
                if (p) { setCanvasWidth(p.w); setCanvasHeight(p.h); setUnit('px'); }
              }}>
                {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <select className={styles.select} value={unit} onChange={e => setUnit(e.target.value)} style={{ width: 90 }}>
                  <option value="px">بيكسل</option>
                  <option value="cm">سم</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>العرض ({unit})</label>
                  <input className={styles.input} type="number" value={toDisplay(canvasWidth)} onChange={e => { setCanvasWidth(fromDisplay(+e.target.value || 100)); setPresetId('custom'); }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>الارتفاع ({unit})</label>
                  <input className={styles.input} type="number" value={toDisplay(canvasHeight)} onChange={e => { setCanvasHeight(fromDisplay(+e.target.value || 100)); setPresetId('custom'); }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className={styles.btn} style={{ flex: 1, padding: '6px' }} onClick={() => { if (canvasWidth > canvasHeight) { setCanvasWidth(canvasHeight); setCanvasHeight(canvasWidth); } }}>طولي</button>
                <button className={styles.btn} style={{ flex: 1, padding: '6px' }} onClick={() => { if (canvasWidth < canvasHeight) { setCanvasWidth(canvasHeight); setCanvasHeight(canvasWidth); } }}>عرضي</button>
              </div>
            </div>

            {/* Spacing & BG */}
            <div className={styles.sidebarSection}>
              <div className={styles.sectionTitle}>المسافات والخلفية</div>
              {layout !== 'free' && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>المسافة بين الصور: {padding}px</label>
                  <input type="range" className={styles.rangeInput} min="0" max="100" value={padding} onChange={e => setPadding(+e.target.value)} />
                </div>
              )}
              <div className={styles.inputGroup}>
                <label className={styles.label}>لون الخلفية</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" className={styles.colorPicker} value={bgColor} onChange={e => setBgColor(e.target.value)} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{bgColor}</span>
                </div>
              </div>
            </div>

            {/* Image Controls (when active) */}
            {activeId && layout === 'free' && (() => {
              const img = canvasImages.find(i => i.id === activeId);
              return img ? (
                <div className={styles.sidebarSection} style={{ borderColor: '#007AFF' }}>
                  <div className={styles.sectionTitle} style={{ color: '#007AFF' }}><Settings size={14} /> تحكم الصورة</div>
                  <button className={styles.btn} style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', marginTop: 8 }}
                    onClick={() => { setCanvasImages(prev => prev.filter(i => i.id !== activeId)); setActiveId(null); }}>
                    <X size={14} /> إزالة من اللوحة
                  </button>
                </div>
              ) : null;
            })()}

            {/* Export */}
            {canvasImages.length > 0 && (
              <div className={styles.sidebarSection}>
                <div className={styles.sectionTitle}>التصدير</div>
                <select className={styles.select} value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                  <option value="image/png">PNG (جودة عالية)</option>
                  <option value="image/jpeg">JPG (حجم أصغر)</option>
                  <option value="image/webp">WebP (متوازن)</option>
                </select>
                {exportFormat !== 'image/png' && (
                  <div className={styles.inputGroup} style={{ marginTop: 8 }}>
                    <label className={styles.label}>الجودة: {Math.round(quality * 100)}%</label>
                    <input type="range" className={styles.rangeInput} min="0.1" max="1" step="0.05" value={quality} onChange={e => setQuality(+e.target.value)} />
                  </div>
                )}
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload} style={{ marginTop: 8 }}>
                  <Download size={18} /> تحميل المدموج
                </button>
                <button className={styles.btn} onClick={() => { setCanvasImages([]); setActiveId(null); }}
                  style={{ marginTop: 6, background: 'rgba(255,0,0,0.1)', color: '#ff4444' }}>
                  مسح اللوحة
                </button>
              </div>
            )}

            {/* Numbers toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`${styles.btn} ${showNumbers ? styles.btnPrimary : ''}`} style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }} onClick={() => setShowNumbers(p => !p)}>
                {showNumbers ? '🔢 ترقيم مفعّل' : '🔢 ترقيم معطّل'}
              </button>
            </div>
          </div>
        </div>

        {/* ── WORKSPACE ── */}
        <div
          ref={workspaceRef}
          className={styles.previewArea}
          onMouseDown={e => onMouseDown(e, spacePressed, activeTool)}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={handleWheel}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => { setIsDragOver(false); handleWorkspaceDrop(e); }}
          style={{ cursor: isPanning || spacePressed ? 'grab' : cursor }}
        >
          {/* Canvas wrapper with zoom/pan */}
          <div
            className={styles.canvasWrapper}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <canvas ref={canvasRef} className={styles.canvas} />
            {/* Canvas resize handles */}
            <CanvasResizeHandles
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              setCanvasWidth={w => { setCanvasWidth(w); setPresetId('custom'); }}
              setCanvasHeight={h => { setCanvasHeight(h); setPresetId('custom'); }}
              zoom={zoom}
            />
            {/* Empty state hint */}
            {canvasImages.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                <Layers size={48} />
                <p style={{ marginTop: 8, fontSize: '0.9rem' }}>اسحب صورة من المكتبة أو أضف صوراً للبدء</p>
              </div>
            )}
          </div>

          {/* Floating toolbar */}
          <FloatingToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            fitToScreen={fitToScreen}
            simpleMode={true}
            color="var(--c6)"
            isSpacePressed={spacePressed}
          />
        </div>

        {/* ── IMAGE LIBRARY (LEFT PANEL) ── */}
        <ImageLibraryPanel
          library={library}
          canvasImages={canvasImages}
          setCanvasImages={setCanvasImages}
          setLibrary={setLibrary}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
    </div>
  );
}
