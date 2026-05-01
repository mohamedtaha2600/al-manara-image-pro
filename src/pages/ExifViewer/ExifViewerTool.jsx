import { useState, useRef, useMemo } from 'react';
import styles from './ExifViewer.module.css';
import { 
  Search, Upload, Info, Camera, MapPin, Calendar, 
  Maximize2, Trash2, Aperture, Clock, Zap, Cpu, Settings, FileText, Download, Play, Globe 
} from 'lucide-react';
import { extractExif, formatExifData } from './utils/exifUtils';

// Shared components
import GenericTutorial from '../../components/Shared/GenericTutorial';
import GenericHelpModal from '../../components/Shared/GenericHelpModal';
import { useToolOnboarding } from '../../components/Shared/useToolOnboarding';

const exifTutorialSteps = [
  {
    title: "مرحباً بك في كاشف بيانات EXIF!",
    content: "هذه الأداة تتيح لك رؤية البيانات المخفية داخل صورك، مثل نوع الكاميرا، الموضع، والإعدادات التقنية.",
    icon: <Search size={40} color="var(--c1)" />
  },
  {
    title: "تحميل الصور",
    content: "ارفع صورة واحدة أو أكثر. سيتم عرض بيانات كل صورة فور اختيارها من شريط الصور السفلي.",
    icon: <Upload size={40} color="var(--c2)" />
  },
  {
    title: "بيانات الموقع (GPS)",
    content: "إذا كانت الصورة تحتوي على إحداثيات، ستظهر لك أيقونة الموقع مع رابط مباشر لمشاهدتها على الخريطة.",
    icon: <MapPin size={40} color="var(--c1)" />
  },
  {
    title: "المعلومات التقنية",
    content: "تصفح القائمة الجانبية لرؤية موديل العدسة، سرعة الغالق، والبرنامج المستخدم في تعديل الصورة.",
    icon: <Camera size={40} color="var(--c3)" />
  }
];

const exifHelpSections = [
  {
    title: "ما هي بيانات EXIF؟",
    icon: <FileText size={18} />,
    content: "هي بيانات وصفية يتم تخزينها تلقائياً عند التقاط الصورة، تشمل تفاصيل فنية عن الكاميرا وظروف التصوير."
  },
  {
    title: "خصوصية الموقع",
    icon: <Globe size={18} />,
    content: "بعض الكاميرات والهواتف تخزن موقعك الجغرافي. نستخدم هذه البيانات لعرضها لك فقط، ولا يتم تخزينها على خوادمنا."
  },
  {
    title: "دعم الصيغ",
    icon: <Settings size={18} />,
    content: "ندعم حالياً استخراج البيانات من ملفات JPEG و JPG و WebP. قد تختلف كمية البيانات المتاحة حسب المصدر."
  }
];

