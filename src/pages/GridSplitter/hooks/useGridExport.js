import JSZip from 'jszip';

export function useGridExport({ img, cells, prefix, namingType, exportFormat, isZip, setIsDownloading, setStatusMsg, contextMenu, setContextMenu }) {
  
  const downloadFile = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async (overrideZip = null) => {
    const finalIsZip = overrideZip !== null ? overrideZip : isZip;
    if(!img || cells.length === 0) return;
    setIsDownloading(true);
    setStatusMsg(finalIsZip ? "جاري تحضير ملف ZIP..." : "جاري تنزيل الملفات تباعاً...");

    const pfx = prefix || "split";
    const zip = finalIsZip ? new JSZip() : null;
    const format = exportFormat || 'png';
    const mime = `image/${format === 'jpg' ? 'jpeg' : format}`;
    const ext = format;

    const arabicAlphabet = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      let label = (i + 1).toString().padStart(2, '0');
      if (namingType === 'letters') label = String.fromCharCode(65 + (i % 26));
      else if (namingType === 'arabic') label = arabicAlphabet[i % arabicAlphabet.length];
      
      const temp = document.createElement('canvas');
      temp.width = cell.w; temp.height = cell.h;
      const tCtx = temp.getContext('2d');
      tCtx.drawImage(img, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
      
      if (finalIsZip) {
        const blob = await new Promise(res => temp.toBlob(res, mime));
        zip.file(`${pfx}_${label}.${ext}`, blob);
      } else {
        downloadFile(temp.toDataURL(mime), `${pfx}_${label}.${ext}`);
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (finalIsZip) {
      const content = await zip.generateAsync({type: "blob"});
      const url = URL.createObjectURL(content);
      downloadFile(url, `${pfx}_export.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    setIsDownloading(false);
    setStatusMsg("اكتمل التصدير بنجاح! ✅");
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const downloadSingle = () => {
    const cell = contextMenu?.cell;
    if(!cell || !img) return;
    const temp = document.createElement('canvas');
    temp.width = cell.w; temp.height = cell.h;
    temp.getContext('2d').drawImage(img, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
    
    const format = exportFormat || 'png';
    const mime = `image/${format === 'jpg' ? 'jpeg' : format}`;
    downloadFile(temp.toDataURL(mime), `${prefix || 'cell'}_export.${format}`);
    setContextMenu({ ...contextMenu, visible: false });
  };

  return { handleDownloadAll, downloadSingle };
}
