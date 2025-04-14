
export type ImageData = {
  original: string;
  processed?: string;
  filename: string;
  width?: number;
  height?: number;
  type?: string;
  size?: number;
  processingTime?: number;
  processingMethod?: string;
};

export type ProcessingParams = {
  [key: string]: number | string | boolean;
};

export type ProcessingResult = {
  processedImageData: string;
  processingTime: number;
};

export type HistogramData = {
  red?: number[];
  green?: number[];
  blue?: number[];
  grayscale?: number[];
  cdf?: number[];
  equalizedCdf?: number[];
};

export interface FilterMatrix {
  matrix: number[][];
  normalize?: boolean;
  factor?: number;
  offset?: number;
}

export interface WatershedParams {
  threshold: number;
  connectivity: 4 | 8;
}

export interface EdgeDetectionParams {
  operator: 'sobel' | 'prewitt' | 'roberts' | 'laplacian' | 'canny';
  threshold?: number;
  lowThreshold?: number; // For Canny
  highThreshold?: number; // For Canny
}

export interface FrequencyFilteringParams {
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  cutoffFrequency: number;
  order?: number;
}

export interface JpegCompressionParams {
  quality: number;
}

export interface ColorManipulationParams {
  red?: number;
  green?: number;
  blue?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
}
