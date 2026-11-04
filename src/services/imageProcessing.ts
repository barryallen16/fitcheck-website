// In-Browser Garment Background Removal & Auto-Centering Engine
// Uses native HTML5 Canvas with border-sampled flood-fill to isolate garments
// Preserves interior garment patterns, prints, and white details without external dependencies.

interface ProcessingOptions {
  tolerance?: number; // Color distance threshold (default 36)
  padding?: number;   // Bounding box padding in pixels (default 12)
  maxDimension?: number; // Max width/height to constrain processing (default 800)
}

/**
 * Isolates a garment from uniform or solid backgrounds and crops to bounding box.
 * Returns transparent PNG data URL, or the original source if background cannot be cleanly separated.
 */
export async function removeGarmentBackground(
  imageSource: string,
  options: ProcessingOptions = {}
): Promise<string> {
  const {
    tolerance = 36,
    padding = 12,
    maxDimension = 800,
  } = options;

  return new Promise((resolve) => {
    // If not in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(imageSource);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          resolve(imageSource);
          return;
        }

        // Scale down if image is excessively large to keep canvas processing sub-20ms
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Step 1: Sample perimeter border pixels to estimate background color
        const samples: [number, number, number][] = [];
        const stepX = Math.max(1, Math.floor(width / 24));
        const stepY = Math.max(1, Math.floor(height / 24));

        for (let x = 0; x < width; x += stepX) {
          const topIdx = x * 4;
          const botIdx = ((height - 1) * width + x) * 4;
          samples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
          samples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
        }
        for (let y = 0; y < height; y += stepY) {
          const leftIdx = (y * width) * 4;
          const rightIdx = (y * width + (width - 1)) * 4;
          samples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
          samples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
        }

        if (samples.length === 0) {
          resolve(imageSource);
          return;
        }

        const bgR = samples.reduce((s, c) => s + c[0], 0) / samples.length;
        const bgG = samples.reduce((s, c) => s + c[1], 0) / samples.length;
        const bgB = samples.reduce((s, c) => s + c[2], 0) / samples.length;

        // Euclidean color distance from background
        const colorDist = (r: number, g: number, b: number) => {
          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        };

        // Step 2: Flood-fill from outer perimeter inwards
        const totalPixels = width * height;
        const visited = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let head = 0;
        let tail = 0;

        const enqueue = (x: number, y: number) => {
          const idx = y * width + x;
          if (visited[idx]) return;
          const pIdx = idx * 4;
          if (colorDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]) <= tolerance) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < width; x++) {
          enqueue(x, 0);
          enqueue(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          enqueue(0, y);
          enqueue(width - 1, y);
        }

        while (head < tail) {
          const curr = queue[head++];
          const cx = curr % width;
          const cy = Math.floor(curr / width);

          if (cx > 0) enqueue(cx - 1, cy);
          if (cx < width - 1) enqueue(cx + 1, cy);
          if (cy > 0) enqueue(cx, cy - 1);
          if (cy < height - 1) enqueue(cx, cy + 1);
        }

        // Step 3: Clear background alpha and find garment bounding box
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let garmentPixels = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const pIdx = idx * 4;

            if (visited[idx]) {
              data[pIdx + 3] = 0; // Alpha 0
            } else {
              garmentPixels++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const garmentRatio = garmentPixels / totalPixels;

        // If flood fill removed almost nothing or consumed the entire image, fallback safely
        if (garmentRatio < 0.05 || garmentRatio > 0.95 || minX > maxX || minY > maxY) {
          resolve(imageSource);
          return;
        }

        // Put isolated pixel data back onto source canvas
        ctx.putImageData(imgData, 0, 0);

        // Step 4: Crop with clean padding
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropW = Math.min(width - cropX, (maxX - minX + 1) + padding * 2);
        const cropH = Math.min(height - cropY, (maxY - minY + 1) + padding * 2);

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');

        if (!cropCtx) {
          resolve(imageSource);
          return;
        }

        cropCtx.drawImage(
          canvas,
          cropX, cropY, cropW, cropH,
          0, 0, cropW, cropH
        );

        resolve(cropCanvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Background removal fallback to original:', err);
        resolve(imageSource);
      }
    };

    img.onerror = () => {
      resolve(imageSource);
    };

    img.src = imageSource;
  });
}
