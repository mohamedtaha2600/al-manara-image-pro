import { Settings, Maximize, FileText, Download, Trash2, Layout, Square, Info, Play } from 'lucide-react';
import styles from '../ImageMerger.module.css';

export default function MergerSidebar({ 
  cols, setCols, rows, setRows, canvasSize, setCanvasSize, 
  prefix, setPrefix, exportFormat, setExportFormat, 
  handleExport, handleFile, globalPadding, setGlobalPadding, handleReset,
  activeCell, setCells, library, setShowTutorial, setShowHelp 
}) {
  return (
    <div style={{ width: '320px', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '20px' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => setShowTutorial(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Play size={14} color="var(--c1)" /> الشرح التفاعلي
        </button>
        <button onClick={() => setShowHelp(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
          <Info size={14} color="var(--c1)" /> التعليمات
        </button>
      </div>

      <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--c1)', marginBottom: '20px', textTransform: 'uppercase' }}>
        <Layout size={16} /> تقسيم الجريد (الشبكة)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>الأعمدة</label>
          <input type="number" value={cols} onChange={e => setCols(Math.max(1, parseInt(e.target.value)))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>الصفوف</label>
          <input type="number" value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value)))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => { setCols(2); setRows(1); }} style={{ flex: 1, padding: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', color: '#fff', cursor: 'pointer' }}>2x1 (أفقي)</button>
        <button onClick={() => { setCols(1); setRows(2); }} style={{ flex: 1, padding: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', color: '#fff', cursor: 'pointer' }}>1x2 (رأسي)</button>
        <button onClick={() => { setCols(2); setRows(2); }} style={{ flex: 1, padding: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.65rem', color: '#fff', cursor: 'pointer' }}>2x2 (مربع)</button>
      </div>

      <button 
        onClick={() => {
          setCells(prev => {
            let libIdx = 0;
            return prev.map(c => {
              if (c.img || libIdx >= library.length) return c;
              const newCell = { ...c, img: library[libIdx].img };
              libIdx++;
              return newCell;
            });
          });
        }}
        style={{ width: '100%', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--c1)', border: '1px solid var(--c1)', padding: '10px', borderRadius: '10px', fontSize: '0.75rem', marginBottom: '25px', cursor: 'pointer' }}
      >
        تعبئة تلقائية من المكتبة
      </button>

      {activeCell && (
        <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid var(--c1)', borderRadius: '12px', padding: '15px', marginBottom: '25px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--c1)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Settings size={14} /> إعدادات الخلية المختارة
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '3px' }}>هوامش س</label>
              <input type="number" value={activeCell.padding?.x || 0} onChange={e => setCells(prev => prev.map(c => c.id === activeCell.id ? { ...c, padding: { ...c.padding, x: parseInt(e.target.value) } } : c))} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '5px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '3px' }}>هوامش ص</label>
              <input type="number" value={activeCell.padding?.y || 0} onChange={e => setCells(prev => prev.map(c => c.id === activeCell.id ? { ...c, padding: { ...c.padding, y: parseInt(e.target.value) } } : c))} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '5px', color: '#fff' }} />
            </div>
          </div>
          <button 
            onClick={() => setCells(prev => prev.map(c => c.id === activeCell.id ? { ...c, img: null } : c))}
            style={{ width: '100%', marginTop: '10px', background: 'rgba(255,0,0,0.1)', color: '#ff4d4d', border: 'none', padding: '5px', borderRadius: '5px', fontSize: '0.7rem', cursor: 'pointer' }}
          >
            حذف الصورة من الخلية
          </button>
        </div>
      )}

      <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--c1)', marginBottom: '20px', textTransform: 'uppercase' }}>
        <Maximize size={16} /> حجم لوحة الدمج
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>العرض</label>
          <input type="number" value={canvasSize.width} onChange={e => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>الطول</label>
          <input type="number" value={canvasSize.height} onChange={e => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
      </div>

      <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--c1)', marginBottom: '20px', textTransform: 'uppercase' }}>
        <Square size={16} /> المسافات (Padding)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>أفقي</label>
          <input type="number" value={globalPadding.x} onChange={e => setGlobalPadding(prev => ({ ...prev, x: parseInt(e.target.value) }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px' }}>رأسي</label>
          <input type="number" value={globalPadding.y} onChange={e => setGlobalPadding(prev => ({ ...prev, y: parseInt(e.target.value) }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: '#fff' }} />
        </div>
      </div>

      <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--c1)', marginBottom: '20px', textTransform: 'uppercase' }}>
        <FileText size={16} /> إعدادات الحفظ
      </div>
      <input 
        type="text" value={prefix} onChange={e => setPrefix(e.target.value)} 
        placeholder="اسم الملف..." 
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: '#fff', marginBottom: '15px' }} 
      />
      
      <select 
        value={exportFormat} onChange={e => setExportFormat(e.target.value)}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: '#fff', marginBottom: '25px' }}
      >
        <option value="png">PNG (جودة عالية)</option>
        <option value="jpeg">JPEG (حجم صغير)</option>
        <option value="webp">WebP (أحدث صيغة)</option>
      </select>

      <button onClick={handleExport} style={{ width: '100%', background: 'var(--c1)', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.3s' }}>
        <Download size={20} /> تصدير الصورة النهائية
      </button>

      <button onClick={handleReset} style={{ width: '100%', background: 'rgba(255,0,0,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,0,0,0.2)', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px' }}>
        <Trash2 size={18} /> مسح الشبكة
      </button>

    </div>
  );
}
