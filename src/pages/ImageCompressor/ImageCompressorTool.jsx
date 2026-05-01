import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Minimize2, Image as ImageIcon, Trash2, FolderOpen, Zap, Plus, Search } from 'lucide-react';
import JSZip from 'jszip';
import { useImageBatch } from './hooks/useImageBatch';
import ImageCard from './components/ImageCard';
import ComparisonView from './components/ComparisonView';
import FloatingToolbar from '../GridSplitter/components/FloatingToolbar';
import { compressImage, formatBytes } from './utils/compressionUtils';
import styles from './ImageCompressor.module.css';

export default function ImageCompressorTool() {
  const { 
    images, 
    isProcessing: isProcessingGlobal, 
    globalProgress, 
    addImages, 
    clearImages, 
    removeImage, 
    processBatch: originalProcessBatch,
    setImages
  } = useImageBatch();

  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('original');
  const [maxWidth, setMaxWidth] = useState(0); 
  const [scale, setScale] = useState(1);
  const [activePreset, setActivePreset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isProcessingLocal, setIsProcessing] = useState(false);
  const [showDownloadAll, setShowDownloadAll] = useState(false);

  const resolutionPresets = [
    { label: '8K', width: 7680 },
    { label: '4K', width: 3840 },
    { label: '2K', width: 2560 },
    { label: '1K', width: 1920 },
    { label: 'HD', width: 1280 },
    { label: '720p', width: 720 },
  ];
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageId, setActiveImageId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleAddImages = (files) => {
    addImages(files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddImages(e.dataTransfer.files);
  };
  const handleFileChange = (e) => handleAddImages(e.target.files);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === images.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(images.map(img => img.id));
    }
  };

  const deleteSelected = () => {
    const remaining = images.filter(img => !selectedIds.includes(img.id));
    setImages(remaining);
    setSelectedIds([]);
    if (activeImageId && selectedIds.includes(activeImageId)) {
      setActiveImageId(remaining[0]?.id || null);
    }
  };

  const downloadSelected = async () => {
    const toDownload = images.filter(img => selectedIds.includes(img.id) && img.status === 'done');
    if (toDownload.length === 0) return;
    
    if (toDownload.length === 1) {
      const link = document.createElement('a');
      link.href = toDownload[0].compressedUrl;
      link.download = `compressed_${toDownload[0].name}`;
      link.click();
    } else {
      const zip = new JSZip();
      for (const img of toDownload) {
        const response = await fetch(img.compressedUrl);
        const blob = await response.blob();
        zip.file(`compressed_${img.name}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'almanara_compressed_images.zip';
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (const img of images.filter(i => i.status === 'done')) {
      const response = await fetch(img.compressedUrl);
      const blob = await response.blob();
      zip.file(`compressed_${img.name}`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'all_compressed.zip';
    link.click();
  };

  const downloadSingleImage = (img) => {
    const link = document.createElement('a');
    link.href = img.compressedUrl;
    link.download = `compressed_${img.name}`;
    link.click();
  };

  useEffect(() => {
    if (images.length > 0 && !activeImageId) {
      setActiveImageId(images[0].id);
    }
  }, [images, activeImageId]);


  const activeImage = images.find(img => img.id === activeImageId);

  // 🤖 Auto-detect preset when scale or active image changes
  useEffect(() => {
    if (!activeImage || !activeImage.width) {
      setActivePreset(null);
      return;
    }
    const currentWidth = Math.round(activeImage.width * scale);
    const found = resolutionPresets.find(p => Math.abs(p.width - currentWidth) < 10);
    setActivePreset(found ? found.label : null);
  }, [scale, activeImage]);

  useEffect(() => {
    if (!activeImage || activeImage.status === 'processing') return;
    const timer = setTimeout(async () => {
      try {
        const targetFormat = format === 'original' ? activeImage.file.type : format;
        const result = await compressImage(activeImage.file, quality / 100, targetFormat, maxWidth, scale);
        setImages(prev => prev.map(i => {
          if (i.id === activeImage.id) {
            const savings = ((i.originalSize - result.size) / i.originalSize) * 100;
            return {
              ...i,
              compressedUrl: result.url,
              compressedSize: result.size,
              savings: savings > 0 ? savings.toFixed(1) : 0
            };
          }
          return i;
        }));
      } catch (err) { console.error("Preview failed", err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeImageId, quality, format, maxWidth, scale, images.length]);

  const processBatch = async () => {
    setIsProcessing(true);
    setShowDownloadAll(false);
    await originalProcessBatch(quality, format, maxWidth, scale);
    setIsProcessing(false);
    setShowDownloadAll(true);
  };

  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressedSize = images.reduce((acc, img) => acc + (img.compressedSize || img.originalSize), 0);
  const totalSavings = totalOriginalSize > 0 
    ? (((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0;

  return (
    <div className={styles.container} style={{height: 'calc(100vh - 64px)'}} onDragOver={handleDragOver} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
      {isDragging && (
        <div className={styles.dragOverlay}>
          <Upload size={80} color="var(--c2)" />
          <h2>ألقِ الصور هنا للإضافة</h2>
        </div>
      )}
      
      {/* Hidden File Inputs */}
      <input type="file" id="fileInput" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      <input type="file" id="folderInput" webkitdirectory="true" directory="true" onChange={handleFileChange} style={{ display: 'none' }} />
      
      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {images.length === 0 && (
            <div className={styles.dropzone} onClick={() => document.getElementById('fileInput').click()}>
              <Upload size={32} color="var(--c2)" />
              <div className={styles.dropzoneText}>
                <h3>اسحب الصور هنا أو انقر للرفع</h3>
                <p>بدء ضغط الصور بلمسة واحدة احترافية</p>
              </div>
            </div>
          )}
          <div className={styles.sectionTitle} style={{ marginTop: images.length === 0 ? 0 : 10 }}>الإعدادات</div>
          
          <div className={styles.inputGroup}>
            <label>الجودة: {quality}%</label>
            <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className={styles.rangeInput} />
          </div>

          <div className={styles.inputGroup}>
            <label>المقاس: {Math.round(scale * 100)}%</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value={scale} 
              onChange={(e) => {
                setScale(parseFloat(e.target.value));
                setActivePreset(null); // مسح الاختيار عند التعديل اليدوي
              }} 
              className={styles.rangeInput} 
            />
            
            <div className={styles.presetGrid}>
              {resolutionPresets.map(preset => (
                <button 
                  key={preset.label}
                  className={`${styles.presetBtn} ${activePreset === preset.label ? styles.activePreset : ''}`}
                  onClick={() => {
                    setActivePreset(preset.label);
                    if (activeImage) {
                      const img = new Image();
                      img.src = activeImage.originalUrl;
                      img.onload = () => {
                        const newScale = preset.width / img.width;
                        setScale(Math.min(Math.max(newScale, 0.1), 1));
                      };
                    } else {
                      // لو مفيش صورة، ممكن نثبت قيمة تقريبية أو نكتفي بتحديد الزرار
                      setScale(preset.width / 1920); // افتراض Full HD كمرجع
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>الصيغة</label>
            <select value={format} onChange={e=>setFormat(e.target.value)} className={styles.selectInput}>
              <option value="original">نفس النوع</option>
              <option value="image/webp">WebP (أفضل ضغط)</option>
              <option value="image/jpeg">JPEG</option>
            </select>
          </div>

          {/* 📊 Active Image Stats Card */}
          {activeImage && (
            <div className={styles.statsCard}>
              <div className={styles.statsTitle}>إحصائيات الصورة المختارة</div>
              <div className={styles.statsRow}>
                <span>الحجم الأصلي:</span>
                <span>{formatBytes(activeImage.originalSize || activeImage.size || 0)}</span>
              </div>
              {activeImage.compressedSize && activeImage.compressedSize > 0 && (
                <>
                  <div className={styles.statsRow}>
                    <span>الحجم الجديد:</span>
                    <span className={styles.greenText}>{formatBytes(activeImage.compressedSize)}</span>
                  </div>
                  <div className={styles.savingsTag}>
                    توفير {Math.round((1 - activeImage.compressedSize / (activeImage.originalSize || activeImage.size || 1)) * 100)}%
                  </div>
                </>
              )}
              <button 
                className={styles.downloadPreviewBtn}
                onClick={() => activeImage.compressedUrl && downloadSingleImage(activeImage)}
                disabled={!activeImage.compressedUrl}
              >
                <Download size={14} /> تنزيل هذه الصورة
              </button>
            </div>
          )}

          <div className={styles.sidebarActions}>
            <button 
              className={styles.btnMain} 
              onClick={processBatch} 
              disabled={isProcessingLocal || images.length === 0}
            >
              <Zap size={18} /> {isProcessingLocal ? 'جاري الضغط...' : 'بدء ضغط الكل'}
            </button>

            {showDownloadAll && (
              <button className={styles.btnDownloadAll} onClick={downloadAll}>
                <Download size={18} /> تنزيل الكل (ZIP)
              </button>
            )}
          </div>
        </div>

        <FloatingToolbar 
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          fitToScreen={() => {}}
          color="var(--c2)"
          isSpacePressed={spacePressed}
        />

        <div className={styles.previewArea}>
          {images.length === 0 ? (
            <div className={styles.emptyState}>
               <ImageIcon size={64} color="var(--c2)" opacity={0.2} />
               <p>اختر صوراً للبدء في ضغطها ومعاينتها هنا</p>
            </div>
          ) : (
            <>
              {/* 1. Preview Section (Top) */}
              <div className={styles.previewTopSection}>
                 {activeImage ? (
                   <ComparisonView activeImage={activeImage} />
                 ) : (
                   <div className={styles.emptyCompBox}>اختر صورة من القائمة للمعاينة</div>
                 )}
              </div>

              {/* 2. Gallery Section (Bottom) */}
              <div className={styles.galleryBottomSection}>
                <div className={styles.listHeader}>
                  <div className={styles.headerLeft}>
                    <h3>قائمة الصور ({images.length})</h3>
                    {totalSavings > 0 && (
                      <span className={styles.savingBadge}>توفير: {totalSavings.toFixed(1)}%</span>
                    )}
                  </div>

                  <div className={styles.bulkBar}>
                    {selectedIds.length > 0 && (
                      <>
                        <button className={styles.actionBtnMini} onClick={downloadSelected} title="تحميل المختار">
                          <Download size={16} />
                        </button>
                        <button className={`${styles.actionBtnMini} ${styles.delete}`} onClick={deleteSelected} title="حذف المختار">
                          <Trash2 size={16} />
                        </button>
                        <span className={styles.selectionCount}>{selectedIds.length} مختارة</span>
                      </>
                    )}
                    <div 
                      className={`${styles.checkbox} ${selectedIds.length === images.length && images.length > 0 ? styles.checked : ''}`}
                      onClick={selectAll}
                      title="اختيار الكل"
                    />
                  </div>

                  <div className={styles.headerRight}>
                    <div className={styles.searchBoxSmall}>
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="بحث..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                      />
                    </div>
                    <button className={styles.addMoreBtn} onClick={() => document.getElementById('fileInput').click()}>
                      <Plus size={16} />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>

                <div className={styles.imageList}>
                  {images
                    .filter(img => img.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(img => (
                    <div 
                      key={img.id} 
                      className={`${styles.imageItem} ${activeImageId === img.id ? styles.active : ''} ${selectedIds.includes(img.id) ? styles.selected : ''}`}
                      onClick={() => setActiveImageId(img.id)}
                    >
                      {/* Checkbox Overlay */}
                      <div 
                        className={`${styles.checkbox} ${selectedIds.includes(img.id) ? styles.checked : ''}`}
                        style={{position: 'absolute', top: '8px', right: '8px', zIndex: 10}}
                        onClick={(e) => toggleSelect(img.id, e)}
                      />

                      <div className={styles.cardThumb}>
                        <img src={img.originalUrl} alt={img.name} />
                        {img.status === 'processing' && <div className={styles.cardBadge} style={{background: '#ffa500'}}>...</div>}
                        {img.status === 'done' && <div className={styles.cardBadge}>-{img.savings}%</div>}
                      </div>

                      <div className={styles.cardInfo}>
                        <div className={styles.cardName}>{img.name}</div>
                        <div className={styles.cardSizes}>
                          <span>{formatBytes(img.originalSize)}</span>
                          {img.status === 'done' && <span style={{color: 'var(--c1)'}}>{formatBytes(img.compressedSize)}</span>}
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className={styles.cardActions}>
                        {img.status === 'done' && (
                          <button className={styles.actionBtnMini} onClick={(e) => { e.stopPropagation(); downloadSelected(); }}>
                            <Download size={14} />
                          </button>
                        )}
                        <button className={`${styles.actionBtnMini} ${styles.delete}`} onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(i => i.id !== img.id)); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragContent}>
            <div className={styles.dragIcon}>✨</div>
            <h2>أفلت الصور هنا</h2>
          </div>
        </div>
      )}
    </div>
  );
}
