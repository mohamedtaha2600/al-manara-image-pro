import { Plus, DownloadCloud, Trash2, MousePointer2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import styles from './ContextMenu.module.css';

export default function ContextMenu({
  contextMenu,
  setContextMenu,
  addCellHere,
  downloadSingle,
  deleteCell,
  openInViewer,
  previewMode,
  handleResetCell
}) {
  if (!contextMenu.visible) return null;

  return (
    <div 
      className={styles.contextMenu}
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.isEmpty ? (
        <div className={styles.menuItem} onClick={addCellHere}>
          <Plus size={16} color="var(--c1)" /> إضافة خلية هنا
        </div>
      ) : (
        <>
          <div className={styles.menuItem} onClick={openInViewer}>
            {previewMode ? (
              <><EyeOff size={16} /> الخروج من عارض الصور</>
            ) : (
              <><Eye size={16} /> فتح في عارض الصور</>
            )}
          </div>
          <div className={styles.menuItem} onClick={() => handleResetCell(contextMenu.cell.id)}>
            <RotateCcw size={16} /> إعادة تعيين مقاس الخلية
          </div>
          <div className={styles.menuItem} onClick={downloadSingle}>
            <DownloadCloud size={16} /> تنزيل هذه القطعة
          </div>
          <div className={styles.menuItemDanger} onClick={deleteCell}>
            <Trash2 size={16} /> حذف هذه الخلية
          </div>
        </>
      )}
      <div 
        className={styles.menuItem} 
        onClick={() => setContextMenu({ ...contextMenu, visible: false })} 
        style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '8px' }}
      >
        <MousePointer2 size={16} /> إلغاء
      </div>
    </div>
  );
}
