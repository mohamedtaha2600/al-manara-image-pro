import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointer2, Hand, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import styles from './ImageSlider.module.css';

export default function ImageSlider({ before, after, activeTool = 'select' }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(0.7);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFlashing, setIsFlashing] = useState(false);

  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const resetView = () => {
    setZoom(0.7);
    setOffset({ x: 0, y: 0 });
  };

  // --- Wheel Zoom ---
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 10));
  };

  const handleMove = useCallback((e) => {
    if (isResizing) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
      let position = ((clientX - rect.left) / rect.width) * 100;
      
      if (position < 2) position = 0;
      if (position > 98) position = 100;
      
      const clampedPos = Math.min(Math.max(position, 0), 100);
      setSliderPos(clampedPos);
      if (containerRef.current) {
        containerRef.current.style.setProperty('--slider-pos', `${clampedPos}%`);
      }
    } else if (activeTool === 'pan' && isDragging) {
      const clientX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
      const clientY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;
      setOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    }
  }, [isResizing, activeTool, isDragging, dragStart]);

  const handleMouseDown = (e) => {
    if (activeTool === 'pan') {
      setIsDragging(true);
      const clientX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
      const clientY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;
      setDragStart({
        x: clientX - offset.x,
        y: clientY - offset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className={`${styles.canvasWrapper} ${activeTool === 'pan' ? styles.handToolActive : ''} ${isDragging ? styles.isDragging : ''}`}>
      {/* 🛠️ Vertical Toolbar */}
      {/* Toolbar removed to simplify UI as requested */}

      <div 
        className={styles.canvasContainer} 
        ref={stageRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <div className={styles.stageFrame}>
          <div 
            className={styles.imageStage}
            style={{ 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          >
            <div 
              className={styles.imageWrapper} 
              ref={containerRef}
              style={{ '--slider-pos': `${sliderPos}%` }}
            >
              <img src={after} className={styles.sliderImg} alt="After" />
              <img 
                src={before} 
                className={`${styles.sliderImg} ${styles.overlayImg}`} 
                alt="Before" 
              />
              
              <div 
                className={styles.handle} 
                style={{ 
                  transform: `translateX(-50%) scale(${1/zoom})`
                }}
              >
                <div className={styles.handleLine} />
                <div className={styles.handleCircle} onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                }}>
                  <span>↔</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.badge}>الأصلية</div>
        <div className={styles.afterBadge}>المضغوطة</div>
        <div className={styles.zoomIndicator}>الزوم: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}
