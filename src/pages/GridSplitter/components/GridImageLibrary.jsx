import { X, Plus, Image as ImageIcon } from 'lucide-react';
import styles from '../GridSplitter.module.css';

export default function GridImageLibrary({ library, currentImg, setImg, setImgInfo, setPrefix, setCells, cols, rows, fitToScreen }) {
  if (library.length === 0) return null;

  const selectImage = (item) => {
    setImg(item.img);
    setImgInfo(`${item.w}x${item.h}px`);
    setPrefix(item.name.split('.')[0]);
    // Re-init grid
    const { initGridCoords } = require('../utils/gridUtils');
    setCells(initGridCoords(item.img, cols, rows));
    fitToScreen(item.img);
  };

  return (
    <div className={styles.imageLibrary}>
      <div className={styles.libraryHeader}>مكتبة الصور</div>
      {library.map((item) => {
        const isActive = currentImg === item.img;
        return (
          <div
            key={item.id}
            className={`${styles.libraryItem} ${isActive ? styles.libraryItemActive : ''}`}
            onClick={() => selectImage(item)}
          >
            <img src={item.url} alt="" />
            {isActive && <div className={styles.activeBadge}>✓</div>}
            {!isActive && <div className={styles.addOverlay}><Plus size={16} /></div>}
          </div>
        );
      })}
    </div>
  );
}
