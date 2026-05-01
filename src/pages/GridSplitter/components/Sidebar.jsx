import { Upload, Archive, Download, Info, RotateCcw, Sun, Moon, Play } from 'lucide-react';
import styles from './Sidebar.module.css';

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
  setShowHelpModal,
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
      <label 
        className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleFile(e.target.files[0])} />
        <Upload size={32} color="var(--text-dim)" style={{marginBottom: '10px'}} />
        <div>اسحب الصورة هنا أو انقر للرفع</div>
      </label>

      <div className={styles.sectionTitle}>إنشاء الشبكة الأساسية</div>
      <div className={styles.presets}>
        <button className={styles.presetBtn} onClick={() => {setCols(2); setRows(2);}}>2x2</button>
        <button className={styles.presetBtn} onClick={() => {setCols(3); setRows(3);}}>3x3</button>
        <button className={styles.presetBtn} onClick={() => {setCols(4); setRows(4);}}>4x4</button>
      </div>
      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <label>أعمدة</label>
          <input 
            type="number" value={cols} 
            onChange={e => setCols(parseInt(e.target.value)||1)} 
            onWheel={e => handleWheelInput(e, setCols)}
            min="1" className={styles.input} 
          />
        </div>
        <div className={styles.inputGroup}>
          <label>صفوف</label>
          <input 
            type="number" value={rows} 
            onChange={e => setRows(parseInt(e.target.value)||1)} 
            onWheel={e => handleWheelInput(e, setRows)}
            min="1" className={styles.input} 
          />
        </div>
      </div>

      <div className={styles.sectionTitle}>ضبط احترافي شامل</div>
      <div className={styles.inputGroup}>
        <label>تقليص أفقي (X): {globalPadding.x}px</label>
        <input 
          type="range" min="0" max="200" value={globalPadding.x} 
          onChange={e => setGlobalPadding(p => ({ ...p, x: parseInt(e.target.value) }))}
          onWheel={e => {
            e.preventDefault();
            const d = e.deltaY > 0 ? -1 : 1;
            setGlobalPadding(p => ({ ...p, x: Math.max(0, p.x + d) }));
          }}
          className={styles.rangeInput} 
        />
      </div>
      <div className={styles.inputGroup}>
        <label>تقليص رأسي (Y): {globalPadding.y}px</label>
        <input 
          type="range" min="0" max="200" value={globalPadding.y} 
          onChange={e => setGlobalPadding(p => ({ ...p, y: parseInt(e.target.value) }))}
          onWheel={e => {
            e.preventDefault();
            const d = e.deltaY > 0 ? -1 : 1;
            setGlobalPadding(p => ({ ...p, y: Math.max(0, p.y + d) }));
          }}
          className={styles.rangeInput} 
        />
      </div>
      <label className={styles.checkboxGroup}>
        <input type="checkbox" checked={skipManual} onChange={e => setSkipManual(e.target.checked)} />
        تخطي الخلايا المعدلة يدوياً
      </label>

      <button className={styles.btnSecondary} onClick={handleResetAll} style={{ marginTop: '5px' }}>
        <RotateCcw size={16} /> إعادة تعيين جميع الحدود
      </button>

      <div className={styles.sectionTitle}>إعدادات التصدير</div>
      <div className={styles.inputGroup}>
        <label>اسم الملف (Prefix)</label>
        <input type="text" value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="my_project" className={styles.input} />
      </div>
      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <label>نوع الترقيم</label>
          <select value={namingType} onChange={e=>setNamingType(e.target.value)} className={styles.input}>
            <option value="numbers">أرقام (01, 02)</option>
            <option value="letters">حروف (A, B, C)</option>
            <option value="arabic">حروف عربي (أ, ب, ج)</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label>صيغة التصدير</label>
          <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} className={styles.input}>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>
      </div>

      <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <button 
          className={styles.btnMain}
          style={{opacity: (!img || isDownloading) ? 0.5 : 1}} 
          disabled={!img || isDownloading} 
          onClick={() => handleDownloadAll(true)}
        >
          <Archive size={18} /> تصدير كملف مضغوط (ZIP)
        </button>

        <button 
          className={styles.btnSecondary}
          style={{opacity: (!img || isDownloading) ? 0.5 : 1}} 
          disabled={!img || isDownloading} 
          onClick={() => handleDownloadAll(false)}
        >
          <Download size={18} /> تنزيل كصور منفصلة
        </button>

        <button 
          className={styles.helpBtn}
          onClick={() => setShowHelpModal(true)}
        >
          <Info size={18} />
          دليل الاستخدام المكتوب
        </button>

        <button 
          className={styles.btnSecondary}
          onClick={() => {
            setShowHelpModal(false); 
            setShowTutorial(true);
          }}
        >
          <Play size={16} /> الدليل التفاعلي
        </button>
      </div>
    </div>
  );
}
