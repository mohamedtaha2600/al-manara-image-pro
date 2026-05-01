import { useState, useCallback, useEffect, useRef } from 'react';
import { initGridCoords } from '../utils/gridUtils';

export function useGridState() {
  const [img, setImg] = useState(null);
  const [imgInfo, setImgInfo] = useState('لم يتم تحميل صورة');
  const [library, setLibrary] = useState([]);
  const [cells, setCells] = useState([]);
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [prefix, setPrefix] = useState('');
  const [namingType, setNamingType] = useState('numbers');
  const [exportFormat, setExportFormat] = useState('png');
  const [isZip, setIsZip] = useState(true);
  const [globalPadding, setGlobalPadding] = useState({ x: 0, y: 0 });
  const [skipManual, setSkipManual] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const showStatus = useCallback((msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const item = { id: Date.now() + Math.random(), img: tempImg, url: ev.target.result, name: file.name, w: tempImg.width, h: tempImg.height };
        setLibrary(prev => [...prev, item]);
        
        // If first image, set as main
        setImg(prev => {
          if (!prev) {
            setImgInfo(`${tempImg.width}x${tempImg.height}px`);
            setPrefix(file.name.split('.')[0]);
            const fmt = file.type.split('/')[1] || 'png';
            setExportFormat(fmt === 'jpeg' ? 'jpg' : fmt);
            setCells(initGridCoords(tempImg, cols, rows));
            return tempImg;
          }
          return prev;
        });
      };
      tempImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [cols, rows]);

  // Sync grid when rows/cols change
  useEffect(() => {
    if (img) {
      setCells(initGridCoords(img, cols, rows));
    }
  }, [cols, rows, img]);

  return {
    img, setImg, imgInfo, setImgInfo, library, setLibrary, cells, setCells,
    cols, setCols, rows, setRows, prefix, setPrefix, namingType, setNamingType,
    exportFormat, setExportFormat, isZip, setIsZip, globalPadding, setGlobalPadding,
    skipManual, setSkipManual, statusMsg, setStatusMsg, showStatus, handleFile
  };
}
