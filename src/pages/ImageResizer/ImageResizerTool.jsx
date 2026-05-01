import { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Move, Download, Trash2, 
  Settings, Zap, Image as ImageIcon, 
  Lock, Unlock, RefreshCw, X, Upload, Layers,
  ChevronRight, ChevronLeft, Crop, Search, ZoomIn, ZoomOut, MousePointer2
} from 'lucide-react';
import JSZip from 'jszip';
import styles from './ImageResizer.module.css';
import { useResizerCanvas } from './hooks/useResizerCanvas';
import FloatingToolbar from '../GridSplitter/components/FloatingToolbar';

export default function ImageResizerTool() {
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [activeRatio, setActiveRatio] = useState('free');
  
  // Canvas Interaction States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [activeTool, setActiveTool] = useState('select'); // select, pan
  const [spacePressed, setSpacePressed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const stateRef = useRef({ 
    isDragging: false, dragEdge: null, startX: 0, startY: 0, initialBox: null,
    isPanning: false, panStartX: 0, panStartY: 0, initialPanX: 0, initialPanY: 0
  });

  // Track Spacebar
  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleManualInput = (dim, value) => {
    const val = parseInt(value) || 0;
    if (dim === 'w') {
      setTargetWidth(val);
      setCropBox(prev => {
        const nb = { ...prev, w: Math.min(val, imgElement.width - prev.x) };
        if (lockAspectRatio && activeRatio !== 'free') {
          const ratio = ratios.find(r => r.id === activeRatio).ratio;
          nb.h = nb.w / ratio;
          setTargetHeight(Math.round(nb.h));
        }
        updateActiveFileSettings(nb, nb.w, parseInt(targetHeight));
        return nb;
      });
    } else {
      setTargetHeight(val);
      setCropBox(prev => {
        const nb = { ...prev, h: Math.min(val, imgElement.height - prev.y) };
        if (lockAspectRatio && activeRatio !== 'free') {
          const ratio = ratios.find(r => r.id === activeRatio).ratio;
          nb.w = nb.h * ratio;
          setTargetWidth(Math.round(nb.w));
        }
        updateActiveFileSettings(prev, parseInt(targetWidth), nb.h);
        return nb;
      });
    }
  };

  const activeFile = files[activeIndex] || null;
  const [imgElement, setImgElement] = useState(null);

  const ratios = [
    { label: 'قص حر', id: 'free', ratio: null },
    { label: '1:1', id: '1:1', ratio: 1, name: 'مربع' },
    { label: '4:3', id: '4:3', ratio: 4/3, name: 'شاشة' },
    { label: '16:9', id: '16:9', ratio: 16/9, name: 'يوتيوب' },
    { label: '9:16', id: '9:16', ratio: 9/16, name: 'تيك توك' },
    { label: '21:9', id: '21:9', ratio: 21/9, name: 'عريض جداً' },
    { label: '3:2', id: '3:2', ratio: 3/2, name: 'كاميرا' },
    { label: '2:3', id: '2:3', ratio: 2/3, name: 'بورتريه' },
    { label: '5:4', id: '5:4', ratio: 5/4, name: 'فني' },
    { label: 'A4', id: 'a4', ratio: 1/1.414, name: 'ورقة' }
  ];

  useResizerCanvas({ canvasRef, img: imgElement, cropBox, zoom, pan });

  useEffect(() => {
    if (activeFile) {
      const img = new Image();
      img.onload = () => {
        setImgElement(img);
        
        // If image doesn't have settings, initialize it
        if (!activeFile.cropBox) {
          const initBox = { x: 0, y: 0, w: img.width, h: img.height };
          setCropBox(initBox);
          setTargetWidth(img.width);
          setTargetHeight(img.height);
          // Save to state
          setFiles(prev => prev.map((f, i) => 
            i === activeIndex ? { ...f, cropBox: initBox, targetWidth: img.width, targetHeight: img.height } : f
          ));
        } else {
          setCropBox(activeFile.cropBox);
          setTargetWidth(activeFile.targetWidth);
          setTargetHeight(activeFile.targetHeight);
        }
        
        fitToScreen(img);
      };
      img.src = activeFile.previewUrl;
    } else {
      setImgElement(null);
    }
  }, [activeFile?.id, activeIndex]);

  const fitToScreen = (img = imgElement) => {
    if (!img || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 40;
    const ph = containerRef.current.clientHeight - 40;
    const ratio = Math.min(cw / img.width, ph / img.height);
    setZoom(ratio * 0.7); // 70% Scale for better margins
    setPan({ x: 0, y: 0 });
  };

  const handleApplyToAll = () => {
    if (!activeFile) return;
    setFiles(prev => prev.map(f => ({
      ...f,
      cropBox: { ...cropBox },
      targetWidth,
      targetHeight
    })));
  };

  const handleAddFiles = (newFiles) => {
    const promises = Array.from(newFiles).map(file => {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            originalWidth: img.width,
            originalHeight: img.height,
            previewUrl: url,
            status: 'pending',
            isSelected: true
          });
        };
        img.src = url;
      });
    });

    Promise.all(promises).then(newObjs => {
      setFiles(prev => [...prev, ...newObjs]);
    });
  };

  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isSelected: !f.isSelected } : f));
  };

  const toggleAllSelection = () => {
    const allSelected = files.length > 0 && files.every(f => f.isSelected);
    setFiles(prev => prev.map(f => ({ ...f, isSelected: !allSelected })));
  };

  const handleDeleteFile = (e, index) => {
    e.stopPropagation(); // Don't trigger active index change
    const newFiles = files.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(files[index].previewUrl);
    
    setFiles(newFiles);
    
    // Adjust active index
    if (index <= activeIndex && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (newFiles.length === 0) {
      setActiveIndex(0);
    }
  };

  const setRatio = (rObj) => {
    setActiveRatio(rObj.id);
    if (!imgElement || !rObj.ratio) return;
    
    let nw = imgElement.width;
    let nh = imgElement.height;
    
    if (imgElement.width / imgElement.height > rObj.ratio) {
      nw = imgElement.height * rObj.ratio;
    } else {
      nh = imgElement.width / rObj.ratio;
    }
    
    const nx = (imgElement.width - nw) / 2;
    const ny = (imgElement.height - nh) / 2;
    setCropBox({ x: nx, y: ny, w: nw, h: nh });
    setTargetWidth(Math.round(nw));
    setTargetHeight(Math.round(nh));
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
    if (!imgElement) return;
    
    if (activeTool === 'pan' || spacePressed || e.button === 1) {
      stateRef.current.isPanning = true;
      stateRef.current.panStartX = e.clientX;
      stateRef.current.panStartY = e.clientY;
      stateRef.current.initialPanX = pan.x;
      stateRef.current.initialPanY = pan.y;
      return;
    }

    const { x, y } = getCanvasCoords(e);
    // Logic for finding edge omitted for brevity but should be here...
    // Re-implementing simplified edge find
    const edge = findEdge(x, y);
    if (edge) {
      stateRef.current.isDragging = true;
      stateRef.current.dragEdge = edge;
      stateRef.current.startX = x;
      stateRef.current.startY = y;
      stateRef.current.initialBox = { ...cropBox };
    }
  };

  const findEdge = (x, y) => {
    const threshold = 15 / zoom;
    const { x: bx, y: by, w: bw, h: bh } = cropBox;
    if (Math.abs(x - bx) < threshold && Math.abs(y - by) < threshold) return 'top-left';
    if (Math.abs(x - (bx + bw)) < threshold && Math.abs(y - by) < threshold) return 'top-right';
    if (Math.abs(x - bx) < threshold && Math.abs(y - (by + bh)) < threshold) return 'bottom-left';
    if (Math.abs(x - (bx + bw)) < threshold && Math.abs(y - (by + bh)) < threshold) return 'bottom-right';
    if (Math.abs(y - by) < threshold && x > bx && x < bx + bw) return 'top';
    if (Math.abs(y - (by + bh)) < threshold && x > bx && x < bx + bw) return 'bottom';
    if (Math.abs(x - bx) < threshold && y > by && y < by + bh) return 'left';
    if (Math.abs(x - (bx + bw)) < threshold && y > by && y < by + bh) return 'right';
    if (x > bx && x < bx + bw && y > by && y < by + bh) return 'move';
    return null;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (stateRef.current.isPanning) {
        const dx = e.clientX - stateRef.current.panStartX;
        const dy = e.clientY - stateRef.current.panStartY;
        setPan({ x: stateRef.current.initialPanX + dx, y: stateRef.current.initialPanY + dy });
        return;
      }

      if (!stateRef.current.isDragging) return;
      const { x, y } = getCanvasCoords(e);
      const dx = x - stateRef.current.startX;
      const dy = y - stateRef.current.startY;
      const { dragEdge, initialBox } = stateRef.current;

      setCropBox(prev => {
        let nb = { ...prev };
        const currentRatio = activeRatio !== 'free' ? ratios.find(r => r.id === activeRatio).ratio : null;

        if (dragEdge === 'move') {
          nb.x = Math.max(0, Math.min(initialBox.x + dx, imgElement.width - initialBox.w));
          nb.y = Math.max(0, Math.min(initialBox.y + dy, imgElement.height - initialBox.h));
        } else {
          // 1. Independent Resizing (Sides) or 2D Resizing (Corners)
          if (dragEdge.includes('right')) {
            nb.w = Math.min(Math.max(20, initialBox.w + dx), imgElement.width - initialBox.x);
          }
          if (dragEdge.includes('left')) {
            const nx = Math.max(0, Math.min(initialBox.x + dx, initialBox.x + initialBox.w - 20));
            nb.w = initialBox.x + initialBox.w - nx;
            nb.x = nx;
          }
          if (dragEdge.includes('bottom')) {
            nb.h = Math.min(Math.max(20, initialBox.h + dy), imgElement.height - initialBox.y);
          }
          if (dragEdge.includes('top')) {
            const ny = Math.max(0, Math.min(initialBox.y + dy, initialBox.y + initialBox.h - 20));
            nb.h = initialBox.y + initialBox.h - ny;
            nb.y = ny;
          }

          // 2. Apply Ratio Lock ONLY if not in free mode
          if (currentRatio) {
            if (dragEdge === 'right' || dragEdge === 'left') nb.h = nb.w / currentRatio;
            else if (dragEdge === 'bottom' || dragEdge === 'top') nb.w = nb.h * currentRatio;
            else {
              // Corners maintain ratio based on larger change
              if (Math.abs(dx) > Math.abs(dy)) nb.h = nb.w / currentRatio;
              else nb.w = nb.h * currentRatio;
            }
          }
        }
        
        const finalBox = nb;
        setTargetWidth(Math.round(nb.w));
        setTargetHeight(Math.round(nb.h));
        
        // Sync to files array memory
        setFiles(prev => prev.map((f, i) => 
          i === activeIndex ? { ...f, cropBox: finalBox, targetWidth: Math.round(finalBox.w), targetHeight: Math.round(finalBox.h) } : f
        ));

        return nb;
      });
    };

    const handleMouseUp = () => { 
      stateRef.current.isDragging = false; 
      stateRef.current.isPanning = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [imgElement, zoom, activeRatio, activeIndex]);

  const processFile = async (f) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const box = f.cropBox || { x: 0, y: 0, w: img.width, h: img.height };
        const tw = parseInt(f.targetWidth) || img.width;
        const th = parseInt(f.targetHeight) || img.height;
        
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, tw, th);
        
        canvas.toBlob((blob) => {
          resolve({ name: f.name, blob });
        }, f.file.type, 0.92);
      };
      img.src = f.previewUrl;
    });
  };

  const handleBatchExport = async () => {
    const filesToExport = files.filter(f => f.isSelected);
    if (filesToExport.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    const zip = new JSZip();
    
    for (let i = 0; i < filesToExport.length; i++) {
      const result = await processFile(filesToExport[i]);
      zip.file(`cropped_${result.name}`, result.blob);
      setProgress(Math.round(((i + 1) / filesToExport.length) * 100));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `AlManara_Batch_Resized_${Date.now()}.zip`;
    link.click();
    
    setIsProcessing(false);
    setProgress(0);
  };

  const selectedCount = files.filter(f => f.isSelected).length;

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sectionTitle}><Settings size={20} /> خيارات الأبعاد</div>
          
          <div className={styles.inputGroup}>
            <div className={styles.labelSmall}>العرض × الارتفاع</div>
            <div className={styles.inputRow}>
              <input type="number" value={targetWidth} onChange={e => handleManualInput('w', e.target.value)} />
              <button 
                className={`${styles.lockBtn} ${lockAspectRatio ? styles.lockActive : ''}`}
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
              >
                {lockAspectRatio ? <Lock size={14}/> : <Unlock size={14}/>}
              </button>
              <input type="number" value={targetHeight} onChange={e => handleManualInput('h', e.target.value)} />
            </div>
          </div>

          <div className={styles.ratioGridScroll + " " + styles.scrollBar}>
             <div className={styles.labelSmall}>نسب القص المتاحة</div>
             <div className={styles.ratioGrid}>
                {ratios.map(r => (
                  <button 
                    key={r.id} 
                    className={`${styles.ratioBtn} ${activeRatio === r.id ? styles.ratioActive : ''}`}
                    onClick={() => setRatio(r)}
                  >
                    <span style={{fontSize: '0.85rem', fontWeight: 900}}>{r.label}</span>
                    <span style={{fontSize: '0.6rem', color: '#666'}}>{r.name}</span>
                  </button>
                ))}
             </div>
          </div>

          <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button className={styles.btnSecondary} onClick={handleApplyToAll} disabled={!activeFile || isProcessing}>
              <Layers size={18} /> تطبيق على الكل
            </button>
            <button className={styles.btnMain} onClick={handleBatchExport} disabled={selectedCount === 0 || isProcessing}>
              {isProcessing ? (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{width: `${progress}%`}}></div>
                  <span className={styles.progressText}>جاري المعالجة {progress}%</span>
                </div>
              ) : (
                <>
                  <Download size={20} /> تنزيل المحدد ({selectedCount})
                </>
              )}
            </button>
          </div>
        </aside>

        <FloatingToolbar 
          activeTool={activeTool} setActiveTool={setActiveTool}
          fitToScreen={fitToScreen} setZoom={setZoom}
          hasCells={!!activeFile}
          simpleMode={true}
          color="var(--c4)"
        />

        <div className={styles.workspace} ref={containerRef}>
          <div 
            className={styles.canvasContainer} 
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              if (activeTool !== 'select' || stateRef.current.isDragging || spacePressed) return;
              const { x, y } = getCanvasCoords(e);
              const edge = findEdge(x, y);
              if (edge) {
                if (edge === 'move') e.target.style.cursor = 'move';
                else if (edge.includes('left') || edge.includes('right')) e.target.style.cursor = 'ew-resize';
                else if (edge.includes('top') || edge.includes('bottom')) e.target.style.cursor = 'ns-resize';
              } else {
                e.target.style.cursor = 'default';
              }
            }}
            style={{ 
              cursor: (activeTool === 'pan' || spacePressed)
                ? (stateRef.current.isPanning ? 'grabbing' : 'grab') 
                : 'default' 
            }}
            onWheel={(e) => {
              const delta = e.deltaY > 0 ? 0.9 : 1.1;
              setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
            }}
          >
            {!activeFile ? (
              <div className={styles.emptyState} onClick={() => fileInputRef.current.click()}>
                <Upload size={60} color="var(--res-primary)" />
                <h3 style={{fontWeight: 900}}>ارفع صورك للقص الاحترافي</h3>
                <p>تحكم كامل في الأبعاد والنسب مع معاينة حية</p>
              </div>
            ) : (
              <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <canvas ref={canvasRef} />
              </div>
            )}
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.imageListHeader}>
              <span>قائمة الصور ({files.length})</span>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className={styles.addMoreBtn} onClick={toggleAllSelection} style={{background: 'rgba(255,255,255,0.1)'}}>تحديد الكل</button>
                <button className={styles.addMoreBtn} onClick={() => fileInputRef.current.click()}>+ إضافة صور</button>
              </div>
            </div>
            <div className={styles.imageListItems + " " + styles.scrollBar}>
              {files.map((f, i) => (
                <div 
                  key={f.id} 
                  className={`${styles.imageThumb} ${i === activeIndex ? styles.thumbActive : ''}`}
                  onClick={() => setActiveIndex(i)}
                  style={{opacity: f.isSelected ? 1 : 0.4}}
                >
                  <img src={f.previewUrl} alt="" />
                  <div className={styles.thumbOverlay}>{i + 1}</div>
                  <input type="checkbox" checked={f.isSelected} onChange={(e) => toggleSelection(e, f.id)} style={{position: 'absolute', top: 5, right: 5, cursor: 'pointer', zIndex: 10}} onClick={e => e.stopPropagation()} />
                  <button className={styles.deleteThumbBtn} onClick={(e) => handleDeleteFile(e, i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} multiple hidden onChange={e => handleAddFiles(e.target.files)} />
    </div>
  );
}
