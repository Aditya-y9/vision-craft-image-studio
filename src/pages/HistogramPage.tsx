
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { ImageComparison } from '@/components/ImageComparison';
import { ImageData, HistogramData, ProcessingResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { calculateHistogram, calculateCDF, drawHistogram, loadImage, createCanvasFromImage, getImageData, imageDataToBase64 } from '@/utils/imageUtils';

const HistogramPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [processedImageData, setProcessedImageData] = useState<string | null>(null);
  const [equalizationParams, setEqualizationParams] = useState({
    clipLimit: 3.0,
    tileSize: 8,
    adaptiveEqualization: false,
  });
  
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const cdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const equalizedHistogramCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
  
  // Draw histograms when histogram data changes
  useEffect(() => {
    if (!histogram || !histogramCanvasRef.current || !cdfCanvasRef.current) return;
    
    drawHistogram(histogramCanvasRef.current, histogram.grayscale || [], '#555');
    
    if (histogram.cdf) {
      drawHistogram(cdfCanvasRef.current, histogram.cdf, 'steelblue');
    }
    
    if (histogram.equalizedCdf && equalizedHistogramCanvasRef.current) {
      drawHistogram(equalizedHistogramCanvasRef.current, histogram.equalizedCdf, 'green');
    }
  }, [histogram]);
  
  const handleImageUpload = (data: ImageData) => {
    setImageData(data);
    setProcessedImageData(null);
    setHistogram(null);
    localStorage.setItem('uploadedImage', JSON.stringify(data));
  };
  
  const handleProcessedImageChange = (processed: string) => {
    setProcessedImageData(processed);
  };
  
  const handleReset = () => {
    setProcessedImageData(null);
    setHistogram(null);
  };
  
  const calculateHistogramData = async (imageUrl: string): Promise<ProcessingResult> => {
    const startTime = performance.now();
    
    try {
      // Load image and get image data
      const image = await loadImage(imageUrl);
      const { canvas, ctx } = createCanvasFromImage(image);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Calculate histogram and CDF
      const histogramData = calculateHistogram(imageData);
      const cdf = calculateCDF(histogramData.grayscale || []);
      
      // Store histogram data
      setHistogram({
        ...histogramData,
        cdf,
      });
      
      // Return original image (no processing)
      const endTime = performance.now();
      
      return {
        processedImageData: imageUrl,
        processingTime: endTime - startTime
      };
    } catch (error) {
      console.error('Error calculating histogram:', error);
      throw error;
    }
  };
  
  const applyHistogramEqualization = async (imageUrl: string): Promise<ProcessingResult> => {
    const startTime = performance.now();
    
    try {
      // Load image and get image data
      const image = await loadImage(imageUrl);
      const { canvas, ctx } = createCanvasFromImage(image);
      const imageData = getImageData(ctx);
      const { data, width, height } = imageData;
      
      // Calculate histogram and CDF
      const histogramData = calculateHistogram(imageData);
      const cdf = calculateCDF(histogramData.grayscale || []);
      
      // Create output image data
      const output = new ImageData(width, height);
      
      if (equalizationParams.adaptiveEqualization) {
        // Adaptive histogram equalization
        const tileSize = Math.max(8, Math.pow(2, equalizationParams.tileSize));
        const clipLimit = equalizationParams.clipLimit;
        
        // Implement CLAHE (Contrast Limited Adaptive Histogram Equalization)
        const tilesX = Math.ceil(width / tileSize);
        const tilesY = Math.ceil(height / tileSize);
        
        // Process each tile separately
        for (let ty = 0; ty < tilesY; ty++) {
          for (let tx = 0; tx < tilesX; tx++) {
            const startX = tx * tileSize;
            const startY = ty * tileSize;
            const endX = Math.min(startX + tileSize, width);
            const endY = Math.min(startY + tileSize, height);
            
            // Calculate histogram for this tile
            const tileHistogram = new Array(256).fill(0);
            
            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                tileHistogram[gray]++;
              }
            }
            
            // Apply clip limit
            const pixelsInTile = (endX - startX) * (endY - startY);
            const clipThreshold = Math.max(1, (clipLimit * pixelsInTile) / 256);
            
            let clippedPixels = 0;
            for (let i = 0; i < 256; i++) {
              if (tileHistogram[i] > clipThreshold) {
                clippedPixels += tileHistogram[i] - clipThreshold;
                tileHistogram[i] = clipThreshold;
              }
            }
            
            // Redistribute clipped pixels
            const redistributeValue = Math.floor(clippedPixels / 256);
            for (let i = 0; i < 256; i++) {
              tileHistogram[i] += redistributeValue;
            }
            
            // Calculate CDF for tile
            const tileCdf = calculateCDF(tileHistogram);
            
            // Apply equalization to this tile
            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                
                // Get new value from CDF
                const newVal = tileCdf[gray];
                
                // Apply to all channels
                output.data[idx] = newVal;
                output.data[idx + 1] = newVal;
                output.data[idx + 2] = newVal;
                output.data[idx + 3] = data[idx + 3]; // Keep alpha
              }
            }
          }
        }
      } else {
        // Global histogram equalization
        // Apply equalization using CDF
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Convert to grayscale
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          
          // Get new value from CDF
          const newVal = cdf[gray];
          
          // Apply to all channels for grayscale output
          output.data[i] = newVal;
          output.data[i + 1] = newVal;
          output.data[i + 2] = newVal;
          output.data[i + 3] = data[i + 3]; // Keep alpha
        }
      }
      
      // Put processed data back to canvas
      ctx.putImageData(output, 0, 0);
      
      // Calculate histogram of equalized image
      const equalizedHistogramData = calculateHistogram(output);
      const equalizedCdf = calculateCDF(equalizedHistogramData.grayscale || []);
      
      // Update histogram data
      setHistogram({
        ...histogramData,
        cdf,
        equalizedCdf,
      });
      
      const processedImageData = canvas.toDataURL('image/png');
      const endTime = performance.now();
      
      return {
        processedImageData,
        processingTime: endTime - startTime
      };
    } catch (error) {
      console.error('Error applying histogram equalization:', error);
      throw error;
    }
  };

  if (!imageData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-1"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold mt-2">Histogram Processing</h1>
          <p className="text-muted-foreground">
            Upload an image to analyze its histogram and apply histogram equalization
          </p>
        </div>
        <ImageUploader onImageUpload={handleImageUpload} />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-1"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mt-2">Histogram Processing</h1>
        <p className="text-muted-foreground">
          Analyze the histogram of an image and apply histogram equalization techniques
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ImageProcessor 
            imageData={imageData} 
            onReset={handleReset}
            onProcessedImageChange={handleProcessedImageChange}
          >
            <ProcessingControls
              title="Histogram Analysis"
              description="Calculate and display the histogram and cumulative distribution function (CDF) of the image"
              imageUrl={imageData.original}
              processingFn={calculateHistogramData}
            />
            
            <ProcessingControls
              title="Histogram Equalization"
              description="Enhance image contrast by redistributing intensity values"
              imageUrl={imageData.original}
              processingFn={applyHistogramEqualization}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="adaptiveEqualization" className="cursor-pointer">
                    Adaptive Equalization (CLAHE)
                  </Label>
                  <Switch 
                    id="adaptiveEqualization"
                    checked={equalizationParams.adaptiveEqualization}
                    onCheckedChange={(checked) => 
                      setEqualizationParams({...equalizationParams, adaptiveEqualization: checked})
                    }
                  />
                </div>
                
                {equalizationParams.adaptiveEqualization && (
                  <>
                    <div className="space-y-2">
                      <div className="slider-label">
                        <span>Clip Limit</span>
                        <span className="slider-value">{equalizationParams.clipLimit.toFixed(1)}</span>
                      </div>
                      <Slider 
                        value={[equalizationParams.clipLimit]}
                        min={1}
                        max={10}
                        step={0.1}
                        onValueChange={([value]) => 
                          setEqualizationParams({...equalizationParams, clipLimit: value})
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="slider-label">
                        <span>Tile Size (2^{equalizationParams.tileSize})</span>
                        <span className="slider-value">{Math.pow(2, equalizationParams.tileSize)}</span>
                      </div>
                      <Slider 
                        value={[equalizationParams.tileSize]}
                        min={3}
                        max={8}
                        step={1}
                        onValueChange={([value]) => 
                          setEqualizationParams({...equalizationParams, tileSize: value})
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </ProcessingControls>
          </ImageProcessor>
        </div>
        
        <div className="space-y-6">
          {processedImageData && (
            <ImageComparison 
              originalSrc={imageData.original} 
              processedSrc={processedImageData} 
            />
          )}
          
          {histogram && (
            <div className="space-y-4">
              <h3 className="font-medium">Image Histograms</h3>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Original Grayscale Histogram</p>
                <canvas 
                  ref={histogramCanvasRef} 
                  className="histogram-canvas" 
                  width="256" 
                  height="150"
                />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Cumulative Distribution Function (CDF)</p>
                <canvas 
                  ref={cdfCanvasRef} 
                  className="histogram-canvas" 
                  width="256" 
                  height="150"
                />
              </div>
              
              {histogram.equalizedCdf && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Equalized CDF</p>
                  <canvas 
                    ref={equalizedHistogramCanvasRef} 
                    className="histogram-canvas" 
                    width="256" 
                    height="150"
                  />
                </div>
              )}
            </div>
          )}
          
          <TheorySection title="Understanding Histogram Equalization">
            <p>
              Histogram equalization is a technique used to enhance the contrast of images by effectively
              spreading out the most frequent intensity values.
            </p>
            
            <p className="mt-2">
              The method works by:
            </p>
            
            <ol>
              <li>Computing the histogram of the image to get the frequency distribution of pixel intensities</li>
              <li>Calculating the cumulative distribution function (CDF) from the histogram</li>
              <li>Normalizing the CDF to map the original pixel values to new values</li>
              <li>Transforming the original image using this mapping to create an enhanced image</li>
            </ol>
            
            <p className="mt-2">
              Mathematically, for an image with intensity levels in the range [0, L-1], the transformation function is:
            </p>
            
            <div className="math-formula">
              h(v) = round[(L-1) × cdf(v)]
            </div>
            
            <p>
              Where h(v) is the new intensity value, cdf(v) is the cumulative distribution function normalized to [0,1], 
              and L is the number of possible intensity values (typically 256 for 8-bit images).
            </p>
            
            <p className="mt-2">
              <strong>Adaptive Histogram Equalization (CLAHE)</strong> applies this technique locally rather than globally.
              It divides the image into small tiles, equalizes each tile separately, and then combines the results using bilinear interpolation.
              This prevents over-amplification of noise in homogeneous regions while still enhancing local contrast.
            </p>
          </TheorySection>
        </div>
      </div>
    </div>
  );
};

export default HistogramPage;
