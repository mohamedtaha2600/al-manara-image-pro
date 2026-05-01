import styles from '../GridSplitter.module.css';

export default function CropToolOverlay({ img, cropBox, setCropBox, zoom, applyCrop, onCancel }) {
  if (!img || !cropBox) return null;

  const { x: cx, y: cy, w: cw, h: ch } = cropBox;
  const HANDLE_SIZE = 10 / zoom;
  const STROKE = 1.5 / zoom;
  const FONT = 12 / zoom;

  const startCropDrag = (handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startBox = { ...cropBox };

    const onMove = (me) => {
      // Use absolute delta from start to prevent "zoom drift" and jitter
      const totalDx = (me.clientX - startX) / zoom;
      const totalDy = (me.clientY - startY) / zoom;
      
      setCropBox(prev => {
        let { x, y, w, h } = startBox;
        const minSize = 20;
        if (handle === 'move') {
          x = Math.max(0, Math.min(img.width - w, startBox.x + totalDx));
          y = Math.max(0, Math.min(img.height - h, startBox.y + totalDy));
        }
        if (handle.includes('right')) w = Math.max(minSize, Math.min(img.width - x, startBox.w + totalDx));
        if (handle.includes('bottom')) h = Math.max(minSize, Math.min(img.height - y, startBox.h + totalDy));
        if (handle.includes('left')) { 
          const nx = Math.max(0, Math.min(startBox.x + startBox.w - minSize, startBox.x + totalDx)); 
          w = startBox.x + startBox.w - nx; 
          x = nx; 
        }
        if (handle.includes('top')) { 
          const ny = Math.max(0, Math.min(startBox.y + startBox.h - minSize, startBox.y + totalDy)); 
          h = startBox.y + startBox.h - ny; 
          y = ny; 
        }
        return { x, y, w, h };
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handles = [
    { id: 'top-left', style: { top: cy - HANDLE_SIZE, left: cx - HANDLE_SIZE, cursor: 'nwse-resize' } },
    { id: 'top-right', style: { top: cy - HANDLE_SIZE, left: cx + cw - HANDLE_SIZE, cursor: 'nesw-resize' } },
    { id: 'bottom-left', style: { top: cy + ch - HANDLE_SIZE, left: cx - HANDLE_SIZE, cursor: 'nesw-resize' } },
    { id: 'bottom-right', style: { top: cy + ch - HANDLE_SIZE, left: cx + cw - HANDLE_SIZE, cursor: 'nwse-resize' } },
    { id: 'top', style: { top: cy - HANDLE_SIZE, left: cx + cw / 2 - HANDLE_SIZE, cursor: 'ns-resize' } },
    { id: 'bottom', style: { top: cy + ch - HANDLE_SIZE, left: cx + cw / 2 - HANDLE_SIZE, cursor: 'ns-resize' } },
    { id: 'left', style: { top: cy + ch / 2 - HANDLE_SIZE, left: cx - HANDLE_SIZE, cursor: 'ew-resize' } },
    { id: 'right', style: { top: cy + ch / 2 - HANDLE_SIZE, left: cx + cw - HANDLE_SIZE, cursor: 'ew-resize' } },
  ];

  return (
    <div className={styles.cropOverlay} style={{ width: img.width, height: img.height }}>
      <svg width={img.width} height={img.height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <mask id="cropMask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={cx} y={cy} width={cw} height={ch} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#cropMask)" />
        <rect x={cx} y={cy} width={cw} height={ch} fill="none" stroke="#fff" strokeWidth={STROKE} />
        
        {/* White corners visual */}
        <path d={`M ${cx} ${cy+20/zoom} L ${cx} ${cy} L ${cx+20/zoom} ${cy}`} fill="none" stroke="#fff" strokeWidth={STROKE*3} />
        <path d={`M ${cx+cw-20/zoom} ${cy} L ${cx+cw} ${cy} L ${cx+cw} ${cy+20/zoom}`} fill="none" stroke="#fff" strokeWidth={STROKE*3} />
        <path d={`M ${cx} ${cy+ch-20/zoom} L ${cx} ${cy+ch} L ${cx+20/zoom} ${cy+ch}`} fill="none" stroke="#fff" strokeWidth={STROKE*3} />
        <path d={`M ${cx+cw-20/zoom} ${cy+ch} L ${cx+cw} ${cy+ch} L ${cx+cw} ${cy+ch-20/zoom}`} fill="none" stroke="#fff" strokeWidth={STROKE*3} />

        {/* Rule of thirds */}
        <line x1={cx + cw / 3} y1={cy} x2={cx + cw / 3} y2={cy + ch} stroke="rgba(255,255,255,0.2)" strokeWidth={STROKE / 2} />
        <line x1={cx + 2 * cw / 3} y1={cy} x2={cx + 2 * cw / 3} y2={cy + ch} stroke="rgba(255,255,255,0.2)" strokeWidth={STROKE / 2} />
        <line x1={cx} y1={cy + ch / 3} x2={cx + cw} y2={cy + ch / 3} stroke="rgba(255,255,255,0.2)" strokeWidth={STROKE / 2} />
        <line x1={cx} y1={cy + 2 * ch / 3} x2={cx + cw} y2={cy + 2 * ch / 3} stroke="rgba(255,255,255,0.2)" strokeWidth={STROKE / 2} />
      </svg>
      
      <div style={{ position: 'absolute', left: cx, top: cy, width: cw, height: ch, cursor: 'move' }} onMouseDown={(e) => startCropDrag('move', e)} />
      
      {handles.map(h => (
        <div key={h.id} onMouseDown={(e) => startCropDrag(h.id, e)}
          style={{
            position: 'absolute', width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2,
            background: 'white', border: `${1/zoom}px solid #000`, borderRadius: 2, ...h.style
          }}
        />
      ))}

      <div style={{
        position: 'absolute', left: cx + cw/2, bottom: -40/zoom, transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '4px 12px', borderRadius: 4,
        fontSize: FONT, pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', gap: 10
      }}>
        <span>{Math.round(cw)} × {Math.round(ch)}</span>
        <span style={{opacity: 0.6}}>اضغط Enter للتأكيد · Esc للإلغاء</span>
      </div>
    </div>
  );
}
