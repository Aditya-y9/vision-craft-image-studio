
import { processImageWithTiming } from "@/utils/imageUtils";
import { fft2d, ifft2d, fftshift } from "@/utils/fftUtils";

// Apply frequency domain filter to image
export const applyFrequencyFilter = async (
  imageUrl: string, 
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'notch', 
  cutoffFrequency: number,
  captureIntermediates: boolean = false
) => {
  try {
    return await processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      
      // Create output buffer
      const output = new ImageData(width, height);
      
      // Convert to grayscale and prepare for FFT
      const realInput = new Array(height).fill(0).map(() => new Array(width).fill(0));
      const imagInput = new Array(height).fill(0).map(() => new Array(width).fill(0));
      
      // Extract grayscale values
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          realInput[y][x] = gray;
        }
      }
      
      // Apply FFT
      const { real: realOutput, imag: imagOutput } = fft2d(realInput, imagInput);
      
      // Apply fftshift to center the zero frequency
      const { real: shiftedReal, imag: shiftedImag } = fftshift(realOutput, imagOutput);
      
      // Create frequency filter
      const filter = createFrequencyFilter(width, height, filterType, cutoffFrequency);
      
      // Apply filter in frequency domain
      const filteredReal = new Array(height).fill(0).map(() => new Array(width).fill(0));
      const filteredImag = new Array(height).fill(0).map(() => new Array(width).fill(0));
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          filteredReal[y][x] = shiftedReal[y][x] * filter[y][x];
          filteredImag[y][x] = shiftedImag[y][x] * filter[y][x];
        }
      }
      
      // Apply inverse FFT
      const { real: spatialReal } = ifft2d(filteredReal, filteredImag);
      
      // Convert back to image data
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const val = Math.max(0, Math.min(255, spatialReal[y][x]));
          output.data[idx] = val;
          output.data[idx + 1] = val;
          output.data[idx + 2] = val;
          output.data[idx + 3] = 255;
        }
      }
      
      // Generate visualizations for intermediate steps if requested
      let intermediateOutputs;
      if (captureIntermediates) {
        intermediateOutputs = {
          frequencyDomain: generateFrequencyDomainVisualization(shiftedReal, shiftedImag, width, height),
          filteredFrequencyDomain: generateFrequencyDomainVisualization(filteredReal, filteredImag, width, height),
        };
      }
      
      return {
        data: output,
        intermediateOutputs
      };
    });
  } catch (error) {
    console.error("Error in applyFrequencyFilter:", error);
    throw error;
  }
};

// Create frequency domain filter
const createFrequencyFilter = (
  width: number, 
  height: number, 
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'notch', 
  cutoffFrequency: number,
  bandwidth: number = 10
) => {
  const filter = new Array(height).fill(0).map(() => new Array(width).fill(0));
  
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Normalize cutoff frequency to be a proportion of the image dimensions
  const normalizedCutoff = cutoffFrequency * Math.min(centerX, centerY) / 100;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      switch (filterType) {
        case 'lowpass':
          filter[y][x] = distance < normalizedCutoff ? 1.0 : 0.0;
          break;
        case 'highpass':
          filter[y][x] = distance > normalizedCutoff ? 1.0 : 0.0;
          break;
        case 'bandpass':
          const innerRadius = Math.max(0, normalizedCutoff - bandwidth);
          const outerRadius = normalizedCutoff + bandwidth;
          filter[y][x] = (distance > innerRadius && distance < outerRadius) ? 1.0 : 0.0;
          break;
        case 'notch':
          // Create multiple notch filters (example: remove horizontal and vertical frequencies)
          const notchSize = normalizedCutoff / 5;
          // Horizontal notch
          const distanceToHorizontal = Math.abs(y - centerY);
          // Vertical notch
          const distanceToVertical = Math.abs(x - centerX);
          
          filter[y][x] = (distanceToHorizontal > notchSize && distanceToVertical > notchSize) ? 1.0 : 0.0;
          break;
      }
    }
  }
  
  return filter;
};

// Generate visualization of the frequency domain
const generateFrequencyDomainVisualization = (
  real: number[][], 
  imag: number[][], 
  width: number, 
  height: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(width, height);
  
  // Calculate magnitude spectrum
  let maxMagnitude = 0;
  const magnitude = new Array(height).fill(0).map(() => new Array(width).fill(0));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const re = real[y][x];
      const im = imag[y][x];
      magnitude[y][x] = Math.sqrt(re * re + im * im);
      maxMagnitude = Math.max(maxMagnitude, magnitude[y][x]);
    }
  }
  
  // Normalize and apply log transform for better visualization
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Log transform to enhance visibility
      const value = Math.log(1 + magnitude[y][x]) / Math.log(1 + maxMagnitude) * 255;
      
      // Use a colormap (here, simple grayscale)
      imageData.data[idx] = value;
      imageData.data[idx + 1] = value;
      imageData.data[idx + 2] = value;
      imageData.data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
};