export default function ExifViewerTool() {
  const fileInputRef = useRef(null);
  const { showTutorial, setShowTutorial, showHelp, setShowHelp } = useToolOnboarding('exif-viewer');
  
  const [images, setImages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newImages = await Promise.all(files.map(async file => {
      let metadata = { 
        model: 'غير معروف', make: '-', iso: '-', aperture: '-', 
        shutter: '-', focal: '-', date: '-', resolution: '-',
        software: '-', exposureBias: '-', lensModel: '-' 
      };
      
      try {
        const rawExif = await extractExif(file);
        if (rawExif) metadata = formatExifData(rawExif);
      } catch (err) {
        console.error("EXIF Error:", err);
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type.split('/')[1]?.toUpperCase() || 'IMG',
        preview: URL.createObjectURL(file),
        metadata
      };
    }));

    setImages(prev => [...prev, ...newImages]);
    if (!activeId && newImages.length > 0) setActiveId(newImages[0].id);
    setIsProcessing(false);
  };

  const filteredImages = useMemo(() => {
    return images.filter(img => 
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.metadata.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  const activeImage = images.find(img => img.id === activeId);

  return (
    <div className={styles.container}>
      
      {/* Workspace (Center) */}
      <div className={styles.workspace}>
        {images.length === 0 ? (
          <div className={styles.emptyState}>
            <label className={styles.uploadBox}>
              <input type="file" multiple accept="image/*" style={{display: 'none'}} onChange={handleUpload} />
              <Upload size={60} color="var(--c1)" style={{marginBottom: '20px'}} />
              <h2>اسحب الصور هنا أو انقر للرفع</h2>
              <p>سنقوم باستخراج كافة البيانات المخفية (EXIF) لصورك</p>
            </label>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <button className={styles.toolBtn} title="إضافة صور">
                <label style={{cursor: 'pointer', display: 'flex'}}>
                  <input type="file" multiple accept="image/*" style={{display: 'none'}} onChange={handleUpload} />
                  <Upload size={20} />
                </label>
              </button>
              <button className={styles.toolBtn} title="مسح الكل" onClick={() => { setImages([]); setActiveId(null); }}>
                <Trash2 size={20} />
              </button>
            </div>

            <div className={styles.viewerArea}>
              {activeImage && (
                <img src={activeImage.preview} className={styles.mainPreview} alt="Viewer" />
              )}
            </div>

            {/* Bottom Gallery */}
            <div className={styles.bottomBar}>
              {filteredImages.map(img => (
                <div 
                  key={img.id} 
                  className={`${styles.thumbCard} ${img.id === activeId ? styles.active : ''}`}
                  onClick={() => setActiveId(img.id)}
                >
                  <img src={img.preview} className={styles.thumbImg} alt="" />
                  <div className={styles.thumbInfo}>{img.name}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sidebar (Right) */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
            <button onClick={() => setShowTutorial(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
              <Play size={14} color="var(--c1)" /> الشرح التفاعلي
            </button>
            <button onClick={() => setShowHelp(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
              <Info size={14} color="var(--c1)" /> التعليمات
            </button>
          </div>

          <div className={styles.sectionTitle}>
            <Search size={16} /> البحث والفلترة
          </div>
          <div style={{position: 'relative', marginBottom: '25px'}}>
            <Search style={{position: 'absolute', right: '12px', top: '10px', color: 'var(--text-dim)'}} size={16} />
            <input 
              type="text" 
              placeholder="ابحث في اسم الصورة أو الموديل..." 
              className={styles.searchInput}
              style={{width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '10px 40px 10px 10px', borderRadius: '10px', color: '#fff', outline: 'none'}}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.sectionTitle}>
            <Info size={16} /> بيانات الصورة الأساسية
          </div>
          
          {activeImage ? (
            <div className={styles.dataGrid}>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Cpu size={14} /> الكاميرا</div>
                <div className={styles.dataValue}>{activeImage.metadata.make} {activeImage.metadata.model}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Aperture size={14} /> العدسة</div>
                <div className={styles.dataValue}>{activeImage.metadata.lensModel}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Maximize2 size={14} /> الأبعاد</div>
                <div className={styles.dataValue}>{activeImage.metadata.resolution}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Settings size={14} /> الصيغة والحجم</div>
                <div className={styles.dataValue}>{activeImage.type} - {activeImage.size}</div>
              </div>
              
              <div style={{marginTop: '15px'}} className={styles.sectionTitle}>
                <Zap size={16} /> إعدادات التصوير
              </div>
              
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Zap size={14} /> ISO</div>
                <div className={`${styles.dataValue} ${styles.highlight}`}>{activeImage.metadata.iso}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Aperture size={14} /> فتحة العدسة</div>
                <div className={`${styles.dataValue} ${styles.highlight}`}>{activeImage.metadata.aperture}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Clock size={14} /> سرعة الغالق</div>
                <div className={`${styles.dataValue} ${styles.highlight}`}>{activeImage.metadata.shutter}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Maximize2 size={14} /> البعد البؤري</div>
                <div className={styles.dataValue}>{activeImage.metadata.focal}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Info size={14} /> تعويض التعريض</div>
                <div className={styles.dataValue}>{activeImage.metadata.exposureBias}</div>
              </div>

              <div style={{marginTop: '15px'}} className={styles.sectionTitle}>
                <Calendar size={16} /> التاريخ والموقع
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><Calendar size={14} /> التاريخ</div>
                <div className={styles.dataValue}>{activeImage.metadata.date}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><FileText size={14} /> البرنامج</div>
                <div className={styles.dataValue}>{activeImage.metadata.software}</div>
              </div>
              <div className={styles.dataItem}>
                <div className={styles.dataLabel}><MapPin size={14} /> الموقع (GPS)</div>
                <div className={styles.dataValue} style={{fontSize: '0.75rem', color: 'var(--c1)'}}>{activeImage.metadata.gps}</div>
              </div>
            </div>
          ) : (
            <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-dim)'}}>
              <Info size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
              <p>اختر صورة لعرض بياناتها</p>
            </div>
          )}
        </div>
      </div>

      <GenericTutorial show={showTutorial} onClose={() => setShowTutorial(false)} steps={exifTutorialSteps} />
      <GenericHelpModal show={showHelp} onClose={() => setShowHelp(false)} title="دليل كاشف بيانات EXIF" sections={exifHelpSections} />
    </div>
  );
}
