import { X, Info } from 'lucide-react';
import styles from './Shared.module.css';

export default function GenericHelpModal({ show, onClose, title, sections }) {
  if (!show) return null;

  return (
    <div className={styles.helpModalOverlay} onClick={onClose}>
      <div className={styles.helpModal} onClick={e => e.stopPropagation()}>
        <div className={styles.helpHeader}>
          <h3><Info size={22} /> {title || 'دليل الاستخدام'}</h3>
          <button className={styles.helpCloseBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.helpBody}>
          {sections && sections.map((section, idx) => (
            <div key={idx} className={styles.helpSection}>
              <h4>{section.icon} {section.title}</h4>
              <p>{section.content}</p>
              {section.list && (
                <ul>
                  {section.list.map((item, lIdx) => (
                    <li key={lIdx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
