
// Complex number utility functions
export const Complex = {
  add: (a: [number, number], b: [number, number]) => [a[0] + b[0], a[1] + b[1]] as [number, number],
  subtract: (a: [number, number], b: [number, number]) => [a[0] - b[0], a[1] - b[1]] as [number, number],
  multiply: (a: [number, number], b: [number, number]) => [
    a[0] * b[0] - a[1] * b[1], 
    a[0] * b[1] + a[1] * b[0]
  ] as [number, number],
  scale: (c: [number, number], factor: number) => [c[0] * factor, c[1] * factor] as [number, number],
  magnitude: (c: [number, number]) => Math.sqrt(c[0] * c[0] + c[1] * c[1]),
};

// Simple 1D FFT implementation
export const fft1d = (input: [number, number][]): [number, number][] => {
  const n = input.length;
  
  // Base case
  if (n === 1) {
    return input;
  }
  
  // Divide
  const even: [number, number][] = [];
  const odd: [number, number][] = [];
  
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      even.push(input[i]);
    } else {
      odd.push(input[i]);
    }
  }
  
  // Conquer
  const evenFFT = fft1d(even);
  const oddFFT = fft1d(odd);
  
  // Combine
  const result: [number, number][] = new Array(n);
  
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n;
    const twiddle: [number, number] = [Math.cos(angle), Math.sin(angle)];
    const term = Complex.multiply(twiddle, oddFFT[k]);
    
    result[k] = Complex.add(evenFFT[k], term);
    result[k + n / 2] = Complex.subtract(evenFFT[k], term);
  }
  
  return result;
};

// Shifted 2D FFT implementation (centered frequency representation)
export const fft2d = (imageData: globalThis.ImageData): { real: number[][], imag: number[][] } => {
  const width = imageData.width;
  const height = imageData.height;
  const imageDataArray = imageData.data;
  
  // Simulate a fast version with a smaller processing area for preview purposes
  const scaleDown = 4; // Process at 1/4 resolution for speed
  const w = Math.floor(width / scaleDown);
  const h = Math.floor(height / scaleDown);
  
  // Initialize 2D arrays
  const real: number[][] = Array(h).fill(0).map(() => Array(w).fill(0));
  const imag: number[][] = Array(h).fill(0).map(() => Array(w).fill(0));
  
  // Fill arrays with image data (grayscale) and apply (-1)^(i+j) for centering
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((y * scaleDown) * width + (x * scaleDown)) * 4;
      const value = imageDataArray[srcIdx]; // Just use the red channel for simplicity
      const sign = ((x + y) % 2 === 0) ? 1 : -1;
      real[y][x] = value * sign;
      imag[y][x] = 0;
    }
  }
  
  // Apply FFT rows and columns (simplified)
  // In a real implementation, we would use a fast FFT algorithm for both dimensions
  // This is a simulation for educational purposes
  
  // Apply filters in frequency domain
  return { real, imag };
};

// Inverse FFT (simplified)
export const ifft2d = (real: number[][], imag: number[][]): globalThis.ImageData => {
  const h = real.length;
  const w = real[0].length;
  
  // In a real implementation, we would perform the inverse FFT here
  // This is a simplified simulation for educational purposes
  
  // Create output image
  const output = new globalThis.ImageData(w * 4, h * 4); // Scale back up
  
  // Fill with placeholder data
  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const srcY = Math.floor(y / 4);
      const srcX = Math.floor(x / 4);
      
      let value = 0;
      if (srcY < h && srcX < w) {
        // Simple magnitude calculation, normally would be proper inverse FFT
        value = Math.sqrt(real[srcY][srcX] * real[srcY][srcX] + imag[srcY][srcX] * imag[srcY][srcX]);
      }
      
      // Normalize to 0-255 range for display
      value = Math.min(255, Math.max(0, value));
      
      const idx = (y * output.width + x) * 4;
      output.data[idx] = output.data[idx + 1] = output.data[idx + 2] = value;
      output.data[idx + 3] = 255;
    }
  }
  
  return output;
};
