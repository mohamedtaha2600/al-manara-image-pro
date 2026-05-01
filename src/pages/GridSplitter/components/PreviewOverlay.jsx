import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import styles from './PreviewOverlay.module.css';

export default function PreviewOverlay({
  previewMode,
  setPreviewMode,
  previewIndex,
  setPreviewIndex,
  cells,
  setCells,
  showRulers,
  activeTool,
  viewerCanvasRef,
  previewPan,
  previewZoom,
  img
}) {
  const [cropPadding, setCropPadding] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const cropPaddingRef = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
  const isDragging = useRef(false);

  // Sync ref with state
  useEffect(() => {
    cropPaddingRef.current = cropPadding;
  }, [cropPadding]);

  // Reset crop padding when changing image or exiting
  useEffect(() => {
    setCropPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  }, [previewIndex, previewMode]);

  if (!previewMode || cells.length === 0 || !img) return null;

  const startDrag = (e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow drag if 'select' tool or rulers are active
    if (activeTool !== 'select' && !showRulers) return;
    
    isDragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const canvas = viewerCanvasRef.current;
    if (!canvas) return;
    
    const initialCell = { ...cells[previewIndex] };
    const scale = canvas.width / initialCell.w;
    const initialPadding = { ...cropPaddingRef.current };

    const onMouseMove = (moveEv) => {
       const dx = (moveEv.clientX - startX) / (scale * previewZoom);
       const dy = (moveEv.clientY - startY) / (scale * previewZoom);
       
       setCropPadding(prev => {
         const np = { ...initialPadding };
         
         if (edge.includes('left')) {
            np.left = initialPadding.left + dx;
            if (initialCell.x + np.left < 0) np.left = -initialCell.x;
         }
         if (edge.includes('right')) {
            np.right = initialPadding.right - dx;
            const maxPaddingRight = (img.width - (initialCell.x + initialCell.w));
            if (-np.right > maxPaddingRight) np.right = -maxPaddingRight;
         }
         if (edge.includes('top')) {
            np.top = initialPadding.top + dy;
            if (initialCell.y + np.top < 0) np.top = -initialCell.y;
         }
         if (edge.includes('bottom')) {
            np.bottom = initialPadding.bottom - dy;
            const maxPaddingBottom = (img.height - (initialCell.y + initialCell.h));
            if (-np.bottom > maxPaddingBottom) np.bottom = -maxPaddingBottom;
         }
         
         if (initialCell.w - (np.left + np.right) < 10) return prev;
         if (initialCell.h - (np.top + np.bottom) < 10) return prev;
         
         return np;
       });
    };

    const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        
        const finalPadding = cropPaddingRef.current;
        
        if(finalPadding.left !== 0 || finalPadding.right !== 0 || finalPadding.top !== 0 || finalPadding.bottom !== 0) {
            setCells(prev => prev.map((c, i) => {
              if (i === previewIndex) {
                 const nc = { ...c };
                 nc.x += finalPadding.left;
                 nc.w -= (finalPadding.left + finalPadding.right);
                 nc.y += finalPadding.top;
                 nc.h -= (finalPadding.top + finalPadding.bottom);
                 nc.isManual = true;
                 return nc;
              }
              return c;
            }));
            setCropPadding({ top: 0, bottom: 0, left: 0, right: 0 });
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const showHandles = showRulers || activeTool === 'select';
  const canvas = viewerCanvasRef.current;
  const scale = canvas && cells[previewIndex] ? canvas.width / cells[previewIndex].w : 1;
  const cpTop = cropPadding.top * scale;
  const cpBottom = cropPadding.bottom * scale;
  const cpLeft = cropPadding.left * scale;
  const cpRight = cropPadding.right * scale;

  return (
    <div className={styles.previewOverlay}>
      <button className={styles.previewCloseBtn} onClick={() => setPreviewMode(false)} title="إغلاق العارض">
        <X size={24} />
      </button>
      
      <div className={styles.previewContent}>
        <div style={{ position: 'relative', transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})` }}>
          <canvas ref={viewerCanvasRef} className={styles.previewViewerCanvas} />
          
          {showHandles && (
            <>
              {cpTop > 0 && <div className={styles.cropOverlay} style={{ top: 0, left: 0, right: 0, height: cpTop }} />}
              {cpBottom > 0 && <div className={styles.cropOverlay} style={{ bottom: 0, left: 0, right: 0, height: cpBottom }} />}
              {cpLeft > 0 && <div className={styles.cropOverlay} style={{ top: Math.max(0, cpTop), bottom: Math.max(0, cpBottom), left: 0, width: cpLeft }} />}
              {cpRight > 0 && <div className={styles.cropOverlay} style={{ top: Math.max(0, cpTop), bottom: Math.max(0, cpBottom), right: 0, width: cpRight }} />}

              <div className={styles.cropBox} style={{ top: cpTop, bottom: cpBottom, left: cpLeft, right: cpRight }} />
              
              <div className={styles.cropHandle} onMouseDown={(e) => startDrag(e, 'left')} style={{ top: cpTop, left: cpLeft - 10, bottom: cpBottom, width: 20, cursor: 'ew-resize' }} />
              <div className={styles.cropHandle} onMouseDown={(e) => startDrag(e, 'right')} style={{ top: cpTop, right: cpRight - 10, bottom: cpBottom, width: 20, cursor: 'ew-resize' }} />
              <div className={styles.cropHandle} onMouseDown={(e) => startDrag(e, 'top')} style={{ top: cpTop - 10, left: cpLeft, right: cpRight, height: 20, cursor: 'ns-resize' }} />
              <div className={styles.cropHandle} onMouseDown={(e) => startDrag(e, 'bottom')} style={{ bottom: cpBottom - 10, left: cpLeft, right: cpRight, height: 20, cursor: 'ns-resize' }} />
              
              <div className={styles.cornerHandle} onMouseDown={(e) => startDrag(e, 'top-left')} style={{ top: cpTop - 6, left: cpLeft - 6, borderRight: 'none', borderBottom: 'none', cursor: 'nwse-resize' }} />
              <div className={styles.cornerHandle} onMouseDown={(e) => startDrag(e, 'top-right')} style={{ top: cpTop - 6, right: cpRight - 6, borderLeft: 'none', borderBottom: 'none', cursor: 'nesw-resize' }} />
              <div className={styles.cornerHandle} onMouseDown={(e) => startDrag(e, 'bottom-left')} style={{ bottom: cpBottom - 6, left: cpLeft - 6, borderRight: 'none', borderTop: 'none', cursor: 'nesw-resize' }} />
              <div className={styles.cornerHandle} onMouseDown={(e) => startDrag(e, 'bottom-right')} style={{ bottom: cpBottom - 6, right: cpRight - 6, borderLeft: 'none', borderTop: 'none', cursor: 'nwse-resize' }} />
            </>
          )}
        </div>
      </div>

      <div className={styles.previewControls} dir="ltr">
        <button onClick={() => setPreviewIndex(0)} disabled={previewIndex === 0} title="الأولى"><ChevronsLeft size={20} /></button>
        <button onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))} disabled={previewIndex === 0} title="السابقة"><ChevronLeft size={24} /></button>
        <div className={styles.previewCounter} onWheel={(e) => {
            e.preventDefault();
            if (e.deltaY > 0) setPreviewIndex(p => p > 0 ? p - 1 : cells.length - 1);
            else setPreviewIndex(p => p < cells.length - 1 ? p + 1 : 0);
          }} style={{ cursor: 'ns-resize' }}>
          <span>{previewIndex + 1}</span> / {cells.length}
        </div>
        <button onClick={() => setPreviewIndex(prev => Math.min(cells.length - 1, prev + 1))} disabled={previewIndex === cells.length - 1} title="التالية"><ChevronRight size={24} /></button>
        <button onClick={() => setPreviewIndex(cells.length - 1)} disabled={previewIndex === cells.length - 1} title="الأخيرة"><ChevronsRight size={20} /></button>
      </div>
    </div>
  );
}
