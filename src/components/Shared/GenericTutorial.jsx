import { useState } from 'react';
import styles from './Shared.module.css';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function GenericTutorial({ show, onClose, steps }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!show || !steps || steps.length === 0) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else {
      setCurrentStep(0);
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = steps[currentStep];

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialBubble}>
        <button className={styles.tutorialCloseBtn} onClick={onClose}><X size={18} /></button>
        
        <div className={styles.tutorialIconBox}>
          {step.icon}
        </div>

        <div className={styles.tutorialContent}>
          <h3 className={styles.tutorialTitle}>{step.title}</h3>
          <p className={styles.tutorialText}>{step.content}</p>
        </div>

        <div className={styles.tutorialFooter}>
          <div className={styles.tutorialDots}>
            {steps.map((_, i) => (
              <div key={i} className={`${styles.tutorialDot} ${i === currentStep ? styles.tutorialActiveDot : ''}`} />
            ))}
          </div>
          
          <div className={styles.tutorialActions}>
            {currentStep > 0 && (
              <button className={styles.tutorialPrevBtn} onClick={prevStep}>
                <ChevronRight size={18} /> {/* Flipped for RTL */}
                السابق
              </button>
            )}
            <button className={styles.tutorialNextBtn} onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}
              <ChevronLeft size={18} /> {/* Flipped for RTL */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
