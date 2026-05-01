import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Download, RefreshCw, FileImage, 
  Trash2, FileVideo, CheckCircle2, AlertCircle,
  Settings, Layers, Zap, Info, X
} from 'lucide-react';
import styles from './ImageConverter.module.css';

import JSZip from 'jszip';
import { useConverter } from './hooks/useConverter';

export default function ImageConverterTool() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('webp');
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { load, isLoaded: isEngineReady, convertFile } = useConverter();

  const handleAddFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', 
      progress: 0,
      previewUrl: URL.createObjectURL(file),
      resultUrl: null,
      resultSize: 0,
      overrideFormat: null // Individual format override
    }));
    setFiles(prev => [...prev, ...validFiles]);
  };

  const updateFileFormat = (id, format) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, overrideFormat: format } : f));
  };

  const startConversion = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status !== 'done');

    for (const fileObj of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'processing' } : f
      ));

      try {
        const format = fileObj.overrideFormat || targetFormat;
        const result = await convertFile(fileObj.file, format);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { 
            ...f, 
            status: 'done', 
            resultUrl: result.url,
            resultSize: result.size,
            finalFormat: format
          } : f
        ));
      } catch (err) {
        console.error("Conversion failed", err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
      }
    }
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const doneFiles = files.filter(f => f.status === 'done');
    
    for (const file of doneFiles) {
      const response = await fetch(file.resultUrl);
      const blob = await response.blob();
      zip.file(`converted_${file.name.split('.')[0]}.${file.finalFormat}`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'almanara_converted_files.zip';
    link.click();
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.resultUrl) URL.revokeObjectURL(file.resultUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
    });
    setFiles([]);
  };

  const [selectedPreview, setSelectedPreview] = useState(null);

  return (
    <div className={styles.container} 
         onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
         onDragLeave={() => setIsDragging(false)}
         onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleAddFiles(e.dataTransfer.files); }}>
      
      <div className={styles.mainLayout}>
        {/* 🛠️ Sidebar Settings */}
        <div className={styles.sidebar}>
          <div className={styles.sectionTitle}>
            <Settings size={20} /> الإعدادات العامة
          </div>

          <div className={styles.inputGroup}>
            <label>تحويل الكل إلى صيغة:</label>
            <select 
              value={targetFormat} 
              onChange={e => setTargetFormat(e.target.value)}
              className={styles.selectInput}
            >
              <optgroup label="صور احترافية">
                <option value="webp">WebP (أفضل ضغط)</option>
                <option value="png">PNG (جودة أصلية)</option>
                <option value="jpg">JPG (متوافق جداً)</option>
                <option value="avif">AVIF (جيل جديد)</option>
              </optgroup>
              <optgroup label="صيغ أخرى">
                <option value="tiff">TIFF (للطباعة)</option>
                <option value="bmp">BMP (خام)</option>
                <option value="gif">GIF (متحرك)</option>
              </optgroup>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>جودة التحويل ({quality}%):</label>
            <input 
              type="range" 
              min="10" max="100" 
              value={quality} 
              onChange={e => setQuality(parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>ذكاء التحويل:</label>
            <div className={styles.infoBox}>
              <Info size={14} /> سيتم استخدام محرك FFmpeg للتحويلات المعقدة لضمان أعلى دقة بصرية.
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.btnMain}
              onClick={startConversion}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? <RefreshCw className="spin" /> : <Zap size={18} />}
              {isProcessing ? 'جاري التحويل...' : 'بدء التحويل الجماعي'}
            </button>
            
            {isProcessing && !isEngineReady && (
              <div style={{ fontSize: '0.7rem', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                جاري تحضير المحرك المتقدم (لأول مرة فقط)...
              </div>
            )}
          </div>
        </div>

        {/* 🖼️ Content Area */}
        <div className={styles.contentArea}>
          {files.length > 0 && (
            <div className={styles.topActions}>
              <div className={styles.statsSummary}>
                تم اختيار <span>{files.length}</span> ملفات 
                {files.filter(f => f.status === 'done').length > 0 && (
                  <> — تم تحويل <span>{files.filter(f => f.status === 'done').length}</span> بنجاح</>
                )}
              </div>
              <div className={styles.actionButtons}>
                {files.filter(f => f.status === 'done').length > 0 && (
                  <button className={styles.btnZip} onClick={downloadAll}>
                    <Layers size={16} /> تحميل الكل (ZIP)
                  </button>
                )}
                <button className={styles.btnClear} onClick={clearAll}>
                  مسح الكل
                </button>
              </div>
            </div>
          )}

          {files.length === 0 ? (
            <div className={styles.dropzone} onClick={() => fileInputRef.current.click()}>
              <div className={styles.uploadIcon}>
                <Upload size={60} color="var(--conv-primary)" />
              </div>
              <h2 style={{ fontWeight: 900 }}>اسحب الملفات هنا</h2>
              <p style={{ color: '#666' }}>صور، فيديوهات (لتحويلها لـ GIF)، أو مجلدات كاملة</p>
              <button className={styles.uploadBtnMini}>اختيار ملفات</button>
            </div>
          ) : (
            <div className={styles.tableContainer + " " + styles.scrollBar}>
              <table className={styles.filesTable}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>المعاينة</th>
                    <th>اسم الملف</th>
                    <th>الحجم الأصلي</th>
                    <th>الصيغة</th>
                    <th>الحالة</th>
                    <th style={{ width: '100px' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr key={file.id} className={styles.fileRow}>
                      <td>
                        <div className={styles.thumbWrapper} onClick={() => setSelectedPreview(file)}>
                          <img src={file.previewUrl} className={styles.tableThumb} alt="" />
                          <div className={styles.hoverPreview}>
                            <img src={file.previewUrl} alt="" />
                          </div>
                        </div>
                      </td>
                      <td className={styles.fileNameCell}>{file.name}</td>
                      <td>{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                      <td>
                        <select 
                          value={file.overrideFormat || targetFormat}
                          onChange={(e) => updateFileFormat(file.id, e.target.value)}
                          className={styles.miniSelect}
                          disabled={file.status !== 'pending'}
                        >
                          <option value="webp">WebP</option>
                          <option value="png">PNG</option>
                          <option value="jpg">JPG</option>
                          <option value="avif">AVIF</option>
                          <option value="tiff">TIFF</option>
                          <option value="gif">GIF</option>
                        </select>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles['status' + file.status.charAt(0).toUpperCase() + file.status.slice(1)]}`}>
                          {file.status === 'pending' ? 'انتظار' : file.status === 'processing' ? 'جاري...' : file.status === 'done' ? 'تم' : 'خطأ'}
                        </span>
                        {file.resultSize > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--conv-primary)', marginTop: '4px' }}>
                            {(file.resultSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {file.status === 'done' && (
                            <button className={styles.downloadBtnMini} onClick={() => downloadFile(file)}>
                              <Download size={16} />
                            </button>
                          )}
                          <button className={styles.deleteBtn} onClick={() => removeFile(file.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            style={{ display: 'none' }} 
            onChange={e => handleAddFiles(e.target.files)} 
          />
        </div>
      </div>

      {/* 🌌 Fullscreen Lightbox */}
      {selectedPreview && (
        <div className={styles.lightboxOverlay} onClick={() => setSelectedPreview(null)}>
          <div className={styles.lightboxContent}>
            <div className={styles.lightboxClose}>
              <X size={32} />
            </div>
            <img src={selectedPreview.previewUrl} className={styles.lightboxImg} alt="Preview" />
            <div style={{ textAlign: 'center', marginTop: '15px', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
              {selectedPreview.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
