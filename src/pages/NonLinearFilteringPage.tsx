
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ImageData } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming } from '@/utils/imageUtils';

const NonLinearFilteringPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [windowSize, setWindowSize] = useState(3);
  
  // Load image from local storage if available
  useEffect(() => {
    const savedImageData = localStorage.getItem('uploadedImage');
    if (savedImageData) {
      try {
        const parsedData = JSON.parse(savedImageData) as ImageData;
        setImageData(parsedData);
      } catch (error) {
        console.error('Error parsing saved image data:', error);
      }
    }
  }, []);

  const handleImageUpload = (data: ImageData) => {
    setImageData(data);
    localStorage.setItem('uploadedImage', JSON.stringify(data));
  };

  const handleReset = () => {
    if (imageData) {
      const resetData = { ...imageData };
      delete resetData.processingMethod;
      delete resetData.processingTime;
      setImageData(resetData);
    }
  };

  const performMedianFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const halfWindow = Math.floor(windowSize / 2);
      
      // Apply median filter
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const windowR = [];
          const windowG = [];
          const windowB = [];
          
          // Collect values within the window
          for (let wy = -halfWindow; wy <= halfWindow; wy++) {
            for (let wx = -halfWindow; wx <= halfWindow; wx++) {
              const px = Math.min(Math.max(0, x + wx), width - 1);
              const py = Math.min(Math.max(0, y + wy), height - 1);
              const idx = (py * width + px) * 4;
              
              windowR.push(data[idx]);
              windowG.push(data[idx + 1]);
              windowB.push(data[idx + 2]);
            }
          }
          
          // Sort and find median
          windowR.sort((a, b) => a - b);
          windowG.sort((a, b) => a - b);
          windowB.sort((a, b) => a - b);
          
          const medianIndex = Math.floor(windowR.length / 2);
          const outIdx = (y * width + x) * 4;
          
          output.data[outIdx] = windowR[medianIndex];
          output.data[outIdx + 1] = windowG[medianIndex];
          output.data[outIdx + 2] = windowB[medianIndex];
          output.data[outIdx + 3] = data[outIdx + 3]; // Keep original alpha
        }
      }
      
      return output;
    });
  };

  const performMinFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const halfWindow = Math.floor(windowSize / 2);
      
      // Apply min filter
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let minR = 255, minG = 255, minB = 255;
          
          // Find minimum values within the window
          for (let wy = -halfWindow; wy <= halfWindow; wy++) {
            for (let wx = -halfWindow; wx <= halfWindow; wx++) {
              const px = Math.min(Math.max(0, x + wx), width - 1);
              const py = Math.min(Math.max(0, y + wy), height - 1);
              const idx = (py * width + px) * 4;
              
              minR = Math.min(minR, data[idx]);
              minG = Math.min(minG, data[idx + 1]);
              minB = Math.min(minB, data[idx + 2]);
            }
          }
          
          const outIdx = (y * width + x) * 4;
          output.data[outIdx] = minR;
          output.data[outIdx + 1] = minG;
          output.data[outIdx + 2] = minB;
          output.data[outIdx + 3] = data[outIdx + 3]; // Keep original alpha
        }
      }
      
      return output;
    });
  };

  const performMaxFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const halfWindow = Math.floor(windowSize / 2);
      
      // Apply max filter
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let maxR = 0, maxG = 0, maxB = 0;
          
          // Find maximum values within the window
          for (let wy = -halfWindow; wy <= halfWindow; wy++) {
            for (let wx = -halfWindow; wx <= halfWindow; wx++) {
              const px = Math.min(Math.max(0, x + wx), width - 1);
              const py = Math.min(Math.max(0, y + wy), height - 1);
              const idx = (py * width + px) * 4;
              
              maxR = Math.max(maxR, data[idx]);
              maxG = Math.max(maxG, data[idx + 1]);
              maxB = Math.max(maxB, data[idx + 2]);
            }
          }
          
          const outIdx = (y * width + x) * 4;
          output.data[outIdx] = maxR;
          output.data[outIdx + 1] = maxG;
          output.data[outIdx + 2] = maxB;
          output.data[outIdx + 3] = data[outIdx + 3]; // Keep original alpha
        }
      }
      
      return output;
    });
  };

  const performBilateralFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const halfWindow = Math.floor(windowSize / 2);
      
      const spatialSigma = windowSize / 2;
      const rangeSigma = 30;
      
      // Apply bilateral filter
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const centerIdx = (y * width + x) * 4;
          const centerR = data[centerIdx];
          const centerG = data[centerIdx + 1];
          const centerB = data[centerIdx + 2];
          
          let sumR = 0, sumG = 0, sumB = 0;
          let totalWeight = 0;
          
          // Process neighborhood
          for (let wy = -halfWindow; wy <= halfWindow; wy++) {
            for (let wx = -halfWindow; wx <= halfWindow; wx++) {
              const px = Math.min(Math.max(0, x + wx), width - 1);
              const py = Math.min(Math.max(0, y + wy), height - 1);
              const idx = (py * width + px) * 4;
              
              // Calculate spatial weight (based on distance)
              const spatialDist = Math.sqrt(wx * wx + wy * wy);
              const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma));
              
              // Calculate range weight (based on color difference)
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              const colorDist = Math.sqrt(
                Math.pow(r - centerR, 2) + 
                Math.pow(g - centerG, 2) + 
                Math.pow(b - centerB, 2)
              );
              
              const rangeWeight = Math.exp(-(colorDist * colorDist) / (2 * rangeSigma * rangeSigma));
              
              // Combine weights
              const weight = spatialWeight * rangeWeight;
              
              sumR += r * weight;
              sumG += g * weight;
              sumB += b * weight;
              totalWeight += weight;
            }
          }
          
          // Set output value
          const outIdx = (y * width + x) * 4;
          output.data[outIdx] = totalWeight > 0 ? Math.round(sumR / totalWeight) : centerR;
          output.data[outIdx + 1] = totalWeight > 0 ? Math.round(sumG / totalWeight) : centerG;
          output.data[outIdx + 2] = totalWeight > 0 ? Math.round(sumB / totalWeight) : centerB;
          output.data[outIdx + 3] = data[outIdx + 3]; // Keep original alpha
        }
      }
      
      return output;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-1"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mt-2">Non-Linear Filtering</h1>
        <p className="text-muted-foreground">
          Apply non-linear filters for advanced image enhancement and noise reduction.
        </p>
      </div>

      {!imageData ? (
        <ImageUploader onImageUpload={handleImageUpload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ImageProcessor 
              imageData={imageData} 
              onReset={handleReset}
              onProcessedImageChange={(processedImage) => {
                setImageData(prev => prev ? {
                  ...prev,
                  processed: processedImage
                } : null);
              }}
            >
              <div className="mb-4">
                <Label>Window Size: {windowSize}x{windowSize}</Label>
                <Select 
                  value={windowSize.toString()} 
                  onValueChange={(value) => setWindowSize(parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select window size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3×3</SelectItem>
                    <SelectItem value="5">5×5</SelectItem>
                    <SelectItem value="7">7×7</SelectItem>
                    <SelectItem value="9">9×9</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                Non-Linear Filters
              </h3>
              
              <ProcessingControls
                title="Median Filter"
                description="Replaces each pixel with the median value in its neighborhood. Excellent for salt and pepper noise removal."
                imageUrl={imageData.original}
                processingFn={performMedianFilter}
              />
              
              <ProcessingControls
                title="Min Filter"
                description="Replaces each pixel with the minimum value in its neighborhood. Useful for removing white noise."
                imageUrl={imageData.original}
                processingFn={performMinFilter}
              />
              
              <ProcessingControls
                title="Max Filter"
                description="Replaces each pixel with the maximum value in its neighborhood. Useful for removing dark noise."
                imageUrl={imageData.original}
                processingFn={performMaxFilter}
              />
              
              <ProcessingControls
                title="Bilateral Filter"
                description="Edge-preserving smoothing filter that combines domain and range filtering."
                imageUrl={imageData.original}
                processingFn={performBilateralFilter}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <TheorySection title="About Non-Linear Filtering">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Non-linear filters</strong> are image processing operations where the output is not a linear 
                    function of the inputs. These filters are particularly effective for removing certain types of noise 
                    while preserving important image features like edges.
                  </p>
                  
                  <h4 className="font-medium">Median Filter</h4>
                  <p>
                    The median filter replaces each pixel with the median value from its neighborhood. It is highly 
                    effective at removing salt and pepper noise while preserving edges better than linear filters.
                  </p>
                  
                  <h4 className="font-medium">Min/Max Filters</h4>
                  <p>
                    Min filters (also called erosion in morphology) replace each pixel with the minimum value in the window, 
                    while max filters (dilation) use the maximum value. These are useful for morphological operations and 
                    specific types of noise removal.
                  </p>
                  
                  <h4 className="font-medium">Bilateral Filter</h4>
                  <p>
                    The bilateral filter combines domain filtering (based on spatial distance) with range filtering 
                    (based on pixel value differences). This preserves edges while smoothing regions, making it excellent 
                    for noise reduction without blurring important details.
                  </p>
                  
                  <h4 className="font-medium">Applications</h4>
                  <p>
                    Non-linear filtering is extensively used in medical imaging, satellite image processing, and 
                    preprocessing for computer vision tasks. They are preferred in situations where edge preservation 
                    is crucial while removing noise.
                  </p>
                </div>
              </TheorySection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NonLinearFilteringPage;
