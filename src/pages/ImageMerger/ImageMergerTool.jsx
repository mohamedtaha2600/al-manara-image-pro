import { useState, useRef, useEffect } from 'react';
import styles from './ImageMerger.module.css';
import { Layers, UploadCloud, X, Download, Maximize, ZoomIn, ZoomOut, Move } from 'lucide-react';

export default function ImageMergerTool() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewAreaRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState('horizontal'); // horizontal, vertical, grid
  const [gridCols, setGridCols] = useState(2);
  const [padding, setPadding] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [exportFormat, setExportFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.9);
  
  // Preview Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Drag and Drop for reordering
  const [draggedIdx, setDraggedIdx] = useState(null);

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
          w: img.width,
          h: img.height
        });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImages(prev => [...prev, ...newImages]);
          if (images.length === 0) {
            fitToScreen();
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
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Reordering logic
  const handleDragStartItem = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newImages = [...images];
    const draggedItem = newImages[draggedIdx];
    newImages.splice(draggedIdx, 1);
    newImages.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setImages(newImages);
  };
  const handleDragEndItem = () => {
    setDraggedIdx(null);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      if (newImages.length === 0) {
        setZoom(1);
        setPan({x:0, y:0});
      }
      return newImages;
    });
  };

  const clearAll = () => {
    setImages([]);
    setZoom(1);
    setPan({x:0, y:0});
  };

  const renderMergedImage = () => {
    if (images.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let totalW = 0, totalH = 0;
    
    // Calculate dimensions
    if (layout === 'horizontal') {
      const maxH = Math.max(...images.map(img => img.h));
      totalW = images.reduce((acc, img) => acc + img.w, 0) + (images.length - 1) * padding + padding * 2;
      totalH = maxH + padding * 2;
    } else if (layout === 'vertical') {
      const maxW = Math.max(...images.map(img => img.w));
      totalW = maxW + padding * 2;
      totalH = images.reduce((acc, img) => acc + img.h, 0) + (images.length - 1) * padding + padding * 2;
    } else if (layout === 'grid') {
      const cols = parseInt(gridCols) || 1;
      const rows = Math.ceil(images.length / cols);
      
      // Find max width and height for grid cells
      const cellW = Math.max(...images.map(img => img.w));
      const cellH = Math.max(...images.map(img => img.h));
      
      totalW = cols * cellW + (cols - 1) * padding + padding * 2;
      totalH = rows * cellH + (rows - 1) * padding + padding * 2;
    }

    // Set canvas size
    canvas.width = totalW;
    canvas.height = totalH;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw images
    let currX = padding;
    let currY = padding;

    if (layout === 'horizontal') {
      images.forEach(img => {
        const yPos = padding + (canvas.height - padding * 2 - img.h) / 2; // Center vertically
        ctx.drawImage(img.img, currX, yPos, img.w, img.h);
        currX += img.w + padding;
      });
    } else if (layout === 'vertical') {
      images.forEach(img => {
        const xPos = padding + (canvas.width - padding * 2 - img.w) / 2; // Center horizontally
        ctx.drawImage(img.img, xPos, currY, img.w, img.h);
        currY += img.h + padding;
      });
    } else if (layout === 'grid') {
      const cols = parseInt(gridCols) || 1;
      const cellW = Math.max(...images.map(img => img.w));
      const cellH = Math.max(...images.map(img => img.h));
      
      images.forEach((img, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padding + col * (cellW + padding);
        const y = padding + row * (cellH + padding);
        
        // Center within cell
        const drawX = x + (cellW - img.w) / 2;
        const drawY = y + (cellH - img.h) / 2;
        
        ctx.drawImage(img.img, drawX, drawY, img.w, img.h);
      });
    }
  };

  useEffect(() => {
    renderMergedImage();
  }, [images, layout, gridCols, padding, bgColor]);

  const fitToScreen = () => {
    if (!previewAreaRef.current || !canvasRef.current || images.length === 0) return;
    // Wait a tick for canvas to update dimensions
    setTimeout(() => {
      if(!canvasRef.current) return;
      const pw = previewAreaRef.current.clientWidth - 40;
      const ph = previewAreaRef.current.clientHeight - 40;
      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      if (cw === 0 || ch === 0) return;
      
      const ratio = Math.min(pw / cw, ph / ch);
      setZoom(ratio > 0 && ratio < 1 ? ratio : 1);
      setPan({ x: 0, y: 0 });
    }, 50);
  };

  const handleDownload = () => {
    if (images.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    showStatus('جاري معالجة الصورة...');
    
    const ext = exportFormat === 'image/jpeg' ? 'jpg' : exportFormat === 'image/webp' ? 'webp' : 'png';
    const filename = `merged_image_${Date.now()}.${ext}`;
    
    const dataUrl = canvas.toDataURL(exportFormat, quality);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('تم التحميل بنجاح!');
  };

  // Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return; // only left/middle click
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);
  const handleWheel = (e) => {
    if (images.length === 0) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.05, Math.min(10, z * delta)));
  };

  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}
      
      <div className={styles.mainLayout}>
        {/* Sidebar (Renders on Right in RTL) */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>
              <Layers size={24} /> دامج الصور
            </div>
          </div>
          
          <div className={styles.sidebarContent}>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => handleFiles(e.target.files)} 
            />
            
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => fileInputRef.current.click()}>
              <UploadCloud size={20} /> رفع الصور
            </button>
            
            {images.length > 0 && (
              <>
                <div className={styles.sidebarSection}>
                  <div className={styles.sectionTitle}>تخطيط الدمج (Layout)</div>
                  <div className={styles.inputGroup}>
                    <select className={styles.select} value={layout} onChange={(e) => setLayout(e.target.value)}>
                      <option value="horizontal">أفقي (جنباً لجنب)</option>
                      <option value="vertical">عمودي (فوق بعض)</option>
                      <option value="grid">تخطيط شبكي</option>
                    </select>
                  </div>
                  
                  {layout === 'grid' && (
                    <div className={styles.inputGroup}>
                      <label>عدد الأعمدة</label>
                      <input 
                        type="number" 
                        className={styles.input} 
                        value={gridCols} 
                        onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))} 
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <div className={styles.sidebarSection}>
                  <div className={styles.sectionTitle}>المسافات والخلفية</div>
                  <div className={styles.inputGroup}>
                    <label>المسافة بين الصور (Padding): {padding}px</label>
                    <input 
                      type="range" 
                      className={styles.rangeInput} 
                      min="0" max="200" 
                      value={padding} 
                      onChange={(e) => setPadding(parseInt(e.target.value))} 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>لون الخلفية</label>
                    <div className={styles.colorPickerWrap}>
                      <input 
                        type="color" 
                        className={styles.colorPicker} 
                        value={bgColor} 
                        onChange={(e) => setBgColor(e.target.value)} 
                      />
                      <span style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>{bgColor}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.sidebarSection}>
                  <div className={styles.sectionTitle}>إعدادات التصدير</div>
                  <div className={styles.inputGroup}>
                    <label>صيغة الملف</label>
                    <select className={styles.select} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                      <option value="image/png">PNG (جودة عالية)</option>
                      <option value="image/jpeg">JPG (حجم أصغر)</option>
                      <option value="image/webp">WebP (متوازن)</option>
                    </select>
                  </div>
                  {exportFormat !== 'image/png' && (
                    <div className={styles.inputGroup}>
                      <label>الجودة: {Math.round(quality * 100)}%</label>
                      <input 
                        type="range" 
                        className={styles.rangeInput} 
                        min="0.1" max="1" step="0.05"
                        value={quality} 
                        onChange={(e) => setQuality(parseFloat(e.target.value))} 
                      />
                    </div>
                  )}
                </div>

                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload} style={{background: 'var(--c6)', color: '#000'}}>
                  <Download size={20} /> تحميل الصورة المدمجة
                </button>
                <button className={styles.btn} onClick={clearAll} style={{background: 'rgba(255,0,0,0.1)', color: '#ff4444'}}>
                  مسح الكل
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Preview Area (Renders in Middle in RTL) */}
        <div 
          className={styles.previewArea} 
          ref={previewAreaRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          {images.length > 0 ? (
            <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
              <canvas ref={canvasRef} className={styles.canvas} />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Layers size={64} className={styles.emptyStateIcon} />
              <h2>اسحب وأفلت الصور هنا</h2>
              <p>أو استخدم زر الرفع من القائمة الجانبية</p>
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

        {/* Image List Area (Vertical Strip, Renders on Left in RTL) */}
        {images.length > 0 && (
          <div className={styles.imageListArea}>
            {images.map((img, idx) => (
              <div 
                key={img.id} 
                className={`${styles.imageItem} ${draggedIdx === idx ? styles.active : ''}`}
                draggable
                onDragStart={(e) => handleDragStartItem(e, idx)}
                onDragOver={(e) => handleDragOverItem(e, idx)}
                onDragEnd={handleDragEndItem}
                title="اسحب لإعادة الترتيب"
              >
                <img src={img.url} alt={`Image ${idx}`} />
                <button className={styles.deleteBtn} onClick={() => removeImage(img.id)} title="حذف">
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
