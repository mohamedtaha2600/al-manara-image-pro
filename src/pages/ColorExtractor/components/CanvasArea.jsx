import { Palette } from 'lucide-react';
import styles from '../ColorExtractor.module.css';

export default function CanvasArea({ 
  containerRef, handleMouseDown, setZoom, 
  activeFile, fileInputRef, 
  pan, zoom, 
  handleCanvasMouseMove, handleCanvasClick, 
  canvasRef, pickerPos, zoomCanvasRef 
}) {
  return (
    <div className={styles.workspace} ref={containerRef} onMouseDown={handleMouseDown}>
      <div 
        className={styles.canvasContainer}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setZoom(z => Math.max(0.05, Math.min(15, z * delta)));
        }}
      >
        {!activeFile ? (
          <div className={styles.emptyState} onClick={() => fileInputRef.current.click()}>
            <Palette size={60} color="var(--c4)" />
            <h2 style={{fontWeight: 900, color: '#fff'}}>قم باختيار صورة لبدء التحليل</h2>
            <p>يمكنك استخدام القطارة لالتقاط ألوان مخصصة من الصورة</p>
          </div>
        ) : (
          <div 
            className={styles.canvasWrapper} 
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
          >
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>

      {pickerPos.show && (
        <div 
          className={styles.eyeDropperPreview}
          style={{ left: pickerPos.x + 20, top: pickerPos.y - 100 }}
        >
          <canvas ref={zoomCanvasRef} width="80" height="80" />
          <div className={styles.eyeDropperCenter} />
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', 
            background: pickerPos.color, height: '20px',
            borderTop: '1px solid #fff'
          }} />
        </div>
      )}
    </div>
  );
}
