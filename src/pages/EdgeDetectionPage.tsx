
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ImageData, FilterMatrix } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming, applyConvolution, rgbToGrayscale } from '@/utils/imageUtils';

const EdgeDetectionPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [threshold, setThreshold] = useState(30);
  const [convertToGrayscale, setConvertToGrayscale] = useState(true);
  
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

  const performSobelOperator = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      // Convert to grayscale if needed
      const workingData = convertToGrayscale ? rgbToGrayscale(imageData) : imageData;
      
      // Create Sobel operators for x and y directions
      const sobelX: FilterMatrix = {
        matrix: [
          [-1, 0, 1],
          [-2, 0, 2],
          [-1, 0, 1]
        ],
        normalize: false
      };
      
      const sobelY: FilterMatrix = {
        matrix: [
          [-1, -2, -1],
          [0, 0, 0],
          [1, 2, 1]
        ],
        normalize: false
      };
      
      // Apply both operators
      const gradientX = applyConvolution(workingData, sobelX);
      const gradientY = applyConvolution(workingData, sobelY);
      
      // Combine the results and apply threshold
      const output = new ImageData(workingData.width, workingData.height);
      for (let i = 0; i < workingData.data.length; i += 4) {
        const gx = gradientX.data[i];
        const gy = gradientY.data[i];
        
        // Compute gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // Apply threshold
        const edgeValue = magnitude > threshold ? 255 : 0;
        
        output.data[i] = edgeValue;
        output.data[i + 1] = edgeValue;
        output.data[i + 2] = edgeValue;
        output.data[i + 3] = workingData.data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  const performPrewittOperator = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      // Convert to grayscale if needed
      const workingData = convertToGrayscale ? rgbToGrayscale(imageData) : imageData;
      
      // Create Prewitt operators for x and y directions
      const prewittX: FilterMatrix = {
        matrix: [
          [-1, 0, 1],
          [-1, 0, 1],
          [-1, 0, 1]
        ],
        normalize: false
      };
      
      const prewittY: FilterMatrix = {
        matrix: [
          [-1, -1, -1],
          [0, 0, 0],
          [1, 1, 1]
        ],
        normalize: false
      };
      
      // Apply both operators
      const gradientX = applyConvolution(workingData, prewittX);
      const gradientY = applyConvolution(workingData, prewittY);
      
      // Combine the results and apply threshold
      const output = new ImageData(workingData.width, workingData.height);
      for (let i = 0; i < workingData.data.length; i += 4) {
        const gx = gradientX.data[i];
        const gy = gradientY.data[i];
        
        // Compute gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // Apply threshold
        const edgeValue = magnitude > threshold ? 255 : 0;
        
        output.data[i] = edgeValue;
        output.data[i + 1] = edgeValue;
        output.data[i + 2] = edgeValue;
        output.data[i + 3] = workingData.data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  const performRobertsOperator = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      // Convert to grayscale if needed
      const workingData = convertToGrayscale ? rgbToGrayscale(imageData) : imageData;
      
      // Create Roberts cross operators
      const robertsX: FilterMatrix = {
        matrix: [
          [1, 0],
          [0, -1]
        ],
        normalize: false
      };
      
      const robertsY: FilterMatrix = {
        matrix: [
          [0, 1],
          [-1, 0]
        ],
        normalize: false
      };
      
      // Create custom convolution for 2x2 mask
      const { width, height, data } = workingData;
      const output = new ImageData(width, height);
      
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // Get pixels for the 2x2 window
          const p1 = data[idx];
          const p2 = data[idx + 4];
          const p3 = data[idx + width * 4];
          const p4 = data[idx + width * 4 + 4];
          
          // Apply Roberts operators
          const gx = p1 - p4;
          const gy = p2 - p3;
          
          // Compute magnitude
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          
          // Apply threshold
          const edgeValue = magnitude > threshold ? 255 : 0;
          
          output.data[idx] = edgeValue;
          output.data[idx + 1] = edgeValue;
          output.data[idx + 2] = edgeValue;
          output.data[idx + 3] = data[idx + 3]; // Keep original alpha
        }
      }
      
      return output;
    });
  };

  const performLaplacianOperator = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      // Convert to grayscale if needed
      const workingData = convertToGrayscale ? rgbToGrayscale(imageData) : imageData;
      
      // Create Laplacian operator
      const laplacian: FilterMatrix = {
        matrix: [
          [0, -1, 0],
          [-1, 4, -1],
          [0, -1, 0]
        ],
        normalize: false
      };
      
      // Apply the Laplacian operator
      const result = applyConvolution(workingData, laplacian);
      
      // Apply threshold to create binary edge image
      const output = new ImageData(workingData.width, workingData.height);
      for (let i = 0; i < workingData.data.length; i += 4) {
        const value = Math.abs(result.data[i]);
        const edgeValue = value > threshold ? 255 : 0;
        
        output.data[i] = edgeValue;
        output.data[i + 1] = edgeValue;
        output.data[i + 2] = edgeValue;
        output.data[i + 3] = workingData.data[i + 3]; // Keep original alpha
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
        <h1 className="text-2xl font-bold mt-2">Edge Detection</h1>
        <p className="text-muted-foreground">
          Detect edges in images using various operators such as Sobel, Prewitt, Roberts, and Laplacian.
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
              <div className="mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Convert to grayscale first</Label>
                  <Switch 
                    checked={convertToGrayscale}
                    onCheckedChange={setConvertToGrayscale}
                  />
                </div>
                
                <div>
                  <Label>Threshold: {threshold}</Label>
                  <Slider 
                    value={[threshold]} 
                    min={0}
                    max={255} 
                    step={1}
                    onValueChange={(value) => setThreshold(value[0])}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <Grid size={18} className="text-primary" />
                Edge Detection Operators
              </h3>
              
              <ProcessingControls
                title="Sobel Operator"
                description="Calculates the gradient of the image intensity to emphasize edges."
                imageUrl={imageData.original}
                processingFn={performSobelOperator}
              />
              
              <ProcessingControls
                title="Prewitt Operator"
                description="Similar to Sobel but with uniform kernel weights, emphasizing horizontal and vertical edges."
                imageUrl={imageData.original}
                processingFn={performPrewittOperator}
              />
              
              <ProcessingControls
                title="Roberts Operator"
                description="Uses 2×2 masks to compute the gradient magnitude, highlighting fine details."
                imageUrl={imageData.original}
                processingFn={performRobertsOperator}
              />
              
              <ProcessingControls
                title="Laplacian Operator"
                description="Detects edges by measuring the second derivative of the image intensity."
                imageUrl={imageData.original}
                processingFn={performLaplacianOperator}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <TheorySection title="About Edge Detection">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Edge detection</strong> is a fundamental technique in image processing that 
                    identifies points in an image where brightness changes sharply, indicating the boundaries 
                    of objects in an image.
                  </p>
                  
                  <h4 className="font-medium">Sobel Operator</h4>
                  <p>
                    The Sobel operator consists of two 3×3 kernels that are convolved with the original 
                    image to calculate approximations of the horizontal and vertical derivatives. The combined 
                    magnitude gives the edge strength at each point.
                  </p>
                  
                  <h4 className="font-medium">Prewitt Operator</h4>
                  <p>
                    The Prewitt operator is similar to Sobel but uses a simpler kernel with equal weights. 
                    It's less sensitive to noise but may miss some edges that Sobel detects.
                  </p>
                  
                  <h4 className="font-medium">Roberts Operator</h4>
                  <p>
                    The Roberts cross operator uses 2×2 kernels for computing the gradient. It's one of the 
                    earliest edge detectors and works well for simple images with sharp edges.
                  </p>
                  
                  <h4 className="font-medium">Laplacian Operator</h4>
                  <p>
                    The Laplacian operator detects edges by finding places where the second derivative 
                    of the image intensity is zero. It's often used after Gaussian smoothing to reduce 
                    sensitivity to noise.
                  </p>
                  
                  <h4 className="font-medium">Applications</h4>
                  <p>
                    Edge detection is crucial in computer vision applications such as object recognition, 
                    image segmentation, and feature extraction. It's also used in medical image analysis 
                    and industrial inspection systems.
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

export default EdgeDetectionPage;
