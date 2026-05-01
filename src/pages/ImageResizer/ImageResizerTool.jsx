import { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Move, Download, Trash2, 
  Settings, Zap, Image as ImageIcon, 
  Lock, Unlock, RefreshCw, X, Upload, Layers,
  ChevronRight, ChevronLeft, Crop, Search, ZoomIn, ZoomOut, MousePointer2, Plus
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
        if (!activeFile.cropBox) {
          const initBox = { x: 0, y: 0, w: img.width, h: img.height };
          setCropBox(initBox);
          setTargetWidth(img.width);
          setTargetHeight(img.height);
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

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const fitToScreen = (img = imgElement) => {
    if (!img || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 100;
    const ph = containerRef.current.clientHeight - 100;
    const ratio = Math.min(cw / img.width, ph / img.height);
    setZoom(ratio * 0.8);
    setPan({ x: 0, y: 0 });
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

  const handleManualInput = (dim, value) => {
    const val = parseInt(value) || 0;
    if (dim === 'w') {
      setTargetWidth(val);
      if (lockAspectRatio && activeRatio !== 'free') {
        const ratioObj = ratios.find(r => r.id === activeRatio);
        if (ratioObj?.ratio) {
          const nh = val / ratioObj.ratio;
          setTargetHeight(Math.round(nh));
        }
      }
    } else {
      setTargetHeight(val);
      if (lockAspectRatio && activeRatio !== 'free') {
        const ratioObj = ratios.find(r => r.id === activeRatio);
        if (ratioObj?.ratio) {
          const nw = val * ratioObj.ratio;
          setTargetWidth(Math.round(nw));
        }
      }
    }
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
    const edge = findEdge(x, y);
    if (edge) {
      stateRef.current.isDragging = true;
      stateRef.current.dragEdge = edge;
      stateRef.current.startX = x;
      stateRef.current.startY = y;
      stateRef.current.initialBox = { ...cropBox };
    }
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
          if (dragEdge.includes('right')) nb.w = Math.min(Math.max(20, initialBox.w + dx), imgElement.width - initialBox.x);
          if (dragEdge.includes('left')) {
            const nx = Math.max(0, Math.min(initialBox.x + dx, initialBox.x + initialBox.w - 20));
            nb.w = initialBox.x + initialBox.w - nx;
            nb.x = nx;
          }
          if (dragEdge.includes('bottom')) nb.h = Math.min(Math.max(20, initialBox.h + dy), imgElement.height - initialBox.y);
          if (dragEdge.includes('top')) {
            const ny = Math.max(0, Math.min(initialBox.y + dy, initialBox.y + initialBox.h - 20));
            nb.h = initialBox.y + initialBox.h - ny;
            nb.y = ny;
          }
          if (currentRatio) {
            if (dragEdge === 'right' || dragEdge === 'left') nb.h = nb.w / currentRatio;
            else if (dragEdge === 'bottom' || dragEdge === 'top') nb.w = nb.h * currentRatio;
            else {
              if (Math.abs(dx) > Math.abs(dy)) nb.h = nb.w / currentRatio;
              else nb.w = nb.h * currentRatio;
            }
          }
        }
        setTargetWidth(Math.round(nb.w));
        setTargetHeight(Math.round(nb.h));
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
  }, [imgElement, zoom, activeRatio]);

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.dropzone} onClick={() => fileInputRef.current.click()}>
            <Upload size={32} color="var(--c4)" />
            <div className={styles.dropzoneText}>
              <h3>اسحب الصور هنا أو انقر للرفع</h3>
              <p>تحكم كامل في الأبعاد والنسب</p>
            </div>
          </div>
          <div className={styles.sectionTitle}><Settings size={20} /> خيارات الأبعاد</div>
          <div className={styles.inputGroup}>
            <div className={styles.labelSmall}>العرض × الارتفاع</div>
            <div className={styles.inputRow}>
              <input type="number" value={targetWidth} onChange={e => handleManualInput('w', e.target.value)} />
              <button className={`${styles.lockBtn} ${lockAspectRatio ? styles.lockActive : ''}`} onClick={() => setLockAspectRatio(!lockAspectRatio)}>
                {lockAspectRatio ? <Lock size={14}/> : <Unlock size={14}/>}
              </button>
              <input type="number" value={targetHeight} onChange={e => handleManualInput('h', e.target.value)} />
            </div>
          </div>
          <div className={styles.ratioGridScroll + " " + styles.scrollBar}>
             <div className={styles.labelSmall}>نسب القص المتاحة</div>
             <div className={styles.ratioGrid}>
                {ratios.map(r => (
                  <button key={r.id} className={`${styles.ratioBtn} ${activeRatio === r.id ? styles.ratioActive : ''}`} onClick={() => setRatio(r)}>
                    <span>{r.label}</span>
                    <small>{r.name}</small>
                  </button>
                ))}
             </div>
          </div>
          <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button className={styles.btnSecondary} disabled={!activeFile}><Layers size={18} /> تطبيق على الكل</button>
            <button className={styles.btnMain} disabled={files.length === 0}>
              <Download size={20} /> تنزيل المحدد ({files.filter(f => f.isSelected).length})
            </button>
          </div>
        </aside>

        <div className={styles.rightContent}>
          <div className={styles.topSection}>
            <FloatingToolbar 
              activeTool={activeTool} setActiveTool={setActiveTool}
              fitToScreen={fitToScreen} setZoom={setZoom}
              hasCells={!!activeFile} simpleMode={true} color="var(--c4)"
              isSpacePressed={spacePressed}
            />
            <div className={styles.workspace} ref={containerRef}>
              <div className={styles.canvasContainer} onMouseDown={handleMouseDown} onWheel={(e) => {
                  const delta = e.deltaY > 0 ? 0.9 : 1.1;
                  setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
              }}>
                {!activeFile ? (
                  <div className={styles.emptyState} onClick={() => fileInputRef.current.click()}>
                    <Upload size={60} color="var(--c4)" />
                    <h3 style={{fontWeight: 900}}>ارفع صورك للقص الاحترافي</h3>
                    <p>تحكم كامل في الأبعاد والنسب مع معاينة حية</p>
                  </div>
                ) : (
                  <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                    <canvas ref={canvasRef} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.imageListHeader}>
              <span>قائمة الصور ({files.length})</span>
              <button className={styles.addMoreBtn} onClick={() => fileInputRef.current.click()}>+ إضافة صور</button>
            </div>
            <div className={styles.imageListItems + " " + styles.scrollBar}>
              {files.map((f, i) => (
                <div key={f.id} className={`${styles.imageThumb} ${i === activeIndex ? styles.thumbActive : ''}`} onClick={() => setActiveIndex(i)}>
                  <img src={f.previewUrl} alt="" />
                  <div className={styles.thumbOverlay}>{i + 1}</div>
                  <button className={styles.deleteThumbBtn} onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}>
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
