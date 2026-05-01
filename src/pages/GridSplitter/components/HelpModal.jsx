import { X, Info, MousePointer2, Hand, Scissors } from 'lucide-react';
import styles from './HelpModal.module.css';

export default function HelpModal({ onClose }) {
  return (
    <div className={styles.helpModalOverlay} onClick={onClose}>
      <div className={styles.helpModal} onClick={e => e.stopPropagation()}>
        <div className={styles.helpModalHeader}>
          <h3><Info size={22} className={styles.helpIcon} /> دليل استخدام قاطع الشبكة</h3>
          <button className={styles.helpCloseBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.helpModalBody}>
          <div className={styles.helpSection}>
            <h4><MousePointer2 size={16} /> أداة التحديد والقص</h4>
            <p>استخدم الماوس لسحب حواف الخلايا بحرية. تعمل ميزة <strong>المغناطيس الذكي</strong> على محاذاة الخطوط تلقائياً مع الخلايا الأخرى أو حواف الصورة لضمان دقة القص.</p>
          </div>
          
          <div className={styles.helpSection}>
            <h4><Hand size={16} /> أداة التحريك (الهاند)</h4>
            <p>تسمح لك بالتجول داخل الصورة بحرية تامة خاصة عند عمل <strong>تكبير (Zoom)</strong> باستخدام بكرة الماوس. (يمكنك أيضاً الضغط مع الاستمرار على زر <code>Space</code> أو البكرة <code>Middle Click</code> للتفعيل المؤقت).</p>
          </div>

          <div className={styles.helpSection}>
            <h4><Scissors size={16} /> التعديل الدقيق</h4>
            <ul>
              <li><strong>إلغاء المغناطيس:</strong> استمر بالضغط على زر <code>Alt</code> أثناء سحب الحواف لإلغاء المغناطيس مؤقتاً لضبط الحواف بحرية تامة.</li>
              <li><strong>إضافة/حذف خلية:</strong> اضغط <code>كليك يمين</code> بالماوس على أي مساحة فارغة لتقسيمها، أو على خلية موجودة لحذفها.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
