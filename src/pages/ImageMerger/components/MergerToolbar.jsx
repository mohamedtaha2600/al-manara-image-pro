import React from 'react';
import { MousePointer2, Move, Grid, Maximize, Ruler } from 'lucide-react';

export default function MergerToolbar({ 
  activeTool, setActiveTool, showRulers, setShowRulers, showGrid, setShowGrid, fitToScreen 
}) {
  const tools = [
    { id: 'select', icon: <MousePointer2 size={18} />, title: 'أداة الاختيار (V)' },
    { id: 'pan', icon: <Move size={18} />, title: 'أداة التحريك (H)' },
  ];

  return (
    <div style={{ position: 'absolute', top: '20px', left: '340px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 100 }}>
      {tools.map(tool => (
        <button 
          key={tool.id} onClick={() => setActiveTool(tool.id)} title={tool.title}
          style={{ width: '45px', height: '45px', borderRadius: '12px', border: '1px solid var(--border)', background: activeTool === tool.id ? 'var(--c1)' : 'rgba(20,20,25,0.8)', color: activeTool === tool.id ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: '0.2s' }}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '5px auto' }} />

      <button onClick={() => setShowRulers(!showRulers)} title="المسطرة" style={{ width: '45px', height: '45px', borderRadius: '12px', border: '1px solid var(--border)', background: showRulers ? 'rgba(0, 230, 118, 0.1)' : 'rgba(20,20,25,0.8)', color: showRulers ? 'var(--c1)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
        <Ruler size={18} />
      </button>

      <button onClick={() => setShowGrid(!showGrid)} title="الشبكة" style={{ width: '45px', height: '45px', borderRadius: '12px', border: '1px solid var(--border)', background: showGrid ? 'rgba(0, 230, 118, 0.1)' : 'rgba(20,20,25,0.8)', color: showGrid ? 'var(--c1)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
        <Grid size={18} />
      </button>

      <button onClick={fitToScreen} title="ملائمة الشاشة" style={{ width: '45px', height: '45px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(20,20,25,0.8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
        <Maximize size={18} />
      </button>
    </div>
  );
}
