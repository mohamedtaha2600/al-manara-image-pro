import { Upload, Archive, Download, Info, RotateCcw, Play } from 'lucide-react';
import styles from './Sidebar.module.css';

const GRID_PRESETS = [
  { label: '2x2', cols: 2, rows: 2 },
  { label: '3x3', cols: 3, rows: 3 },
  { label: '4x4', cols: 4, rows: 4 },
  { label: '1x3', cols: 1, rows: 3 },
  { label: '3x1', cols: 3, rows: 1 },
  { label: '2x3', cols: 2, rows: 3 },
  { label: '3x2', cols: 3, rows: 2 },
];

export default function Sidebar({
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFile,
  cols, setCols,
  rows, setRows,
  prefix, setPrefix,
  namingType, setNamingType,
  exportFormat, setExportFormat,
  isZip, setIsZip,
  img, isDownloading,
  handleDownloadAll,
  setShowHelp,
  globalPadding, setGlobalPadding,
  skipManual, setSkipManual,
  handleResetAll,
  setShowTutorial
}) {
  const handleWheelInput = (e, setter) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -1 : 1;
    setter(prev => Math.max(1, prev + d));
  };

  return (
    <div className={styles.sidebar}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => setShowTutorial(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Play size={14} color="var(--c1)" /> الشرح التفاعلي
        </button>
        <button onClick={() => setShowHelp(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Info size={14} color="var(--c1)" /> التعليمات
        </button>
      </div>

      <label 
        className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleFile(e.target.files[0])} />
        <Upload size={32} color="var(--c1)" style={{marginBottom: '10px'}} />
        <div>اسحب الصورة هنا أو انقر للرفع</div>
      </label>

      <div className={styles.sidebarSection}>
        <div className={styles.sectionTitle}>تخطيط الشبكة (Grid)</div>
        <div className={styles.presetsGrid}>
          {GRID_PRESETS.map(p => (
            <button 
              key={p.label} 
              className={`${styles.presetBtn} ${(cols === p.cols && rows === p.rows) ? styles.active : ''}`} 
              onClick={() => {setCols(p.cols); setRows(p.rows);}}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>أعمدة</label>
            <input 
              type="number" value={cols} 
              onChange={e => setCols(parseInt(e.target.value)||1)} 
              onWheel={e => handleWheelInput(e, setCols)}
              min="1" className={styles.input} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>صفوف</label>
            <input 
              type="number" value={rows} 
              onChange={e => setRows(parseInt(e.target.value)||1)} 
              onWheel={e => handleWheelInput(e, setRows)}
              min="1" className={styles.input} 
            />
          </div>
        </div>
      </div>

      <div className={styles.sidebarSection}>
        <div className={styles.sectionTitle}>ضبط الحدود والمسافات</div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>تقليص أفقي (X): {globalPadding.x}px</label>
          <input 
            type="range" min="0" max="200" value={globalPadding.x} 
            onChange={e => setGlobalPadding(p => ({ ...p, x: parseInt(e.target.value) }))}
            className={styles.rangeInput} 
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>تقليص رأسي (Y): {globalPadding.y}px</label>
          <input 
            type="range" min="0" max="200" value={globalPadding.y} 
            onChange={e => setGlobalPadding(p => ({ ...p, y: parseInt(e.target.value) }))}
            className={styles.rangeInput} 
          />
        </div>
        <label className={styles.checkboxGroup}>
          <input type="checkbox" checked={skipManual} onChange={e => setSkipManual(e.target.checked)} />
          تخطي الخلايا المعدلة يدوياً
        </label>
        <button className={styles.btnSecondary} onClick={handleResetAll} style={{ width: '100%', marginTop: '5px' }}>
          <RotateCcw size={14} /> إعادة تعيين الحدود
        </button>
      </div>

      <div className={styles.sidebarSection}>
        <div className={styles.sectionTitle}>تسمية وتصدير</div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>اسم الملف الأساسي</label>
          <input type="text" value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="prefix..." className={styles.input} />
        </div>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>الترقيم</label>
            <select value={namingType} onChange={e=>setNamingType(e.target.value)} className={styles.select}>
              <option value="numbers">1, 2, 3</option>
              <option value="letters">A, B, C</option>
              <option value="arabic">أ, ب, ج</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>الصيغة</label>
            <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} className={styles.select}>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WEBP</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px'}}>
        <button 
          className={styles.btnMain}
          disabled={!img || isDownloading} 
          onClick={() => handleDownloadAll(true)}
        >
          <Archive size={18} /> تصدير ZIP
        </button>
        <button 
          className={styles.btnSecondary}
          disabled={!img || isDownloading} 
          onClick={() => handleDownloadAll(false)}
        >
          <Download size={18} /> تنزيل صور منفصلة
        </button>
      </div>
    </div>
  );
}
