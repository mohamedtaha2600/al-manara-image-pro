import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ImageMerger.module.css';
import { Layers, UploadCloud, X, Download, Maximize, ZoomIn, ZoomOut, Move, Settings, Type } from 'lucide-react';

const CM_TO_PX = 37.7952755906;

const PRESETS = [
  { id: 'custom', name: 'مخصص', w: 1920, h: 1080 },
  { id: 'a4_p', name: 'A4 (طولي)', w: 2480, h: 3508 },
  { id: 'a4_l', name: 'A4 (عرضي)', w: 3508, h: 2480 },
  { id: 'insta_sq', name: 'انستجرام (مربع)', w: 1080, h: 1080 },
  { id: 'insta_st', name: 'ستوري / ريلز', w: 1080, h: 1920 },
  { id: 'youtube', name: 'غلاف يوتيوب', w: 1920, h: 1080 },
];

export default function ImageMergerTool() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewAreaRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState('horizontal'); // horizontal, vertical, grid, free
  const [gridCols, setGridCols] = useState(2);
  const [padding, setPadding] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [exportFormat, setExportFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.9);

  // Freeform Canvas settings
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [unit, setUnit] = useState('px'); // 'px', 'cm'
  const [presetId, setPresetId] = useState('custom');
  
  // Preview Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null); // for list reordering

  // Canvas interaction state
  const [activeImgId, setActiveImgId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    
    let loadedCount = 0;
    const newImages = [];
    
    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        newImages.push({
          id: Date.now() + Math.random(),
          file,
          url,
          img,
          originalW: img.width,
          originalH: img.height,
          freeX: 0,
          freeY: 0,
          freeW: img.width,
          freeH: img.height,
          scale: 1
        });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImages(prev => {
             const updated = [...prev, ...newImages];
             // Auto position in free mode initially
             if (layout === 'free') {
                return updated.map((item, idx) => ({
                   ...item,
                   freeX: (idx * 50) % 500,
                   freeY: (idx * 50) % 500
                }));
             }
             return updated;
          });
          if (images.length === 0) {
            setTimeout(fitToScreen, 100);
          }
        }
      };
      img.src = url;
    });
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handlePresetChange = (e) => {
    const pId = e.target.value;
    setPresetId(pId);
    if (pId !== 'custom') {
      const p = PRESETS.find(p => p.id === pId);
      setCanvasWidth(p.w);
      setCanvasHeight(p.h);
      setUnit('px'); // Presets are in px
    }
  };

  const toDisplayValue = (pxVal) => unit === 'cm' ? Number((pxVal / CM_TO_PX).toFixed(2)) : Math.round(pxVal);
  const fromDisplayValue = (val) => unit === 'cm' ? Math.round(val * CM_TO_PX) : Math.round(val);

  const getLayoutData = useCallback(() => {
    let totalW = 0, totalH = 0;
    const items = [];
    
    if (layout === 'free') {
      totalW = canvasWidth;
      totalH = canvasHeight;
      images.forEach(img => {
        items.push({
          id: img.id,
          img: img.img,
          x: img.freeX,
          y: img.freeY,
          w: img.freeW * img.scale,
          h: img.freeH * img.scale
        });
      });
    } else if (layout === 'horizontal') {
      const maxH = images.length > 0 ? Math.max(...images.map(img => img.originalH)) : 0;
      totalH = maxH + padding * 2;
      let currX = padding;
      images.forEach(img => {
        const yPos = padding + (totalH - padding * 2 - img.originalH) / 2;
        items.push({ id: img.id, img: img.img, x: currX, y: yPos, w: img.originalW, h: img.originalH });
        currX += img.originalW + padding;
      });
      totalW = images.length > 0 ? currX : 0;
    } else if (layout === 'vertical') {
      const maxW = images.length > 0 ? Math.max(...images.map(img => img.originalW)) : 0;
      totalW = maxW + padding * 2;
      let currY = padding;
      images.forEach(img => {
        const xPos = padding + (totalW - padding * 2 - img.originalW) / 2;
        items.push({ id: img.id, img: img.img, x: xPos, y: currY, w: img.originalW, h: img.originalH });
        currY += img.originalH + padding;
      });
      totalH = images.length > 0 ? currY : 0;
    } else if (layout === 'grid') {
      const cols = parseInt(gridCols) || 1;
      const rows = Math.ceil(images.length / cols);
      const cellW = images.length > 0 ? Math.max(...images.map(img => img.originalW)) : 0;
      const cellH = images.length > 0 ? Math.max(...images.map(img => img.originalH)) : 0;
      
      totalW = images.length > 0 ? cols * cellW + (cols - 1) * padding + padding * 2 : 0;
      totalH = images.length > 0 ? rows * cellH + (rows - 1) * padding + padding * 2 : 0;
      
      images.forEach((img, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padding + col * (cellW + padding);
        const y = padding + row * (cellH + padding);
        const drawX = x + (cellW - img.originalW) / 2;
        const drawY = y + (cellH - img.originalH) / 2;
        items.push({ id: img.id, img: img.img, x: drawX, y: drawY, w: img.originalW, h: img.originalH });
      });
    }
    
    return { totalW, totalH, items };
  }, [images, layout, canvasWidth, canvasHeight, padding, gridCols]);

  const renderMergedImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { totalW, totalH, items } = getLayoutData();

    if (totalW === 0 || totalH === 0) {
       canvas.width = 0; canvas.height = 0; return;
    }

    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    items.forEach(item => {
      let x = item.x, y = item.y;
      // If dragging, use drag coordinates
      if (dragState && dragState.id === item.id) {
        x = dragState.currentX;
        y = dragState.currentY;
      }
      ctx.drawImage(item.img, x, y, item.w, item.h);
      
      // Draw selection border if active
      if (item.id === activeImgId) {
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(x, y, item.w, item.h);
      }
    });
  }, [getLayoutData, bgColor, dragState, activeImgId, zoom]);

  useEffect(() => {
    let animationFrameId;
    const renderLoop = () => {
      renderMergedImage();
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderMergedImage]);

  const fitToScreen = () => {
    if (!previewAreaRef.current || !canvasRef.current || images.length === 0) return;
    const pw = previewAreaRef.current.clientWidth - 40;
    const ph = previewAreaRef.current.clientHeight - 40;
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    if (cw === 0 || ch === 0) return;
    
    const ratio = Math.min(pw / cw, ph / ch);
    setZoom(ratio > 0 ? ratio : 1);
    setPan({ x: 0, y: 0 });
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (spacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const { items } = getLayoutData();
    
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        setActiveImgId(item.id);
        setDragState({
          id: item.id,
          mouseStartX: x,
          mouseStartY: y,
          imgStartX: item.x,
          imgStartY: item.y,
          currentX: item.x,
          currentY: item.y
        });
        return;
      }
    }
    setActiveImgId(null);
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (dragState) {
      const { x, y } = getCanvasCoords(e);
      const dx = x - dragState.mouseStartX;
      const dy = y - dragState.mouseStartY;
      let newX = dragState.imgStartX + dx;
      let newY = dragState.imgStartY + dy;
      
      if (layout === 'free') {
         const snapThreshold = 15 / zoom;
         const { totalW, totalH, items } = getLayoutData();
         const xTargets = [0, totalW];
         const yTargets = [0, totalH];
         items.forEach(item => {
           if (item.id !== dragState.id) {
             xTargets.push(item.x, item.x + item.w);
             yTargets.push(item.y, item.y + item.h);
           }
         });
         
         const snap = (val, targets) => {
           let closest = val;
           let minDiff = snapThreshold;
           targets.forEach(t => {
             if (Math.abs(val - t) < minDiff) { minDiff = Math.abs(val - t); closest = t; }
           });
           return closest;
         };
         
         const activeImg = images.find(i => i.id === dragState.id);
         const w = activeImg.freeW * activeImg.scale;
         const h = activeImg.freeH * activeImg.scale;

         const snappedLeft = snap(newX, xTargets);
         if (snappedLeft !== newX) { newX = snappedLeft; }
         else {
           const snappedRight = snap(newX + w, xTargets);
           if (snappedRight !== newX + w) { newX = snappedRight - w; }
         }
         
         const snappedTop = snap(newY, yTargets);
         if (snappedTop !== newY) { newY = snappedTop; }
         else {
           const snappedBottom = snap(newY + h, yTargets);
           if (snappedBottom !== newY + h) { newY = snappedBottom - h; }
         }
         
         setImages(prev => prev.map(img => img.id === dragState.id ? { ...img, freeX: newX, freeY: newY } : img));
      }
      
      setDragState(prev => ({ ...prev, currentX: newX, currentY: newY }));
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    if (dragState && layout !== 'free') {
      const { x, y } = getCanvasCoords(e);
      const { items } = getLayoutData();
      const targetItem = items.find(item => item.id !== dragState.id && x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
      
      if (targetItem) {
         setImages(prev => {
           const newArr = [...prev];
           const idx1 = newArr.findIndex(i => i.id === dragState.id);
           const idx2 = newArr.findIndex(i => i.id === targetItem.id);
           const temp = newArr[idx1];
           newArr[idx1] = newArr[idx2];
           newArr[idx2] = temp;
           return newArr;
         });
      }
    }
    setDragState(null);
  };

  const handleWheel = (e) => {
    if (images.length === 0) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.05, Math.min(10, z * delta)));
  };

  const handleDownload = () => {
    if (images.length === 0) return;
    
    // Temporarily remove selection box for export
    const currentActive = activeImgId;
    setActiveImgId(null);
    
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      showStatus('جاري معالجة الصورة...');
      
      const ext = exportFormat === 'image/jpeg' ? 'jpg' : exportFormat === 'image/webp' ? 'webp' : 'png';
      const filename = `AlManara_Merger_${Date.now()}.${ext}`;
      
      const dataUrl = canvas.toDataURL(exportFormat, quality);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showStatus('تم التحميل بنجاح!');
      
      setActiveImgId(currentActive);
    }, 50);
  };

  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}
      
      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>
              <Layers size={24} /> دامج الصور الاحترافي
            </div>
          </div>
          
          <div className={styles.sidebarContent}>
            <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => fileInputRef.current.click()}>
              <UploadCloud size={20} /> إضافة صور
            </button>
            
            {images.length > 0 && (
              <>
                <div className={styles.sidebarSection}>
                  <div className={styles.sectionTitle}>تخطيط الكولاج (Layout)</div>
                  <div className={styles.inputGroup}>
                    <select className={styles.select} value={layout} onChange={(e) => { setLayout(e.target.value); setTimeout(fitToScreen, 100); }}>
                      <option value="horizontal">أفقي (جنباً لجنب)</option>
                      <option value="vertical">عمودي (فوق بعض)</option>
                      <option value="grid">تخطيط شبكي منظّم</option>
                      <option value="free">حر (كولاج متقدم)</option>
                    </select>
                  </div>
                  
                  {layout === 'grid' && (
                    <div className={styles.inputGroup}>
                      <label>عدد الأعمدة</label>
                      <input type="number" className={styles.input} value={gridCols} onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))} min="1"/>
                    </div>
                  )}

                  {layout === 'free' && (
                    <>
                      <div className={styles.inputGroup}>
                        <label>وحدة القياس</label>
                        <select className={styles.select} value={unit} onChange={(e) => {
                          const newUnit = e.target.value;
                          setUnit(newUnit);
                        }}>
                          <option value="px">بيكسل (px)</option>
                          <option value="cm">سنتيمتر (cm)</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>مقاسات جاهزة (لوحة العمل)</label>
                        <select className={styles.select} value={presetId} onChange={handlePresetChange}>
                          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className={styles.inputGroup} style={{flexDirection: 'row', gap: '10px'}}>
                        <div style={{flex: 1}}>
                          <label>العرض ({unit})</label>
                          <input type="number" className={styles.input} value={toDisplayValue(canvasWidth)} onChange={(e) => {
                             setCanvasWidth(fromDisplayValue(parseFloat(e.target.value) || 0));
                             setPresetId('custom');
                          }} />
                        </div>
                        <div style={{flex: 1}}>
                          <label>الارتفاع ({unit})</label>
                          <input type="number" className={styles.input} value={toDisplayValue(canvasHeight)} onChange={(e) => {
                             setCanvasHeight(fromDisplayValue(parseFloat(e.target.value) || 0));
                             setPresetId('custom');
                          }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {layout !== 'free' && (
                  <div className={styles.sidebarSection}>
                    <div className={styles.sectionTitle}>المسافات والخلفية</div>
                    <div className={styles.inputGroup}>
                      <label>المسافة بين الصور: {padding}px</label>
                      <input type="range" className={styles.rangeInput} min="0" max="200" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>لون الخلفية</label>
                      <div className={styles.colorPickerWrap}>
                        <input type="color" className={styles.colorPicker} value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                        <span style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>{bgColor}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {layout === 'free' && (
                  <div className={styles.sidebarSection}>
                    <div className={styles.sectionTitle}>خلفية لوحة العمل</div>
                    <div className={styles.inputGroup}>
                      <div className={styles.colorPickerWrap}>
                        <input type="color" className={styles.colorPicker} value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                        <span style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>{bgColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {layout === 'free' && activeImgId && (
                  <div className={styles.sidebarSection} style={{borderColor: 'var(--c6)'}}>
                    <div className={styles.sectionTitle} style={{color: 'var(--c6)'}}><Settings size={16} /> تحكم الصورة المحددة</div>
                    <div className={styles.inputGroup}>
                      <label>حجم الصورة (Scale)</label>
                      <input 
                        type="range" className={styles.rangeInput} min="0.1" max="5" step="0.1" 
                        value={images.find(i=>i.id===activeImgId)?.scale || 1} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setImages(prev => prev.map(img => img.id === activeImgId ? { ...img, scale: val } : img));
                        }} 
                      />
                    </div>
                  </div>
                )}

                <div className={styles.sidebarSection}>
                  <div className={styles.sectionTitle}>إعدادات التصدير</div>
                  <div className={styles.inputGroup}>
                    <select className={styles.select} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                      <option value="image/png">PNG (جودة عالية)</option>
                      <option value="image/jpeg">JPG (حجم أصغر)</option>
                      <option value="image/webp">WebP (متوازن)</option>
                    </select>
                  </div>
                  {exportFormat !== 'image/png' && (
                    <div className={styles.inputGroup}>
                      <label>الجودة: {Math.round(quality * 100)}%</label>
                      <input type="range" className={styles.rangeInput} min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} />
                    </div>
                  )}
                </div>

                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload} style={{background: 'var(--c6)', color: '#000'}}>
                  <Download size={20} /> تحميل الصورة المدمجة
                </button>
                <button className={styles.btn} onClick={() => setImages([])} style={{background: 'rgba(255,0,0,0.1)', color: '#ff4444'}}>
                  مسح الكل
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Preview Area */}
        <div 
          className={styles.previewArea} ref={previewAreaRef}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: spacePressed ? 'grab' : (dragState ? 'grabbing' : 'default') }}
        >
          {images.length > 0 ? (
            <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
              <canvas ref={canvasRef} className={styles.canvas} />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Layers size={64} className={styles.emptyStateIcon} />
              <h2>اسحب وأفلت الصور هنا لإنشاء الكولاج</h2>
            </div>
          )}

          {images.length > 0 && (
            <div className={styles.toolbar}>
              <button className={styles.toolBtn} onClick={(e) => { e.stopPropagation(); setZoom(z => z * 1.1); }} title="تكبير"><ZoomIn size={20} /></button>
              <button className={styles.toolBtn} onClick={(e) => { e.stopPropagation(); setZoom(z => z * 0.9); }} title="تصغير"><ZoomOut size={20} /></button>
              <button className={styles.toolBtn} onClick={(e) => { e.stopPropagation(); fitToScreen(); }} title="ملاءمة الشاشة"><Maximize size={20} /></button>
              <button className={styles.toolBtn} onClick={(e) => { e.stopPropagation(); setPan({x:0, y:0}); setZoom(1); }} title="الحجم الأصلي"><Move size={20} /></button>
            </div>
          )}
        </div>

        {/* Vertical Image List */}
        {images.length > 0 && (
          <div className={styles.imageListArea}>
            {images.map((img, idx) => (
              <div 
                key={img.id} 
                className={`${styles.imageItem} ${activeImgId === img.id ? styles.active : ''}`}
                onClick={() => setActiveImgId(img.id)}
              >
                <img src={img.url} alt={`Image`} />
                <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(i => i.id !== img.id)); }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
