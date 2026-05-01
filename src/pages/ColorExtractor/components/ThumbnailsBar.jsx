import { X } from 'lucide-react';
import styles from '../ColorExtractor.module.css';

export default function ThumbnailsBar({ files, activeIndex, setActiveIndex, setFiles, fileInputRef }) {
  return (
    <div className={styles.bottomBar}>
      <div className={styles.imageListHeader}>
        <span>قائمة الصور ({files.length})</span>
        <button className={styles.btnSecondary} style={{padding: '4px 12px'}} onClick={() => fileInputRef.current.click()}>+ إضافة صور</button>
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
  );
}
