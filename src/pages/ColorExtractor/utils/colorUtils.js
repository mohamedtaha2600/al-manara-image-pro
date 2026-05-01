/**
 * Extract dominant colors from an image using canvas
 * @param {HTMLImageElement} img 
 * @param {number} colorCount 
 * @param {number} quality 
 * @returns {Promise<string[]>} Array of HEX colors
 */
export async function extractColors(img, colorCount = 6, quality = 10) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Resize for faster processing
  const maxDim = 200;
  let w = img.width;
  let h = img.height;
  if (w > h) {
    if (w > maxDim) {
      h *= maxDim / w;
      w = maxDim;
    }
  } else {
    if (h > maxDim) {
      w *= maxDim / h;
      h = maxDim;
    }
  }
  
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  
  const imageData = ctx.getImageData(0, 0, w, h).data;
  const pixels = [];
  
  for (let i = 0; i < imageData.length; i += 4 * quality) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    // Skip transparent or near-transparent pixels
    if (a < 125) continue;
    
    pixels.push([r, g, b]);
  }
  
  // Simple k-means implementation
  const centroids = kMeans(pixels, colorCount);
  return centroids.map(c => rgbToHex(c[0], c[1], c[2]));
}

function kMeans(pixels, k, iterations = 10) {
  if (pixels.length === 0) return [];
  
  // Initial centroids: random selection from pixels
  let centroids = [];
  for (let i = 0; i < k; i++) {
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }
  
  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    
    // Assign pixels to nearest centroid
    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - centroids[i][0], 2) +
          Math.pow(pixel[1] - centroids[i][1], 2) +
          Math.pow(pixel[2] - centroids[i][2], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      clusters[closestIdx].push(pixel);
    }
    
    // Update centroids
    const nextCentroids = [];
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) {
        nextCentroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
        continue;
      }
      const sum = clusters[i].reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
      nextCentroids.push([
        Math.round(sum[0] / clusters[i].length),
        Math.round(sum[1] / clusters[i].length),
        Math.round(sum[2] / clusters[i].length)
      ]);
    }
    
    // Check for convergence
    if (JSON.stringify(centroids) === JSON.stringify(nextCentroids)) break;
    centroids = nextCentroids;
  }
  
  return centroids;
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

export function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
