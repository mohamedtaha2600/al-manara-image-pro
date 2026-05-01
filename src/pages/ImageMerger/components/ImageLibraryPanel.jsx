import { X, Plus } from 'lucide-react';
import styles from '../ImageMerger.module.css';

export default function ImageLibraryPanel({ library, canvasImages, setCanvasImages, setLibrary, canvasWidth, canvasHeight }) {
  const isOnCanvas = (id) => canvasImages.some(img => img.id === id);

  const addToCanvas = (item) => {
    if (isOnCanvas(item.id)) return;
    const maxW = canvasWidth * 0.5;
    const maxH = canvasHeight * 0.5;
    const scale = Math.min(maxW / item.originalW, maxH / item.originalH, 1);
    const w = item.originalW * scale;
    const h = item.originalH * scale;
    setCanvasImages(prev => [...prev, {
      ...item,
      freeX: (canvasWidth - w) / 2,
      freeY: (canvasHeight - h) / 2,
      freeW: w,
      freeH: h,
    }]);
  };

  const removeFromLibrary = (e, id) => {
    e.stopPropagation();
    setLibrary(prev => prev.filter(i => i.id !== id));
    setCanvasImages(prev => prev.filter(i => i.id !== id));
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('libraryItemId', item.id);
  };

  if (library.length === 0) return null;

  return (
    <div className={styles.imageLibrary}>
      <div className={styles.libraryHeader}>مكتبة الصور</div>
      {library.map((item) => {
        const onCanvas = isOnCanvas(item.id);
        return (
          <div
            key={item.id}
            className={`${styles.libraryItem} ${onCanvas ? styles.libraryItemOnCanvas : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onClick={() => addToCanvas(item)}
            title={onCanvas ? 'موجودة على اللوحة' : 'انقر أو اسحب للإضافة'}
          >
            <img src={item.url} alt="" />
            {onCanvas && <div className={styles.onCanvasBadge}>✓</div>}
            <button
              className={styles.libDeleteBtn}
              onClick={(e) => removeFromLibrary(e, item.id)}
            >
              <X size={10} />
            </button>
            {!onCanvas && (
              <div className={styles.addOverlay}>
                <Plus size={16} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
