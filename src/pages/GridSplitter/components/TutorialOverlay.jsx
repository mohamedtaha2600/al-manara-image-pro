import { useState, useEffect } from 'react';
import styles from './TutorialOverlay.module.css';
import { ChevronRight, ChevronLeft, X, MousePointer2, Grid, Download, Eye } from 'lucide-react';

const steps = [
  {
    title: "مرحباً بك في قاطع الشبكة الذكي!",
    content: "هذا الدليل سيأخذك في جولة سريعة لتعلم كيفية استخدام الأداة باحترافية.",
    target: "sidebar",
    icon: <Grid size={40} color="var(--c1)" />
  },
  {
    title: "تحميل الصورة",
    content: "ابدأ بسحب وإفلات صورتك هنا أو اضغط لاختيار ملف من جهازك.",
    target: "upload",
    icon: <Download size={40} color="var(--c2)" />
  },
  {
    title: "ضبط الشبكة الأساسية",
    content: "حدد عدد الصفوف والأعمدة التي تريد تقسيم الصورة إليها من هنا.",
    target: "grid-settings",
    icon: <Grid size={40} color="var(--c1)" />
  },
  {
    title: "التحكم في الحدود (القص)",
    content: "يمكنك سحب حواف أي خلية لتعديل مقاسها بدقة. ميزة المغناطيس الذكي ستساعدك على المحاذاة التلقائية.",
    target: "canvas",
    icon: <MousePointer2 size={40} color="var(--c1)" />
  },
  {
    title: "خيارات إضافية",
    content: "استخدم القائمة الجانبية لإضافة هوامش (Padding) لجميع الخلايا مرة واحدة أو إعادة تعيين كل شيء.",
    target: "options",
    icon: <Grid size={40} color="var(--c3)" />
  },
  {
    title: "معاينة وتصدير",
    content: "عاين النتيجة النهائية لكل خلية ثم حملها كملف ZIP واحد أو صور منفصلة.",
    target: "download",
    icon: <Download size={40} color="var(--c1)" />
  }
];

export default function TutorialOverlay({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.bubble}>
        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        
        <div className={styles.iconBox}>
          {steps[currentStep].icon}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{steps[currentStep].title}</h3>
          <p className={styles.text}>{steps[currentStep].content}</p>
        </div>

        <div className={styles.footer}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <div key={i} className={`${styles.dot} ${i === currentStep ? styles.activeDot : ''}`} />
            ))}
          </div>
          
          <div className={styles.actions}>
            {currentStep > 0 && (
              <button className={styles.prevBtn} onClick={prevStep}>
                السابق
                <ChevronLeft size={18} />
              </button>
            )}
            <button className={styles.nextBtn} onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
