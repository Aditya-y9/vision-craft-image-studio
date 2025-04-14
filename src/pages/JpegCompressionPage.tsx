
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileArchive, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { ImageData } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming, rgbToGrayscale } from '@/utils/imageUtils';

const JpegCompressionPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [qualityFactor, setQualityFactor] = useState(50);
  
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

  // Standard JPEG quantization table for luminance (Y component)
  const standardQuantizationTable = [
    16, 11, 10, 16, 24, 40, 51, 61,
    12, 12, 14, 19, 26, 58, 60, 55,
    14, 13, 16, 24, 40, 57, 69, 56,
    14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109, 103, 77,
    24, 35, 55, 64, 81, 104, 113, 92,
    49, 64, 78, 87, 103, 121, 120, 101,
    72, 92, 95, 98, 112, 100, 103, 99
  ];

  const performDCT = (block: number[][]): number[][] => {
    const N = 8;
    const output = Array(N).fill(0).map(() => Array(N).fill(0));
    
    for (let u = 0; u < N; u++) {
      for (let v = 0; v < N; v++) {
        let sum = 0;
        
        for (let x = 0; x < N; x++) {
          for (let y = 0; y < N; y++) {
            sum += block[x][y] * 
                  Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) * 
                  Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
          }
        }
        
        const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
        const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
        output[u][v] = (2 * cu * cv * sum) / N;
      }
    }
    
    return output;
  };

  const performIDCT = (block: number[][]): number[][] => {
    const N = 8;
    const output = Array(N).fill(0).map(() => Array(N).fill(0));
    
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        let sum = 0;
        
        for (let u = 0; u < N; u++) {
          for (let v = 0; v < N; v++) {
            const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
            const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
            sum += cu * cv * block[u][v] * 
                  Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) * 
                  Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
          }
        }
        
        output[x][y] = (2 * sum) / N;
      }
    }
    
    return output;
  };

  const quantize = (dctBlock: number[][], quality: number): number[][] => {
    const N = 8;
    const output = Array(N).fill(0).map(() => Array(N).fill(0));
    const scaleFactor = quality < 50 ? 5000 / quality : 200 - 2 * quality;
    
    // Create scaled quantization table
    const quantTable = standardQuantizationTable.map(val => 
      Math.max(1, Math.min(255, Math.floor((val * scaleFactor + 50) / 100)))
    );
    
    for (let u = 0; u < N; u++) {
      for (let v = 0; v < N; v++) {
        const qValue = quantTable[u * 8 + v];
        output[u][v] = Math.round(dctBlock[u][v] / qValue);
      }
    }
    
    return output;
  };

  const dequantize = (quantizedBlock: number[][], quality: number): number[][] => {
    const N = 8;
    const output = Array(N).fill(0).map(() => Array(N).fill(0));
    const scaleFactor = quality < 50 ? 5000 / quality : 200 - 2 * quality;
    
    // Create scaled quantization table
    const quantTable = standardQuantizationTable.map(val => 
      Math.max(1, Math.min(255, Math.floor((val * scaleFactor + 50) / 100)))
    );
    
    for (let u = 0; u < N; u++) {
      for (let v = 0; v < N; v++) {
        const qValue = quantTable[u * 8 + v];
        output[u][v] = quantizedBlock[u][v] * qValue;
      }
    }
    
    return output;
  };

  const performJpegCompression = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      // Convert to grayscale for simplicity
      const grayImage = rgbToGrayscale(imageData);
      const { width, height, data } = grayImage;
      
      // Create output image data
      const output = new ImageData(width, height);
      
      // Process 8x8 blocks
      for (let blockY = 0; blockY < height; blockY += 8) {
        for (let blockX = 0; blockX < width; blockX += 8) {
          // Extract 8x8 block
          const block = Array(8).fill(0).map(() => Array(8).fill(0));
          
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const pixelY = Math.min(blockY + y, height - 1);
              const pixelX = Math.min(blockX + x, width - 1);
              const idx = (pixelY * width + pixelX) * 4;
              
              // Shift from [0,255] to [-128,127]
              block[y][x] = data[idx] - 128;
            }
          }
          
          // Forward DCT
          const dctBlock = performDCT(block);
          
          // Quantize
          const quantizedBlock = quantize(dctBlock, qualityFactor);
          
          // Dequantize
          const dequantizedBlock = dequantize(quantizedBlock, qualityFactor);
          
          // Inverse DCT
          const reconstructedBlock = performIDCT(dequantizedBlock);
          
          // Write back to output (shift back to [0,255] range)
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const pixelY = Math.min(blockY + y, height - 1);
              const pixelX = Math.min(blockX + x, width - 1);
              const idx = (pixelY * width + pixelX) * 4;
              
              // Clamp values to valid range
              const value = Math.max(0, Math.min(255, Math.round(reconstructedBlock[y][x] + 128)));
              
              output.data[idx] = output.data[idx + 1] = output.data[idx + 2] = value;
              output.data[idx + 3] = 255;
            }
          }
        }
      }
      
      return output;
    });
  };

  // Simulating the size reduction
  const calculateCompressionRatio = (quality: number): number => {
    // This is a simplified model based on empirical observations
    // In a real implementation, this would be calculated from actual compressed size
    if (quality < 10) return 25 + Math.random() * 5;
    if (quality < 30) return 15 + Math.random() * 5;
    if (quality < 50) return 10 + Math.random() * 3;
    if (quality < 70) return 6 + Math.random() * 2;
    if (quality < 90) return 3 + Math.random() * 1;
    return 1.5 + Math.random() * 0.5;
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
        <h1 className="text-2xl font-bold mt-2">JPEG Compression</h1>
        <p className="text-muted-foreground">
          Implementation of the basic JPEG algorithm for image compression.
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
                <div className="flex justify-between">
                  <Label>Quality Factor: {qualityFactor}%</Label>
                  <span className="text-sm text-muted-foreground">
                    Est. Compression Ratio: {calculateCompressionRatio(qualityFactor).toFixed(1)}:1
                  </span>
                </div>
                <Slider 
                  value={[qualityFactor]} 
                  min={1}
                  max={100} 
                  step={1}
                  onValueChange={(value) => setQualityFactor(value[0])}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Lower quality = higher compression, but more visual artifacts
                </p>
              </div>
              
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <FileArchive size={18} className="text-primary" />
                JPEG Algorithm
              </h3>
              
              <ProcessingControls
                title="JPEG Compression"
                description="Apply DCT-based compression using the JPEG algorithm principles."
                imageUrl={imageData.original}
                processingFn={performJpegCompression}
              />
              
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <h4 className="font-medium flex items-center gap-2">
                  <Grid size={16} className="text-primary" />
                  Block-Based Processing
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  JPEG processes images in 8×8 pixel blocks. At lower quality settings, 
                  you may see "blocking artifacts" at the boundaries between these blocks.
                </p>
              </div>
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <TheorySection title="About JPEG Compression">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>JPEG (Joint Photographic Experts Group)</strong> is a lossy compression standard 
                    widely used for digital images. It exploits the human visual system's limitations to 
                    achieve high compression ratios while maintaining acceptable visual quality.
                  </p>
                  
                  <h4 className="font-medium">JPEG Algorithm Steps:</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      <strong>Color Space Conversion:</strong> Convert RGB to YCbCr (luminance and chrominance)
                    </li>
                    <li>
                      <strong>Chroma Subsampling:</strong> Reduce resolution of chrominance components
                    </li>
                    <li>
                      <strong>Block Splitting:</strong> Divide the image into 8×8 blocks
                    </li>
                    <li>
                      <strong>Discrete Cosine Transform (DCT):</strong> Transform each block from spatial to frequency domain
                    </li>
                    <li>
                      <strong>Quantization:</strong> Reduce precision of the frequencies based on quality factor
                    </li>
                    <li>
                      <strong>Entropy Coding:</strong> Apply Huffman or arithmetic coding for further compression
                    </li>
                  </ol>
                  
                  <h4 className="font-medium">Quantization</h4>
                  <p>
                    Quantization is the primary source of information loss in JPEG. The algorithm 
                    divides the DCT coefficients by values from a quantization table, and then rounds 
                    to the nearest integer. Higher-frequency components are quantized more aggressively.
                  </p>
                  
                  <h4 className="font-medium">Compression Artifacts</h4>
                  <p>
                    Common JPEG artifacts include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Blocking:</strong> Visible boundaries between 8×8 blocks</li>
                    <li><strong>Ringing:</strong> "Halos" around sharp edges</li>
                    <li><strong>Color Bleeding:</strong> Colors leak across boundaries</li>
                    <li><strong>Blurring:</strong> Loss of fine details</li>
                  </ul>
                </div>
              </TheorySection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JpegCompressionPage;
