import { useState, useRef, useEffect } from 'react';
import styles from './ColorExtractor.module.css';
import FloatingToolbar from '../GridSplitter/components/FloatingToolbar';
import { useColorExtractor } from './hooks/useColorExtractor';

import Sidebar from './components/Sidebar';
import PaletteGrid from './components/PaletteGrid';
import CanvasArea from './components/CanvasArea';
import ThumbnailsBar from './components/ThumbnailsBar';

// Shared components
import GenericTutorial from '../../components/Shared/GenericTutorial';
import GenericHelpModal from '../../components/Shared/GenericHelpModal';
import { useToolOnboarding } from '../../components/Shared/useToolOnboarding';
import { Palette, MousePointer2, Download, Zap, Info, Play } from 'lucide-react';

const colorTutorialSteps = [
  {
    title: "مرحباً بك في مستخرج الألوان!",
    content: "هنا يمكنك استخراج لوحات ألوان احترافية من صورك بذكاء وسهولة.",
    icon: <Palette size={40} color="var(--c1)" />
  },
  {
    title: "استخراج تلقائي",
    content: "اضغط على زر 'استخراج الألوان' وسيقوم النظام بتحليل الصورة واختيار أكثر الألوان تناسقاً.",
    icon: <Zap size={40} color="var(--c2)" />
  },
  {
    title: "القطارة اليدوية",
    content: "استخدم أداة القطارة (Picker) من شريط الأدوات لتحديد أي لون بدقة من داخل الصورة يدوياً.",
    icon: <MousePointer2 size={40} color="var(--c1)" />
  },
  {
    title: "تصدير اللوحة",
    content: "بعد اختيار الألوان، يمكنك تصديرها كملف CSS أو JSON أو SASS لتستخدمها مباشرة في مشاريعك.",
    icon: <Download size={40} color="var(--c3)" />
  }
];

const colorHelpSections = [
  {
    title: "كيفية الاستخراج",
    icon: <Palette size={18} />,
    content: "ارفع صورتك ثم حدد عدد الألوان المطلوب (من 2 إلى 12). اضغط 'استخراج' للحصول على النتيجة فوراً."
  },
  {
    title: "نسخ الكود",
    icon: <Download size={18} />,
    content: "اضغط على أي لون في اللوحة الجانبية لنسخ كود الـ HEX الخاص به تلقائياً إلى الحافظة."
  },
  {
    title: "اختيار لون محدد",
    icon: <MousePointer2 size={18} />,
    content: "فعل أداة القطارة، ثم حرك الماوس فوق الصورة. ستظهر لك عدسة مكبرة تساعدك على اختيار البيكسل المطلوب بدقة متناهية."
  }
];

export default function ColorExtractorTool() {
  const { showTutorial, setShowTutorial, showHelp, setShowHelp } = useToolOnboarding('color-extractor');
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const fileInputRef = useRef(null);

  const {
    palette, setPalette,
    colorCount, setColorCount,
    quality, setQuality,
    isExtracting, handleExtract,
    activeTool, setActiveTool,
    zoom, setZoom,
    pan, setPan,
    pickerPos,
    imgElement,
    canvasRef, containerRef, zoomCanvasRef,
    stateRef,
    fitToScreen,
    handleCanvasMouseMove,
    handleCanvasClick
  } = useColorExtractor({ activeIndex, files, setFiles });

  const activeFile = files[activeIndex] || null;

  // Spacebar listener
  useEffect(() => {
    const down = (e) => { if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); } };
    const up = (e) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleAddFiles = (newFiles) => {
    const promises = Array.from(newFiles).map(file => {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            originalWidth: img.width,
            originalHeight: img.height,
            previewUrl: url,
            extractedPalette: null
          });
        };
        img.src = url;
      });
    });

    Promise.all(promises).then(newObjs => {
      setFiles(prev => [...prev, ...newObjs]);
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const exportPalette = (type) => {
    let content = '';
    const name = activeFile?.name.split('.')[0] || 'palette';
    
    if (type === 'css') {
      content = ':root {\n' + palette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n') + '\n}';
    } else if (type === 'json') {
      content = JSON.stringify(palette, null, 2);
    } else if (type === 'sass') {
      content = palette.map((c, i) => `$color-${i + 1}: ${c};`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-palette.${type === 'json' ? 'json' : type === 'sass' ? 'scss' : 'css'}`;
    a.click();
    setShowExportMenu(false);
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'pan' || isSpacePressed || e.button === 1) {
      stateRef.current.isPanning = true;
      stateRef.current.startX = e.clientX;
      stateRef.current.startY = e.clientY;
      stateRef.current.initialPanX = pan.x;
      stateRef.current.initialPanY = pan.y;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <Sidebar 
          fileInputRef={fileInputRef} handleAddFiles={handleAddFiles}
          colorCount={colorCount} setColorCount={setColorCount}
          quality={quality} setQuality={setQuality}
          handleExtract={handleExtract} isExtracting={isExtracting}
          imgElement={imgElement} palette={palette}
          showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu}
          exportPalette={exportPalette}
          setShowTutorial={setShowTutorial}
          setShowHelp={setShowHelp}
        />

        <div className={styles.rightContent}>
          <div className={styles.topSection}>
            <div className={styles.workspaceWrapper}>
              <FloatingToolbar 
                activeTool={activeTool} setActiveTool={setActiveTool}
                fitToScreen={fitToScreen} setZoom={setZoom}
                hasCells={!!activeFile} simpleMode={true} color="var(--c4)"
                isSpacePressed={isSpacePressed}
              />
              
              <CanvasArea 
                containerRef={containerRef} handleMouseDown={handleMouseDown}
                setZoom={setZoom} activeFile={activeFile} fileInputRef={fileInputRef}
                pan={pan} zoom={zoom} handleCanvasMouseMove={(e) => handleCanvasMouseMove(e, isSpacePressed)}
                handleCanvasClick={handleCanvasClick} canvasRef={canvasRef}
                pickerPos={pickerPos} zoomCanvasRef={zoomCanvasRef}
              />
            </div>

            <PaletteGrid 
              palette={palette} setPalette={setPalette}
              copyStatus={copyStatus} copyToClipboard={copyToClipboard}
            />
          </div>

          <ThumbnailsBar 
            files={files} activeIndex={activeIndex} setActiveIndex={setActiveIndex}
            setFiles={setFiles} fileInputRef={fileInputRef}
          />
        </div>
      </div>

      <GenericTutorial show={showTutorial} onClose={() => setShowTutorial(false)} steps={colorTutorialSteps} />
      <GenericHelpModal show={showHelp} onClose={() => setShowHelp(false)} title="دليل مستخرج الألوان" sections={colorHelpSections} />
    </div>
  );
}
