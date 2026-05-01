import { useState } from 'react';
import { MousePointer2, Hand, Ruler, Eye, Maximize, Grid, Crop, Pipette } from 'lucide-react';
import styles from './FloatingToolbar.module.css';

export default function FloatingToolbar({
  activeTool,
  setActiveTool,
  showRulers,
  setShowRulers,
  showGrid,
  setShowGrid,
  hasCells,
  previewMode,
  setPreviewMode,
  setPreviewIndex,
  fitToScreen,
  simpleMode = false,
  color = 'var(--c1)', // Default to GridSplitter color
  isSpacePressed = false
}) {
  const [isFlashing, setIsFlashing] = useState(false);

  const handleFitClick = () => {
    setIsFlashing(true);
    fitToScreen();
    setTimeout(() => setIsFlashing(false), 500);
  };
  return (
    <div className={styles.floatingToolbar} style={{'--tool-color': color}}>
      <button 
        title="أداة التحديد"
        className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`}
        onClick={() => setActiveTool('select')}
      >
        <MousePointer2 size={20} />
      </button>
      <button 
        title="أداة التحريك (Hand) [مسطرة]"
        className={`${styles.toolBtn} ${(activeTool === 'pan' || isSpacePressed) ? styles.active : ''}`}
        onClick={() => setActiveTool('pan')}
      >
        <Hand size={20} />
      </button>
      {!simpleMode && (
        <button 
          title="أداة الاقتصاص (Crop)"
          className={`${styles.toolBtn} ${activeTool === 'crop' ? styles.active : ''}`}
          onClick={() => setActiveTool('crop')}
        >
          <Crop size={20} />
        </button>
      )}

      {/* Eye Dropper / Color Picker */}
      {!simpleMode && (
        <button 
          title="أداة القطارة (Eye Dropper) [Picker]"
          className={`${styles.toolBtn} ${activeTool === 'picker' ? styles.active : ''}`}
          onClick={() => setActiveTool('picker')}
        >
          <Pipette size={20} />
        </button>
      )}

      {!simpleMode && (
        <>
          <button 
            title="إظهار/إخفاء الأبعاد (المسطرة والأرقام)"
            className={`${styles.toolBtn} ${showRulers ? styles.active : ''}`}
            onClick={() => setShowRulers(!showRulers)}
          >
            <Ruler size={20} />
          </button>
          <button 
            title="إظهار/إخفاء الخطوط"
            className={`${styles.toolBtn} ${showGrid ? styles.active : ''}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid size={20} />
          </button>
        </>
      )}

      <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
      
      {!simpleMode && (
        <button 
          title="عارض الصور المقصوصة"
          className={`${styles.toolBtn} ${previewMode ? styles.active : ''}`}
          onClick={() => {
            if (hasCells) {
              if (!previewMode) setPreviewIndex(0);
              setPreviewMode(!previewMode);
            }
          }}
        >
          <Eye size={20} />
        </button>
      )}

      <button 
        title="ملاءمة الشاشة (Fit to Screen)"
        className={`${styles.toolBtn} ${isFlashing ? styles.flash : ''}`}
        onClick={handleFitClick}
      >
        <Maximize size={20} />
      </button>
    </div>
  );
}
