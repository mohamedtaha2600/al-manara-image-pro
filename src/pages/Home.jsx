import { Home as HomeIcon, Scissors, Minimize2, RefreshCw, Maximize, Droplet, Layers, Palette, Search } from 'lucide-react';
import styles from './Home.module.css';

export default function Home({ openTab }) {
  
  const handleOpen = (tool) => {
    openTab(tool);
  };

  return (
    <div className={styles.homeContainer}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>أدوات احترافية<br />في مكان واحد</h1>
        <p className={styles.heroP}>معالجة الصور والملفات بسرعة وسهولة — لا تحميل، لا تسجيل، خصوصيتك محفوظة</p>
      </section>

      <section className={styles.toolsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>اختر أداتك</h2>
          <p className={styles.sectionP}>كل أداة مصممة بعناية لتوفر أفضل تجربة استخدام</p>
          <div className={styles.sectionLine}></div>
        </div>

        <div className={styles.toolsGrid}>
          {/* Tool 1 */}
          <div 
            onClick={() => handleOpen({ id: 'grid-splitter', title: 'قاطع الشبكة', iconName: 'scissors' })} 
            style={{'--tool-color': 'var(--c1)'}} 
            className={styles.toolCard}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }}
          >
            <div className={styles.toolBadge}>الأكثر استخداماً</div>
            <div className={styles.toolIcon}><Scissors size={28} /></div>
            <div className={styles.toolName}>قاطع الشبكة الاحترافي</div>
            <div className={styles.toolDesc}>قسّم أي صورة لشبكة من القطع بدقة مطلقة مع تعديل يدوي للحدود وتصدير فوري</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>تعديل يدوي</span>
              <span className={styles.featureTag}>تصدير دفعي</span>
            </div>
          </div>

          {/* Tool 2: Image Compressor */}
          <div 
            onClick={() => handleOpen({ id: 'image-compressor', title: 'ضاغط الصور', iconName: 'minimize' })} 
            style={{'--tool-color': 'var(--c2)'}} 
            className={styles.toolCard}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }}
          >
            <div className={styles.toolBadge}>شائع</div>
            <div className={styles.toolIcon}><Minimize2 size={28} /></div>
            <div className={styles.toolName}>ضاغط الصور الذكي</div>
            <div className={styles.toolDesc}>قلّل حجم صورك بنسبة تصل لـ 90% مع التحكم الدقيق في الجودة ومقارنة فورية</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>WebP & JPEG</span>
              <span className={styles.featureTag}>مقارنة مباشرة</span>
            </div>
          </div>

          {/* Other Tools */}
          <div 
            onClick={() => handleOpen({ id: 'image-converter', title: 'محول الصور', iconName: 'refresh' })} 
            style={{'--tool-color': 'var(--c3)'}} 
            className={styles.toolCard}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }}
          >
            <div className={styles.toolBadge}>سريع</div>
            <div className={styles.toolIcon}><RefreshCw size={28} /></div>
            <div className={styles.toolName}>محوّل صيغ الصور العالمي</div>
            <div className={styles.toolDesc}>تحويل فوري بين جميع صيغ الصور والفيديو لـ GIF مع إعدادات متقدمة</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>PNG, JPG, WebP</span>
              <span className={styles.featureTag}>Video to GIF</span>
            </div>
          </div>
          <div 
            onClick={() => handleOpen({ id: 'image-resizer', title: 'مغير الأبعاد', iconName: 'maximize' })} 
            style={{'--tool-color': 'var(--c4)'}} 
            className={styles.toolCard}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }}
          >
            <div className={styles.toolIcon}><Maximize size={28} /></div>
            <div className={styles.toolName}>مغيّر الأبعاد والقص الاحترافي</div>
            <div className={styles.toolDesc}>تغيير حجم الصور بنسب محددة أو مخصصة مع معالجة دفعية فائقة السرعة</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>Batch Resize</span>
              <span className={styles.featureTag}>Aspect Ratio</span>
            </div>
          </div>
          <div 
            onClick={() => handleOpen({ id: 'watermark-adder', title: 'علامة مائية', iconName: 'droplet' })} 
            style={{'--tool-color': 'var(--c5)'}} 
            className={styles.toolCard}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }}
          >
            <div className={styles.toolIcon}><Droplet size={28} /></div>
            <div className={styles.toolName}>إضافة علامة مائية</div>
            <div className={styles.toolDesc}>أضف نص أو صورة كعلامة مائية مع التحكم الكامل في الموضع بنظام "لايت روم"</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>Guides</span>
              <span className={styles.featureTag}>Anchors</span>
            </div>
          </div>
          <div 
            onClick={() => handleOpen({ id: 'image-merger', title: 'دامج الصور', iconName: 'layers' })} 
            style={{'--tool-color': 'var(--c6)'}} 
            className={styles.toolCard}
          >
            <div className={styles.toolBadge}>جديد</div>
            <div className={styles.toolIcon}><Layers size={28} /></div>
            <div className={styles.toolName}>دامج الصور الاحترافي</div>
            <div className={styles.toolDesc}>دمج صور متعددة جنباً لجنب أو فوق بعض أو في تخطيط شبكي بدقة عالية</div>
            <div className={styles.toolFeatures}>
              <span className={styles.featureTag}>سحب وإفلات</span>
              <span className={styles.featureTag}>تخطيط ذكي</span>
            </div>
          </div>
          <ToolCard 
            color="var(--c7)" icon={<Palette size={28} />} name="مستخرج لوحة الألوان" 
            desc="استخرج الألوان المهيمنة من أي صورة وصدّرها بصيغ HEX وRGB" 
          />
          <ToolCard 
            color="var(--c8)" icon={<Search size={28} />} name="كاشف البيانات EXIF" 
            desc="اعرض كل البيانات المخفية في صورتك من موديل الكاميرا للموقع" 
          />
        </div>
      </section>
    </div>
  );
}

function ToolCard({ color, icon, name, desc, badge, features }) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div style={{'--tool-color': color}} className={styles.toolCard} onMouseMove={handleMouseMove}>
      {badge && <div className={styles.toolBadge}>{badge}</div>}
      <div className={styles.toolIcon}>{icon}</div>
      <div className={styles.toolName}>{name}</div>
      <div className={styles.toolDesc}>{desc}</div>
      <div className={styles.toolFeatures}>
        {features ? features.map(f => <span key={f} className={styles.featureTag}>{f}</span>) : <span className={styles.featureTag}>قريباً</span>}
      </div>
    </div>
  );
}
