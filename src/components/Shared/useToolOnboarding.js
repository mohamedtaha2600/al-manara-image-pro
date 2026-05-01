import { useState, useEffect } from 'react';

export function useToolOnboarding(toolId) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(`almanara_tutorial_${toolId}`);
    if (!hasSeen) {
      setShowTutorial(true);
      localStorage.setItem(`almanara_tutorial_${toolId}`, 'true');
    }
  }, [toolId]);

  return {
    showTutorial,
    setShowTutorial,
    showHelp,
    setShowHelp
  };
}
