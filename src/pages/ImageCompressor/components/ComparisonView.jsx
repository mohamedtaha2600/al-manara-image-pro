import { formatBytes } from '../utils/compressionUtils';
import ImageSlider from './ImageSlider';
import styles from '../ImageCompressor.module.css';

export default function ComparisonView({ activeImage }) {
  if (!activeImage) return null;

  return (
    <div className={styles.comparisonView}>
      {/* تم حذف شريط العنوان (compHeader) بناءً على طلبك */}
      <div className={styles.compContentFull}>
        {activeImage.compressedUrl ? (
          <ImageSlider before={activeImage.originalUrl} after={activeImage.compressedUrl} />
        ) : (
          <div className={styles.emptyCompBox}>
            <img src={activeImage.originalUrl} className={styles.compImgDim} alt="Pending" />
            <div className={styles.compOverlay}>جاري معالجة الصورة للمعاينة...</div>
          </div>
        )}
      </div>
    </div>
  );
}
