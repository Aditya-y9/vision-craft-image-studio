
import { ProcessingResult } from "@/types";
import { rgbToGrayscale, processImageWithTiming } from "@/utils/imageUtils";
import { fft2d, ifft2d } from "@/utils/fftUtils";

export const applyFrequencyFilter = async (
  imageUrl: string, 
  filterType: string,
  cutoffFrequency: number
): Promise<ProcessingResult> => {
  return processImageWithTiming(imageUrl, (domImageData) => {
    // Convert to grayscale for simplicity
    const grayImage = rgbToGrayscale(domImageData);
    
    // Forward FFT
    const { real, imag } = fft2d(grayImage);
    
    const h = real.length;
    const w = real[0].length;
    const centerY = h / 2;
    const centerX = w / 2;
    
    // Create filtered arrays
    const filteredReal = [...real];
    const filteredImag = [...imag];
    
    // Apply filter in frequency domain
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Calculate distance from center (frequency)
        const distance = Math.sqrt(Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2));
        const normalizedDistance = distance / Math.min(centerY, centerX) * 100;
        
        let factor = 1.0;
        
        switch (filterType) {
          case 'lowpass':
            factor = normalizedDistance < cutoffFrequency ? 1.0 : 0.0;
            break;
          case 'highpass':
            factor = normalizedDistance > cutoffFrequency ? 1.0 : 0.0;
            break;
          case 'bandpass':
            factor = (normalizedDistance > cutoffFrequency - 10 && 
                    normalizedDistance < cutoffFrequency + 10) ? 1.0 : 0.0;
            break;
          case 'notch':
            factor = (normalizedDistance > cutoffFrequency - 10 && 
                    normalizedDistance < cutoffFrequency + 10) ? 0.0 : 1.0;
            break;
        }
        
        filteredReal[y][x] *= factor;
        filteredImag[y][x] *= factor;
      }
    }
    
    // Inverse FFT
    return ifft2d(filteredReal, filteredImag);
  });
};
