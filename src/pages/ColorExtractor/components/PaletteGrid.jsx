import { Palette, Trash2, Check, Copy } from 'lucide-react';
import styles from '../ColorExtractor.module.css';
import { getContrastColor, hexToRgb, hexToHsl } from '../utils/colorUtils';

export default function PaletteGrid({ palette, setPalette, copyStatus, copyToClipboard }) {
  return (
    <div className={styles.paletteGridContainer}>
      <div className={styles.sectionTitle} style={{justifyContent: 'space-between'}}>
        <div style={{display:'flex', gap: '8px', alignItems:'center'}}>
           <Palette size={20} /> لوحة الألوان المستخرجة
        </div>
        {palette.length > 0 && (
           <button className={styles.btnSecondary} onClick={() => setPalette([])} style={{padding: '4px 8px', fontSize: '0.7rem'}}>
              <Trash2 size={14} /> مسح الكل
           </button>
        )}
      </div>
      <div className={styles.paletteGrid}>
        {palette.map((color, idx) => {
          const contrast = getContrastColor(color);
          const rgb = hexToRgb(color);
          const hsl = hexToHsl(color);
          return (
            <div key={idx} className={styles.colorCard}>
              <div 
                className={styles.colorPreview} 
                style={{ backgroundColor: color }}
                onClick={() => copyToClipboard(color, `hex-${idx}`)}
              >
                <button className={styles.copyBtn}>
                  {copyStatus === `hex-${idx}` ? <Check size={14} color={contrast}/> : <Copy size={14} color={contrast}/>}
                </button>
              </div>
              <div className={styles.colorInfo}>
                <div className={styles.colorHex}>{color.toUpperCase()}</div>
                <div className={styles.colorRgb}>RGB: {rgb.r}, {rgb.g}, {rgb.b}</div>
                <div className={styles.colorRgb}>HSL: {hsl.h}°, {hsl.s}%, {hsl.l}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
