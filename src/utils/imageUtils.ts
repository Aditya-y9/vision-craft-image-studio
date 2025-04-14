
import { FilterMatrix, ProcessingResult, HistogramData } from "@/types";

// Convert a File to a base64 string
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Load an image from a URL and return an HTMLImageElement
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Create a canvas and context from an image
export const createCanvasFromImage = (image: HTMLImageElement): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(image, 0, 0);
  return { canvas, ctx };
};

// Get image data from context
export const getImageData = (ctx: CanvasRenderingContext2D): ImageData => {
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
};

// Put image data back to context and convert to base64
export const imageDataToBase64 = (ctx: CanvasRenderingContext2D, imageData: ImageData): string => {
  ctx.putImageData(imageData, 0, 0);
  return ctx.canvas.toDataURL('image/png');
};

// Apply a processing function with timing measurement
export const processImageWithTiming = async (
  imageUrl: string,
  processingFn: (imageData: ImageData) => ImageData
): Promise<ProcessingResult> => {
  const startTime = performance.now();
  
  try {
    // Load the image
    const image = await loadImage(imageUrl);
    const { canvas, ctx } = createCanvasFromImage(image);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply processing function
    const processedData = processingFn(imageData);
    
    // Put processed data back to canvas
    ctx.putImageData(processedData, 0, 0);
    
    // Convert to data URL
    const processedImageData = canvas.toDataURL('image/png');
    
    const endTime = performance.now();
    
    return {
      processedImageData,
      processingTime: endTime - startTime
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Calculate histogram from image data
export const calculateHistogram = (imageData: ImageData): HistogramData => {
  const { data, width, height } = imageData;
  const red = new Array(256).fill(0);
  const green = new Array(256).fill(0);
  const blue = new Array(256).fill(0);
  const grayscale = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    red[r]++;
    green[g]++;
    blue[b]++;
    
    // Calculate grayscale using luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayscale[gray]++;
  }
  
  return { red, green, blue, grayscale };
};

// Calculate cumulative distribution function (CDF)
export const calculateCDF = (histogram: number[]): number[] => {
  const cdf = new Array(256).fill(0);
  let sum = 0;
  
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    cdf[i] = sum;
  }
  
  // Normalize CDF to range 0-255
  const max = cdf[255];
  for (let i = 0; i < 256; i++) {
    cdf[i] = Math.round((cdf[i] / max) * 255);
  }
  
  return cdf;
};

// Apply convolution to image data with a given kernel
export const applyConvolution = (imageData: ImageData, filterMatrix: FilterMatrix): ImageData => {
  const { data, width, height } = imageData;
  const { matrix, normalize = true, factor = 1, offset = 0 } = filterMatrix;
  
  // Create output image data
  const output = new ImageData(width, height);
  
  // Calculate normalization factor if needed
  let normalizationFactor = factor;
  if (normalize) {
    normalizationFactor = 0;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[0].length; j++) {
        normalizationFactor += matrix[i][j];
      }
    }
    if (normalizationFactor === 0) normalizationFactor = 1;
  }
  
  const matrixSize = matrix.length;
  const halfMatrixSize = Math.floor(matrixSize / 2);
  
  // Apply convolution
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      
      // Apply kernel
      for (let ky = 0; ky < matrixSize; ky++) {
        for (let kx = 0; kx < matrixSize; kx++) {
          const pixelY = y + (ky - halfMatrixSize);
          const pixelX = x + (kx - halfMatrixSize);
          
          // Handle edge cases by clamping to border
          const clampedY = Math.max(0, Math.min(height - 1, pixelY));
          const clampedX = Math.max(0, Math.min(width - 1, pixelX));
          
          const pixelIndex = (clampedY * width + clampedX) * 4;
          const weight = matrix[ky][kx];
          
          r += data[pixelIndex] * weight;
          g += data[pixelIndex + 1] * weight;
          b += data[pixelIndex + 2] * weight;
        }
      }
      
      // Apply normalization and offset
      const outputIndex = (y * width + x) * 4;
      output.data[outputIndex] = Math.max(0, Math.min(255, Math.round(r / normalizationFactor + offset)));
      output.data[outputIndex + 1] = Math.max(0, Math.min(255, Math.round(g / normalizationFactor + offset)));
      output.data[outputIndex + 2] = Math.max(0, Math.min(255, Math.round(b / normalizationFactor + offset)));
      output.data[outputIndex + 3] = data[(y * width + x) * 4 + 3]; // Keep original alpha
    }
  }
  
  return output;
};

// Convert RGB to grayscale
export const rgbToGrayscale = (imageData: ImageData): ImageData => {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate grayscale using luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    output.data[i] = gray;
    output.data[i + 1] = gray;
    output.data[i + 2] = gray;
    output.data[i + 3] = data[i + 3]; // Keep original alpha
  }
  
  return output;
};

// Helper function for drawing histogram on canvas
export const drawHistogram = (canvas: HTMLCanvasElement, histogramData: number[], color: string = '#000'): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  
  // Find the maximum value in histogram for scaling
  const max = Math.max(...histogramData);
  const scale = max > 0 ? height / max : 1;
  
  // Draw histogram bars
  const barWidth = width / 256;
  
  for (let i = 0; i < 256; i++) {
    const h = histogramData[i] * scale;
    ctx.fillRect(i * barWidth, height - h, barWidth, h);
  }
};

// Helper function to clamp a number between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
