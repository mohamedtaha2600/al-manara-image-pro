import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GridSplitter from './pages/GridSplitter/GridSplitterTool';
import ImageCompressor from './pages/ImageCompressor/ImageCompressorTool';
import ImageConverter from './pages/ImageConverter/ImageConverterTool';
import ImageResizer from './pages/ImageResizer/ImageResizerTool';
import WatermarkTool from './pages/Watermark/WatermarkTool';
import ImageMergerTool from './pages/ImageMerger/ImageMergerTool';

function App() {
  // Initialize state from LocalStorage or default
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = localStorage.getItem('almanara_tabs');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [{ id: 'home', title: 'الرئيسية', iconName: 'home' }];
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('almanara_activeTab') || 'home';
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('almanara_tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('almanara_activeTab', activeTab);
  }, [activeTab]);

  const openTab = (tool) => {
    // If tool already open, just switch to it
    if (!tabs.find(t => t.id === tool.id)) {
      setTabs([...tabs, { id: tool.id, title: tool.title, iconName: tool.iconName }]);
    }
    setActiveTab(tool.id);
  };

  const closeTab = (id, e) => {
    if(e) e.stopPropagation();
    if (id === 'home') return; // Cannot close home
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Unified Navbar with Tabs */}
      <Navbar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} closeTab={closeTab} />
      
      <div className="tab-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* We use display: block/none to preserve the state of components */}
        <div style={{ display: activeTab === 'home' ? 'block' : 'none', height: '100%' }}>
          <Home openTab={openTab} />
        </div>
        
        {tabs.some(t => t.id === 'grid-splitter') && (
          <div style={{ display: activeTab === 'grid-splitter' ? 'block' : 'none', height: '100%' }}>
            <GridSplitter />
          </div>
        )}

        {tabs.some(t => t.id === 'image-compressor') && (
          <div style={{ display: activeTab === 'image-compressor' ? 'block' : 'none', height: '100%' }}>
            <ImageCompressor />
          </div>
        )}
        
        {tabs.some(t => t.id === 'image-converter') && (
          <div style={{ display: activeTab === 'image-converter' ? 'block' : 'none', height: '100%' }}>
            <ImageConverter />
          </div>
        )}

        {tabs.some(t => t.id === 'image-resizer') && (
          <div style={{ display: activeTab === 'image-resizer' ? 'block' : 'none', height: '100%' }}>
            <ImageResizer />
          </div>
        )}

        {tabs.some(t => t.id === 'watermark-adder') && (
          <div style={{ display: activeTab === 'watermark-adder' ? 'block' : 'none', height: '100%' }}>
            <WatermarkTool />
          </div>
        )}

        {tabs.some(t => t.id === 'image-merger') && (
          <div style={{ display: activeTab === 'image-merger' ? 'block' : 'none', height: '100%' }}>
            <ImageMergerTool />
          </div>
        )}

      </div>
    </div>
  )
}

export default App
