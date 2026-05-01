import { MousePointer2, Hand, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './FloatingToolbar.module.css';

export default function FloatingToolbar({
  activeTool,
  setActiveTool,
  fitToScreen,
  color = 'var(--c2)'
}) {
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
        title="أداة التحريك (Hand)"
        className={`${styles.toolBtn} ${activeTool === 'pan' ? styles.active : ''}`}
        onClick={() => setActiveTool('pan')}
      >
        <Hand size={20} />
      </button>

      <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
      
      <button 
        title="تكبير"
        className={styles.toolBtn}
        onClick={() => {}}
      >
        <ZoomIn size={20} />
      </button>

      <button 
        title="تصغير"
        className={styles.toolBtn}
        onClick={() => {}}
      >
        <ZoomOut size={20} />
      </button>

      <button 
        title="ملاءمة الشاشة"
        className={styles.toolBtn}
        onClick={() => fitToScreen && fitToScreen()}
      >
        <Maximize size={20} />
      </button>
    </div>
  );
}
