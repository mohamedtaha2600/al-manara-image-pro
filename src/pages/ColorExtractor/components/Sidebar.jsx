import { Settings, Upload, RefreshCw, Download, Share2, Play, Info } from 'lucide-react';
import styles from '../ColorExtractor.module.css';

export default function Sidebar({ 
  fileInputRef, handleAddFiles, 
  colorCount, setColorCount, 
  quality, setQuality, 
  handleExtract, isExtracting, 
  imgElement, palette, 
  showExportMenu, setShowExportMenu, 
  exportPalette, setShowTutorial, setShowHelp
}) {
  return (
    <aside className={styles.sidebar}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => setShowTutorial(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Play size={14} color="var(--c1)" /> الشرح التفاعلي
        </button>
        <button onClick={() => setShowHelp(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Info size={14} color="var(--c1)" /> التعليمات
        </button>
      </div>

      <div className={styles.dropzone} onClick={() => fileInputRef.current.click()}>
        <Upload size={32} color="var(--c4)" />
        <div className={styles.dropzoneText}>
          <h3>قم برفع الصور لاستخراج الألوان</h3>
          <p>تحليل ذكي وتلقائي للألوان المهيمنة</p>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.sectionTitle}><Settings size={18} /> إعدادات الاستخراج</div>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderHeader}>
            <span>عدد الألوان</span>
            <span>{colorCount}</span>
          </div>
          <input 
            type="range" min="2" max="24" value={colorCount} 
            onChange={e => setColorCount(parseInt(e.target.value))}
            className={styles.slider}
          />
        </div>
        
        <div className={styles.sliderContainer}>
          <div className={styles.sliderHeader}>
            <span>دقة الاستخراج</span>
            <span>{quality === 1 ? 'قصوى' : quality < 10 ? 'عالية' : 'متوسطة'}</span>
          </div>
          <input 
            type="range" min="1" max="20" step="1" value={quality} 
            onChange={e => setQuality(parseInt(e.target.value))}
            className={styles.slider}
            style={{ direction: 'rtl' }}
          />
        </div>

        <button 
          className={styles.btnSecondary} 
          onClick={() => handleExtract()}
          disabled={!imgElement || isExtracting}
        >
          <RefreshCw size={18} className={isExtracting ? 'spin' : ''} />
          إعادة الاستخراج
        </button>
      </div>

      <div className={styles.controlGroup} style={{marginTop: 'auto'}}>
        <div className={styles.sectionTitle}><Share2 size={18} /> تصدير اللوحة</div>
        <div style={{position: 'relative'}}>
          <button 
            className={styles.btnMain} 
            disabled={palette.length === 0}
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <Download size={20} /> حفظ لوحة الألوان
          </button>
          {showExportMenu && (
            <div className={styles.exportMenu}>
              <button className={styles.exportOption} onClick={() => exportPalette('css')}>CSS Variables</button>
              <button className={styles.exportOption} onClick={() => exportPalette('sass')}>SASS / SCSS</button>
              <button className={styles.exportOption} onClick={() => exportPalette('json')}>JSON Data</button>
            </div>
          )}
        </div>
      </div>
      <input type="file" ref={fileInputRef} multiple hidden onChange={e => handleAddFiles(e.target.files)} accept="image/*" />
    </aside>
  );
}
