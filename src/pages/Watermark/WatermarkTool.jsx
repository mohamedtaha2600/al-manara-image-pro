import { useState, useRef, useEffect } from 'react';
import { 
  Settings, Download, Trash2, Image as ImageIcon, 
  Type, Move, RefreshCw, Upload, Layers,
  ChevronRight, ChevronLeft, Droplets, AlignLeft,
  AlignCenter, AlignRight, Grid, Layout, X, UploadCloud
} from 'lucide-react';
import JSZip from 'jszip';
import styles from './Watermark.module.css';
import { useWatermarkCanvas } from './hooks/useWatermarkCanvas';
import FloatingToolbar from '../GridSplitter/components/FloatingToolbar';

export default function WatermarkTool() {
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Settings
  const [settings, setSettings] = useState({
    type: 'text',
    text: 'Al-Manara Platform',
    fontSize: 60,
    color: '#ffffff',
    opacity: 50,
    rotation: 0,
    x: 100, y: 100, relX: 0.5, relY: 0.5,
    fontWeight: 'bold', fontFamily: 'Arial',
    isTiled: false,
    imageScale: 50,
    activeAnchor: 'center',
    isDragging: false,
    showLogoWithText: false,
    logoScale: 30,
    logoPos: 'above',
    tileSpacing: 50
  });

  const [watermarkImg, setWatermarkImg] = useState(null);
  const [hybridLogoImg, setHybridLogoImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('select');
  const [spacePressed, setSpacePressed] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const watermarkInputRef = useRef(null);
  const hybridLogoInputRef = useRef(null);
  const stateRef = useRef({ 
    isDragging: false, startX: 0, startY: 0, initialRelX: 0, initialRelY: 0,
    isPanning: false, panStartX: 0, panStartY: 0, initialPanX: 0, initialPanY: 0
  });

  const activeFile = files[activeIndex] || null;
  const [imgElement, setImgElement] = useState(null);

  // Sync canvas with settings
  useWatermarkCanvas({ 
    canvasRef, img: imgElement, watermark: watermarkImg, 
    settings: { ...settings, hybridLogo: hybridLogoImg }, zoom, pan 
  });

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (activeFile) {
      const img = new Image();
      img.onload = () => {
        setImgElement(img);
        if (activeFile.settings) {
          const s = activeFile.settings;
          setSettings({ ...s, x: s.relX * img.width, y: s.relY * img.height });
        } else {
          const initS = { ...settings, relX: 0.5, relY: 0.5, x: img.width / 2, y: img.height / 2 };
          setSettings(initS);
          setFiles(prev => prev.map((f, i) => i === activeIndex ? { ...f, settings: initS } : f));
        }
        fitToScreen(img);
      };
      img.src = activeFile.previewUrl;
    }
  }, [activeIndex, activeFile?.id]);

  const fitToScreen = (img = imgElement) => {
    if (!img || !containerRef.current) return;
    const cw = containerRef.current.clientWidth - 40;
    const ph = containerRef.current.clientHeight - 40;
    const ratio = Math.min(cw / img.width, ph / img.height);
    setZoom(ratio * 0.7);
    setPan({ x: 0, y: 0 });
  };

  const handleAddFiles = (newFiles) => {
    const promises = Array.from(newFiles).map(file => {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ id: Math.random().toString(36).substr(2, 9), file, name: file.name, previewUrl: url, settings: null });
        img.src = url;
      });
    });
    Promise.all(promises).then(newObjs => setFiles(prev => [...prev, ...newObjs]));
  };

  const handleDeleteFile = (e, index) => {
    e.stopPropagation();
    const newFiles = files.filter((_, i) => i !== index);
    URL.revokeObjectURL(files[index].previewUrl);
    setFiles(newFiles);
    if (index <= activeIndex && activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { setWatermarkImg(img); setSettings(prev => ({ ...prev, type: 'image' })); };
      img.src = url;
    }
  };

  const handleHybridLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { setHybridLogoImg(img); setSettings(prev => ({ ...prev, showLogoWithText: true })); };
      img.src = url;
    }
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
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
    const dist = Math.sqrt(Math.pow(x - settings.x, 2) + Math.pow(y - settings.y, 2));
    if (dist < 100) {
      stateRef.current.isDragging = true;
      stateRef.current.startX = x;
      stateRef.current.startY = y;
      stateRef.current.initialRelX = settings.relX;
      stateRef.current.initialRelY = settings.relY;
      setSettings(prev => ({ ...prev, isDragging: true }));
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
      
      const newRelX = Math.max(0, Math.min(1, stateRef.current.initialRelX + dx / imgElement.width));
      const newRelY = Math.max(0, Math.min(1, stateRef.current.initialRelY + dy / imgElement.height));
      
      const ns = { ...settings, relX: newRelX, relY: newRelY, x: newRelX * imgElement.width, y: newRelY * imgElement.height, activeAnchor: 'custom', isDragging: true };
      setSettings(ns);
      setFiles(f => f.map((item, i) => i === activeIndex ? { ...item, settings: ns } : item));
    };
    const handleMouseUp = () => { 
      stateRef.current.isDragging = false; 
      stateRef.current.isPanning = false;
      setSettings(prev => ({ ...prev, isDragging: false }));
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [activeIndex, zoom, imgElement, settings]);

  const setAnchor = (anchor) => {
    let rx = 0.5, ry = 0.5;
    if (anchor.includes('top')) ry = 0.1;
    if (anchor.includes('bottom')) ry = 0.9;
    if (anchor.includes('right')) rx = 0.9;
    if (anchor.includes('left')) rx = 0.1;

    const ns = { ...settings, relX: rx, relY: ry, x: rx * imgElement.width, y: ry * imgElement.height, activeAnchor: anchor };
    setSettings(ns);
    setFiles(f => f.map((item, i) => i === activeIndex ? { ...item, settings: ns } : item));
  };

  const handleApplyToAll = () => {
    setFiles(prev => prev.map(f => ({ ...f, settings: { ...settings } })));
    alert('تم تطبيق الإعدادات على جميع الصور بنجاح!');
  };

  const processFile = async (f) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const s = f.settings || settings;
        ctx.save();
        ctx.globalAlpha = s.opacity / 100;
        
        const px = s.relX * img.width;
        const py = s.relY * img.height;

        const drawContent = (x, y) => {
          ctx.save(); ctx.translate(x, y); ctx.rotate((s.rotation * Math.PI) / 180);
          if (s.type === 'text') {
            ctx.font = `${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`;
            ctx.fillStyle = s.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (s.showLogoWithText && hybridLogoImg) {
              const lw = (hybridLogoImg.width * s.logoScale) / 100;
              const lh = (hybridLogoImg.height * s.logoScale) / 100;
              const margin = 15;
              if (s.logoPos === 'above') {
                ctx.drawImage(hybridLogoImg, -lw/2, -s.fontSize/2 - lh - margin, lw, lh);
                ctx.fillText(s.text, 0, 0);
              } else {
                ctx.fillText(s.text, 0, 0);
                ctx.drawImage(hybridLogoImg, -lw/2, s.fontSize/2 + margin, lw, lh);
              }
            } else {
              ctx.fillText(s.text, 0, 0);
            }
          } else if (s.type === 'image' && watermarkImg) {
            const w = (watermarkImg.width * s.imageScale) / 100;
            const h = (watermarkImg.height * s.imageScale) / 100;
            ctx.drawImage(watermarkImg, -w/2, -h/2, w, h);
          }
          ctx.restore();
        };

        if (s.isTiled) {
          const gapMult = Math.max(0.1, s.tileSpacing / 50);
          const stepX = (s.type === 'text' ? s.fontSize * 4 : (watermarkImg?.width || 100) * 2) * gapMult;
          const stepY = (s.type === 'text' ? s.fontSize * 3 : (watermarkImg?.height || 100) * 2) * gapMult;
          for (let ty = 0; ty < canvas.height + stepY; ty += stepY) {
            for (let tx = 0; tx < canvas.width + stepX; tx += stepX) {
              drawContent(tx, ty);
            }
          }
        } else {
          drawContent(px, py);
        }
        ctx.restore();
        canvas.toBlob((blob) => resolve({ name: f.name, blob }), f.file.type, 0.92);
      };
      img.src = f.previewUrl;
    });
  };

  const handleBatchExport = async () => {
    setIsProcessing(true); setProgress(0);
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      const result = await processFile(files[i]);
      zip.file(`watermarked_${result.name}`, result.blob);
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `AlManara_Watermarked_${Date.now()}.zip`;
    link.click();
    setIsProcessing(false); setProgress(0);
  };

  const anchors = [
    'top-right', 'top-center', 'top-left',
    'middle-right', 'center', 'middle-left',
    'bottom-right', 'bottom-center', 'bottom-left'
  ];

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sectionTitle}><Droplets size={20} /> خيارات العلامة</div>
          
          <div className={styles.tabGrid}>
            <button className={`${styles.tabBtn} ${settings.type === 'text' ? styles.tabActive : ''}`}
                    onClick={() => setSettings(s => ({ ...s, type: 'text' }))}>
              <Type size={18} /> نص
            </button>
            <button className={`${styles.tabBtn} ${settings.type === 'image' ? styles.tabActive : ''}`}
                    onClick={() => watermarkInputRef.current.click()}>
              <ImageIcon size={18} /> صورة
            </button>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelSmall}>الموضع الثابت (Anchors)</div>
            <div className={styles.anchorGrid}>
              {anchors.map(a => (
                <button key={a} className={`${styles.anchorBtn} ${settings.activeAnchor === a ? styles.anchorActive : ''}`}
                        onClick={() => setAnchor(a)}>
                  <div className={styles.anchorDot}></div>
                </button>
              ))}
            </div>
          </div>

          {settings.type === 'text' ? (
            <div className={styles.inputGroup}>
              <div className={styles.labelSmall}>النص المعروض</div>
              <input type="text" className={styles.textInput} value={settings.text}
                     onChange={e => setSettings(s => ({ ...s, text: e.target.value }))}
                     placeholder="اكتب العلامة المائية هنا..." />
              
              <div className={styles.controlRow}>
                <div style={{flex: 1}}>
                  <div className={styles.labelSmall}>حجم الخط</div>
                  <input type="range" min="10" max="500" value={settings.fontSize}
                         onChange={e => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))} />
                </div>
                <input type="color" className={styles.colorPicker} value={settings.color}
                       onChange={e => setSettings(s => ({ ...s, color: e.target.value }))} />
              </div>

              {/* Hybrid Mode Controls */}
              <div style={{borderTop: '1px solid var(--wat-border)', paddingTop: '15px', marginTop: '10px'}}>
                <div className={styles.labelSmall}>دمج شعار مع النص</div>
                {!hybridLogoImg ? (
                  <button className={styles.btnSecondary} onClick={() => hybridLogoInputRef.current.click()}>
                    <UploadCloud size={16} /> رفع شعار إضافي
                  </button>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button className={`${styles.btnSecondary} ${settings.logoPos === 'above' ? styles.tabActive : ''}`} 
                              onClick={() => setSettings(s => ({ ...s, logoPos: 'above' }))} style={{flex: 1, fontSize: '0.8rem'}}>فوق النص</button>
                      <button className={`${styles.btnSecondary} ${settings.logoPos === 'below' ? styles.tabActive : ''}`} 
                              onClick={() => setSettings(s => ({ ...s, logoPos: 'below' }))} style={{flex: 1, fontSize: '0.8rem'}}>تحت النص</button>
                    </div>
                    <div>
                      <div className={styles.labelSmall}>حجم الشعار ({settings.logoScale}%)</div>
                      <input type="range" min="5" max="200" value={settings.logoScale}
                             onChange={e => setSettings(s => ({ ...s, logoScale: parseInt(e.target.value) }))} />
                    </div>
                    <button className={styles.btnSecondary} onClick={() => setHybridLogoImg(null)} style={{color: '#ef4444'}}>حذف الشعار</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.inputGroup}>
               <div className={styles.labelSmall}>حجم اللوجو ({settings.imageScale}%)</div>
               <input type="range" min="5" max="300" value={settings.imageScale}
                      onChange={e => setSettings(s => ({ ...s, imageScale: parseInt(e.target.value) }))} />
            </div>
          )}

          <div className={styles.inputGroup}>
             <div className={styles.labelSmall}>الشفافية ({settings.opacity}%)</div>
             <input type="range" min="0" max="100" value={settings.opacity}
                    onChange={e => setSettings(s => ({ ...s, opacity: parseInt(e.target.value) }))} />
          </div>

          <div className={styles.inputGroup}>
             <div className={styles.labelSmall}>الدوران ({settings.rotation}°)</div>
             <input type="range" min="-180" max="180" value={settings.rotation}
                    onChange={e => setSettings(s => ({ ...s, rotation: parseInt(e.target.value) }))} />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button className={`${styles.tileBtn} ${settings.isTiled ? styles.tileActive : ''}`}
                    onClick={() => setSettings(s => ({ ...s, isTiled: !s.isTiled }))}>
              <Grid size={18} /> {settings.isTiled ? 'إيقاف التكرار' : 'تكرار (Tiling Mode)'}
            </button>
            {settings.isTiled && (
              <div className={styles.inputGroup} style={{background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div className={styles.labelSmall}>المسافة بين العلامات ({settings.tileSpacing}%)</div>
                <input type="range" min="10" max="200" value={settings.tileSpacing}
                       onChange={e => setSettings(s => ({ ...s, tileSpacing: parseInt(e.target.value) }))} />
              </div>
            )}
          </div>

          <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button className={styles.btnSecondary} onClick={handleApplyToAll} disabled={!activeFile || isProcessing}>
              <Layers size={18} /> تطبيق على الكل
            </button>
            <button className={styles.btnMain} onClick={handleBatchExport} disabled={files.length === 0 || isProcessing}>
               {isProcessing ? `جاري المعالجة ${progress}%` : <><Download size={20} /> تنزيل الكل ({files.length})</>}
            </button>
          </div>
        </aside>

        <div className={styles.workspace} ref={containerRef}>
          <div className={styles.canvasContainer} onMouseDown={handleMouseDown}
               style={{ cursor: (activeTool === 'pan' || spacePressed) ? (stateRef.current.isPanning ? 'grabbing' : 'grab') : (activeTool === 'select' ? 'default' : 'crosshair') }}
               onWheel={(e) => setZoom(z => Math.max(0.05, Math.min(15, z * (e.deltaY > 0 ? 0.9 : 1.1))))}>
            {!activeFile ? (
              <div className={styles.emptyState} onClick={() => fileInputRef.current.click()}>
                <Upload size={60} color="var(--wat-primary)" />
                <h3 style={{fontWeight: 900}}>ارفع صورك لحمايتها</h3>
                <p>أضف علامتك المائية بلمسات احترافية فائقة</p>
              </div>
            ) : (
              <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <canvas ref={canvasRef} />
              </div>
            )}
          </div>

          <FloatingToolbar activeTool={activeTool} setActiveTool={setActiveTool} fitToScreen={fitToScreen} setZoom={setZoom} hasCells={!!activeFile} simpleMode={true} />

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
                  <button className={styles.deleteThumbBtn} onClick={(e) => handleDeleteFile(e, i)}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} multiple hidden onChange={e => handleAddFiles(e.target.files)} />
      <input type="file" ref={watermarkInputRef} hidden onChange={handleWatermarkUpload} />
      <input type="file" ref={hybridLogoInputRef} hidden onChange={handleHybridLogoUpload} />
    </div>
  );
}
