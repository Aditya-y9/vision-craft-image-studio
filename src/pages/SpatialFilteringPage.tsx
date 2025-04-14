
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import type { ImageData, FilterMatrix } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming, applyConvolution } from '@/utils/imageUtils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const SpatialFilteringPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [kernelStrength, setKernelStrength] = useState(1);
  
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

  // Smoothing filters
  const performMeanFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const meanFilter: FilterMatrix = {
        matrix: [
          [1, 1, 1],
          [1, 1, 1],
          [1, 1, 1]
        ],
        normalize: true
      };
      return applyConvolution(imageData, meanFilter);
    });
  };

  const performGaussianFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const gaussianFilter: FilterMatrix = {
        matrix: [
          [1, 2, 1],
          [2, 4 * kernelStrength, 2],
          [1, 2, 1]
        ],
        normalize: true
      };
      return applyConvolution(imageData, gaussianFilter);
    });
  };

  // Sharpening filters
  const performLaplacianFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const laplacianFilter: FilterMatrix = {
        matrix: [
          [0, -1, 0],
          [-1, 4 + kernelStrength, -1],
          [0, -1, 0]
        ],
        normalize: false
      };
      return applyConvolution(imageData, laplacianFilter);
    });
  };

  const performSharpeningFilter = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const sharpeningFilter: FilterMatrix = {
        matrix: [
          [-1, -1, -1],
          [-1, 9 * kernelStrength, -1],
          [-1, -1, -1]
        ],
        normalize: false
      };
      return applyConvolution(imageData, sharpeningFilter);
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
        <h1 className="text-2xl font-bold mt-2">Spatial Filtering</h1>
        <p className="text-muted-foreground">
          Enhance images using smoothing and sharpening spatial filters.
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
                <Label>Filter Strength: {kernelStrength.toFixed(1)}</Label>
                <Slider 
                  value={[kernelStrength]} 
                  min={0.1}
                  max={3} 
                  step={0.1}
                  onValueChange={(value) => setKernelStrength(value[0])}
                  className="mt-2"
                />
              </div>
              
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                Smoothing Filters
              </h3>
              
              <ProcessingControls
                title="Mean Filter"
                description="Applies a uniform averaging filter to smooth the image and reduce noise."
                imageUrl={imageData.original}
                processingFn={performMeanFilter}
              />
              
              <ProcessingControls
                title="Gaussian Filter"
                description="Applies a Gaussian blur that reduces noise while preserving edges better than the mean filter."
                imageUrl={imageData.original}
                processingFn={performGaussianFilter}
              />
              
              <h3 className="font-medium text-lg mt-6 mb-2 flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                Sharpening Filters
              </h3>
              
              <ProcessingControls
                title="Laplacian Filter"
                description="Detects edges in all directions and enhances the high-frequency details."
                imageUrl={imageData.original}
                processingFn={performLaplacianFilter}
              />
              
              <ProcessingControls
                title="Sharpening Filter"
                description="Enhances edges and details by applying a high-pass filter."
                imageUrl={imageData.original}
                processingFn={performSharpeningFilter}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <TheorySection title="About Spatial Filtering">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Spatial filtering</strong> is a pixel-based operation that modifies the value of 
                    a pixel based on its neighbors. It is done by sliding a small window (kernel or mask) 
                    over the image and performing mathematical operations.
                  </p>
                  
                  <h4 className="font-medium">Smoothing Filters</h4>
                  <p>
                    <strong>Mean Filter:</strong> Replaces each pixel with the average value of pixels in its neighborhood. 
                    Effective for reducing random noise but may blur edges.
                  </p>
                  <p>
                    <strong>Gaussian Filter:</strong> Uses a weighted average with a bell-shaped curve, giving more 
                    importance to central pixels. Better preserves edges while reducing noise.
                  </p>
                  
                  <h4 className="font-medium">Sharpening Filters</h4>
                  <p>
                    <strong>Laplacian Filter:</strong> Second derivative operator that enhances high-frequency 
                    components without affecting low-frequency ones. Detects edges in all directions.
                  </p>
                  <p>
                    <strong>Sharpening Filter:</strong> Enhances transitions in intensity, making details 
                    more visible. Often implemented by adding the Laplacian result to the original image.
                  </p>
                  
                  <h4 className="font-medium">Mathematical Basis</h4>
                  <p>
                    Spatial filtering is based on convolution, which is defined as:
                  </p>
                  <p>
                    g(x,y) = Σ Σ f(x-s,y-t) h(s,t)
                  </p>
                  <p>
                    where f is the input image, h is the filter kernel, and g is the output image.
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

export default SpatialFilteringPage;
