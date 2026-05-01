import React from 'react';
import { Upload, Trash2, Image as ImageIcon, Plus } from 'lucide-react';

export default function MergerLibrary({ library, setLibrary, setDraggedImg, handleFile }) {
  return (
    <div style={{ width: '280px', background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
          <ImageIcon size={18} color="var(--c1)" /> مكتبة الصور
        </h3>
        <label style={{ cursor: 'pointer', color: 'var(--c1)', background: 'rgba(0, 230, 118, 0.1)', padding: '5px', borderRadius: '6px', display: 'flex' }}>
          <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => Array.from(e.target.files).forEach(handleFile)} />
          <Plus size={18} />
        </label>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
        {library.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 10px', color: 'var(--text-dim)' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
              <Upload size={24} style={{ opacity: 0.3 }} />
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>لا توجد صور حالياً</p>
            <p style={{ fontSize: '0.65rem', opacity: 0.5 }}>ارفع الصور لسحبها للشبكة</p>
          </div>
        ) : (
          library.map(item => (
            <div 
              key={item.id} 
              draggable 
              onDragStart={() => setDraggedImg(item.img)}
              onDragEnd={() => setDraggedImg(null)}
              style={{ position: 'relative', aspectRatio: '1/1', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', cursor: 'grab', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              <img src={item.img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={() => setLibrary(prev => prev.filter(i => i.id !== item.id))}
                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '5px', color: '#fff', padding: '4px', cursor: 'pointer' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
      
      <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        اسحب الصور من هنا وأسقطها داخل الشبكة
      </div>
    </div>
  );
}
