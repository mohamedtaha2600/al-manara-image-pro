import { formatBytes } from '../utils/compressionUtils';
import ImageSlider from './ImageSlider';
import styles from '../ImageCompressor.module.css';

export default function ComparisonView({ activeImage, activeTool }) {
  if (!activeImage) return null;

  return (
    <div className={styles.comparisonView}>
      <div className={styles.compContentFull}>
        {activeImage.compressedUrl ? (
          <ImageSlider before={activeImage.originalUrl} after={activeImage.compressedUrl} activeTool={activeTool} />
        ) : (
          <div className={styles.emptyCompBox}>
            <img src={activeImage.originalUrl} className={styles.compImgVisible} alt="Pending" />
            <div className={styles.compOverlay}>جاري معالجة المعاينة...</div>
          </div>
        )}
      </div>
    </div>
  );
}
