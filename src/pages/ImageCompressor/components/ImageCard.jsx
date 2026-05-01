import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { formatBytes } from '../utils/compressionUtils';
import styles from '../ImageCompressor.module.css';

export default function ImageCard({ image, isActive, onClick, onRemove }) {
  return (
    <div 
      className={`${styles.imageCard} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <button 
        className={styles.removeBtn} 
        onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
      >
        <X size={14} />
      </button>

      <div className={styles.cardHeader}>
        <img src={image.originalUrl} className={styles.thumb} alt={image.name} />
        <div className={styles.fileName}>{image.name}</div>
        <div className={styles.statusIcon}>
          {image.status === 'done' && <CheckCircle size={18} color="#00e676" />}
          {image.status === 'error' && <XCircle size={18} color="#ff5252" />}
          {image.status === 'processing' && <Loader2 size={18} color="var(--c2)" className="animate-spin" />}
        </div>
      </div>

      <div className={styles.cardProgress}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${image.progress}%` }}
        ></div>
      </div>

      <div className={styles.cardStats}>
        <span>{formatBytes(image.originalSize)}</span>
        {image.status === 'done' && (
          <>
            <span className={styles.arrow}>→</span>
            <span className={styles.statValueNew}>{formatBytes(image.compressedSize)}</span>
            <span className={styles.savingBadge}>{image.savings}%</span>
          </>
        )}
      </div>
    </div>
  );
}
