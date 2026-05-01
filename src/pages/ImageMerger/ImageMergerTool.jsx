import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ImageMerger.module.css';
import { useMergerState } from './hooks/useMergerState';
import { useMergerCanvas } from './hooks/useMergerCanvas';
import { 
  Search, Upload, Info, Camera, MapPin, Calendar, 
  Maximize2, Trash2, Aperture, Clock, Zap, Cpu, Settings, 
  Download, Play, Image as ImageIcon, Layout, Grid as GridIcon, Hand
} from 'lucide-react';

import MergerSidebar from './components/MergerSidebar';
import MergerToolbar from './components/MergerToolbar';
import MergerLibrary from './components/MergerLibrary';

// Shared components
import GenericTutorial from '../../components/Shared/GenericTutorial';
import GenericHelpModal from '../../components/Shared/GenericHelpModal';
import { useToolOnboarding } from '../../components/Shared/useToolOnboarding';

const mergerTutorialSteps = [
  {
    title: "مرحباً بك في دامج الصور!",
    content: "هنا يمكنك دمج صور متعددة في لوحة واحدة بتخطيطات احترافية.",
    icon: <Layout size={40} color="var(--c1)" />
  },
  {
    title: "مكتبة الصور",
    content: "ابدأ برفع صورك في المكتبة على اليسار، ثم اسحبها وأسقطها داخل خلايا الشبكة.",
    icon: <Upload size={40} color="var(--c2)" />
  },
  {
    title: "تخصيص الشبكة",
    content: "تحكم في عدد الصفوف والأعمدة، واستخدم القوالب الجاهزة للتبديل السريع بين التخطيطات.",
    icon: <GridIcon size={40} color="var(--c1)" />
  },
  {
    title: "إعدادات الخلايا",
    content: "اضغط على أي خلية لتعديل هوامشها (Padding) أو حذف الصورة منها بشكل منفصل.",
    icon: <Settings size={40} color="var(--c3)" />
  }
];

const mergerHelpSections = [
  {
    title: "كيفية الدمج",
    icon: <ImageIcon size={18} />,
    content: "ارفع الصور أولاً، ثم اسحبها من المكتبة وضعها في المربعات الفارغة بالوسط. يمكنك استخدام زر 'تعبئة تلقائية' لتوفير الوقت."
  },
  {
    title: "التحكم في اللوحة",
    icon: <Hand size={18} />,
    content: "استخدم بكرة الماوس للزوم، وزر المسافة (Space) للتحريك داخل اللوحة الكبيرة."
  },
  {
    title: "التصدير",
    icon: <Download size={18} />,
    content: "بعد الانتهاء، اختر الصيغة المناسبة (PNG/JPEG/WebP) واضغط تصدير لحفظ النتيجة النهائية."
  }
];

export default function ImageMergerTool() {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  
  const {
    cells, setCells, cols, setCols, rows, setRows, library, setLibrary,
    canvasSize, setCanvasSize, prefix, setPrefix, exportFormat, setExportFormat,
    statusMsg, setStatusMsg, globalPadding, setGlobalPadding, handleFile, initCells
  } = useMergerState();

  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('select');
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedImg, setDraggedImg] = useState(null);
  const [activeCellId, setActiveCellId] = useState(null);

  // Onboarding
  const { showTutorial, setShowTutorial, showHelp, setShowHelp } = useToolOnboarding('image-merger');

  useMergerCanvas({ canvasRef, cells, zoom, pan, showRulers, showGrid, canvasSize, globalPadding });

  const fitToScreen = useCallback(() => {
    if (!previewRef.current) return;
    const pw = previewRef.current.clientWidth - 100;
    const ph = previewRef.current.clientHeight - 100;
    const ratio = Math.min(pw / canvasSize.width, ph / canvasSize.height);
    setZoom(ratio > 0 ? ratio : 0.1);
    setPan({ x: 0, y: 0 });
  }, [canvasSize]);

  useEffect(() => {
    fitToScreen();
  }, [canvasSize]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${prefix}.${exportFormat}`;
    link.href = canvas.toDataURL(`image/${exportFormat}`);
    link.click();
    setStatusMsg('تم تصدير الصورة بنجاح!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const onMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
    }
    if (e.target === previewRef.current) setActiveCellId(null);
  };

  const onMouseMove = (e) => {
    if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
  };

  const handleDropToCell = (cellId, img) => {
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, img } : c));
    setActiveCellId(cellId);
  };

  return (
    <div className={styles.container}>
      {statusMsg && <div className={styles.statusOverlay}>{statusMsg}</div>}
      
      <div className={styles.mainLayout}>
        <MergerSidebar 
          cols={cols} setCols={setCols} rows={rows} setRows={setRows}
          canvasSize={canvasSize} setCanvasSize={setCanvasSize}
          prefix={prefix} setPrefix={setPrefix}
          exportFormat={exportFormat} setExportFormat={setExportFormat}
          handleExport={handleExport} handleFile={handleFile}
          globalPadding={globalPadding} setGlobalPadding={setGlobalPadding}
          handleReset={() => { setCells(prev => prev.map(c => ({ ...c, img: null }))); setActiveCellId(null); }}
          activeCell={cells.find(c => c.id === activeCellId)}
          setCells={setCells}
          library={library}
          setShowTutorial={setShowTutorial}
          setShowHelp={setShowHelp}
        />

        <MergerToolbar 
          activeTool={activeTool} setActiveTool={setActiveTool}
          showRulers={showRulers} setShowRulers={setShowRulers}
          showGrid={showGrid} setShowGrid={setShowGrid}
          fitToScreen={fitToScreen}
        />

        <div 
          className={styles.previewArea} ref={previewRef}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onWheel={(e) => {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.max(0.05, Math.min(10, z * delta)));
          }}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        >
          <div className={styles.canvasWrapper} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <canvas ref={canvasRef} className={styles.canvas} />
            
            {cells.map(cell => (
              <div 
                key={cell.id}
                className={`${styles.cellOverlay} ${activeCellId === cell.id ? styles.cellOverlayActive : ''}`}
                style={{ left: cell.x, top: cell.y, width: cell.w, height: cell.h }}
                onClick={() => setActiveCellId(cell.id)}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = 'rgba(0, 230, 118, 0.2)'; }}
                onDragLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.background = 'transparent';
                  if (draggedImg) handleDropToCell(cell.id, draggedImg);
                }}
              >
                {!cell.img && <ImageIcon className={styles.emptyCellIcon} size={Math.min(cell.w, cell.h) * 0.3} />}
              </div>
            ))}
          </div>
          
          <div className={styles.canvasImgInfo}>
            {canvasSize.width} x {canvasSize.height} px
          </div>
        </div>

        <MergerLibrary 
          library={library} setLibrary={setLibrary} 
          setDraggedImg={setDraggedImg}
          handleFile={handleFile}
        />
      </div>

      <GenericTutorial show={showTutorial} onClose={() => setShowTutorial(false)} steps={mergerTutorialSteps} />
      <GenericHelpModal show={showHelp} onClose={() => setShowHelp(false)} title="دليل استخدام دامج الصور" sections={mergerHelpSections} />
    </div>
  );
}
