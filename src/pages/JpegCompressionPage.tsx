import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileArchive, Grid, LayersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ImageData } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming, rgbToGrayscale } from '@/utils/imageUtils';
import { ImageComparison } from '@/components/ImageComparison';

interface IntermediateOutputs {
  originalBlock?: number[][];
  dctBlock?: number[][];
  quantizedBlock?: number[][];
  dequantizedBlock?: number[][];
  reconstructedBlock?: number[][];
  visualizedBlocks?: {
    original: string;
    dct: string;
    quantized: string;
    dequantized: string;
    reconstructed: string;
  };
}

const JpegCompressionPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [qualityFactor, setQualityFactor] = useState(50);
  const [intermediateOutputs, setIntermediateOutputs] = useState<IntermediateOutputs | null>(null);
  const [selectedBlockX, setSelectedBlockX] = useState(0);
  const [selectedBlockY, setSelectedBlockY] = useState(0);
  
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
    setIntermediateOutputs(null);
  };

  const handleReset = () => {
    if (imageData) {
      const resetData = { ...imageData };
      delete resetData.processingMethod;
      delete resetData.processingTime;
      setImageData(resetData);
      setIntermediateOutputs(null);
    }
  };

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

  const visualizeMatrix = (matrix: number[][], min: number, max: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    
    const cellSize = 10;
    
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const value = Math.max(0, Math.min(1, (matrix[y][x] - min) / (max - min)));
        
        const r = Math.floor(255 * value);
        const b = Math.floor(255 * (1 - value));
        const g = Math.floor(100 * (1 - Math.abs(2 * value - 1)));
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    return canvas.toDataURL();
  };

  const performJpegCompression = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const grayImage = rgbToGrayscale(imageData);
      const { width, height, data } = grayImage;
      
      const output = new ImageData(width, height);
      
      let sampleBlockX = Math.min(selectedBlockX, Math.floor(width / 8) - 1) * 8;
      let sampleBlockY = Math.min(selectedBlockY, Math.floor(height / 8) - 1) * 8;
      
      for (let blockY = 0; blockY < height; blockY += 8) {
        for (let blockX = 0; blockX < width; blockX += 8) {
          const block = Array(8).fill(0).map(() => Array(8).fill(0));
          
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const pixelY = Math.min(blockY + y, height - 1);
              const pixelX = Math.min(blockX + x, width - 1);
              const idx = (pixelY * width + pixelX) * 4;
              
              block[y][x] = data[idx] - 128;
            }
          }
          
          const dctBlock = performDCT(block);
          
          const quantizedBlock = quantize(dctBlock, qualityFactor);
          
          const dequantizedBlock = dequantize(quantizedBlock, qualityFactor);
          
          const reconstructedBlock = performIDCT(dequantizedBlock);
          
          if (blockX === sampleBlockX && blockY === sampleBlockY) {
            const originalBlock = block.map(row => [...row]);
            const dctBlockCopy = dctBlock.map(row => [...row]);
            const quantizedBlockCopy = quantizedBlock.map(row => [...row]);
            const dequantizedBlockCopy = dequantizedBlock.map(row => [...row]);
            const reconstructedBlockCopy = reconstructedBlock.map(row => [...row]);

            const dctValues = dctBlock.flat();
            const dctMin = Math.min(...dctValues);
            const dctMax = Math.max(...dctValues);
            
            const quantValues = quantizedBlock.flat();
            const quantMin = Math.min(...quantValues);
            const quantMax = Math.max(...quantValues);
            
            const dequantValues = dequantizedBlock.flat();
            const dequantMin = Math.min(...dequantValues);
            const dequantMax = Math.max(...dequantValues);
            
            setIntermediateOutputs({
              originalBlock,
              dctBlock: dctBlockCopy,
              quantizedBlock: quantizedBlockCopy,
              dequantizedBlock: dequantizedBlockCopy,
              reconstructedBlock: reconstructedBlockCopy,
              visualizedBlocks: {
                original: visualizeMatrix(originalBlock, -128, 127),
                dct: visualizeMatrix(dctBlockCopy, dctMin, dctMax),
                quantized: visualizeMatrix(quantizedBlockCopy, quantMin, quantMax),
                dequantized: visualizeMatrix(dequantizedBlockCopy, dequantMin, dequantMax),
                reconstructed: visualizeMatrix(reconstructedBlockCopy, -128, 127)
              }
            });
          }
          
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const pixelY = Math.min(blockY + y, height - 1);
              const pixelX = Math.min(blockX + x, width - 1);
              const idx = (pixelY * width + pixelX) * 4;
              
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

  const calculateCompressionRatio = (quality: number): number => {
    if (quality < 10) return 25 + Math.random() * 5;
    if (quality < 30) return 15 + Math.random() * 5;
    if (quality < 50) return 10 + Math.random() * 3;
    if (quality < 70) return 6 + Math.random() * 2;
    if (quality < 90) return 3 + Math.random() * 1;
    return 1.5 + Math.random() * 0.5;
  };

  const handleBlockSelection = (x: number, y: number) => {
    if (!imageData) return;
    
    setSelectedBlockX(x);
    setSelectedBlockY(y);
    
    setIntermediateOutputs(null);
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
                
                <div className="flex items-center gap-2 mt-3">
                  <Label>Block selection:</Label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={0}
                      max={Math.floor((imageData.width || 1) / 8) - 1}
                      value={selectedBlockX} 
                      onChange={(e) => setSelectedBlockX(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <input 
                      type="number" 
                      min={0}
                      max={Math.floor((imageData.height || 1) / 8) - 1}
                      value={selectedBlockY} 
                      onChange={(e) => setSelectedBlockY(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBlockSelection(selectedBlockX, selectedBlockY)}
                    >
                      Set Block
                    </Button>
                  </div>
                </div>
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
              
              {intermediateOutputs && (
                <div className="mt-6 p-4 border rounded-lg bg-card">
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                    <LayersIcon size={18} className="text-primary" />
                    JPEG Compression Steps
                  </h3>
                  
                  <Tabs defaultValue="visualized">
                    <TabsList className="mb-2">
                      <TabsTrigger value="visualized">Visual Representation</TabsTrigger>
                      <TabsTrigger value="numeric">Numeric Values</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="visualized" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Visualization of 8x8 block at position ({selectedBlockX}, {selectedBlockY}):
                      </p>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={intermediateOutputs.visualizedBlocks?.original} 
                            alt="Original block" 
                            className="border"
                          />
                          <span className="text-xs font-medium">Original</span>
                          <span className="text-xs text-muted-foreground">[-128,127]</span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={intermediateOutputs.visualizedBlocks?.dct} 
                            alt="DCT block" 
                            className="border"
                          />
                          <span className="text-xs font-medium">DCT</span>
                          <span className="text-xs text-muted-foreground">Frequency domain</span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={intermediateOutputs.visualizedBlocks?.quantized} 
                            alt="Quantized block" 
                            className="border"
                          />
                          <span className="text-xs font-medium">Quantized</span>
                          <span className="text-xs text-muted-foreground">Lossy step</span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={intermediateOutputs.visualizedBlocks?.dequantized} 
                            alt="Dequantized block" 
                            className="border"
                          />
                          <span className="text-xs font-medium">Dequantized</span>
                          <span className="text-xs text-muted-foreground">Approximation</span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1">
                          <img 
                            src={intermediateOutputs.visualizedBlocks?.reconstructed} 
                            alt="Reconstructed block" 
                            className="border"
                          />
                          <span className="text-xs font-medium">Reconstructed</span>
                          <span className="text-xs text-muted-foreground">[-128,127]</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-2 rounded bg-muted/40">
                        <p className="text-xs">
                          <span className="font-medium">Color scale:</span> Blue = low values, Red = high values
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="numeric" className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Numeric values of 8x8 block at position ({selectedBlockX}, {selectedBlockY}):
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Original Block (shifted by -128)</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {intermediateOutputs.originalBlock?.map(row => 
                              row.map(val => val.toFixed(0).padStart(4)).join(' ')
                            ).join('\n')}
                          </pre>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">DCT Coefficients</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {intermediateOutputs.dctBlock?.map(row => 
                              row.map(val => val.toFixed(1).padStart(7)).join(' ')
                            ).join('\n')}
                          </pre>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Quantized DCT Coefficients</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {intermediateOutputs.quantizedBlock?.map(row => 
                              row.map(val => val.toFixed(0).padStart(4)).join(' ')
                            ).join('\n')}
                          </pre>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Dequantized DCT Coefficients</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {intermediateOutputs.dequantizedBlock?.map(row => 
                              row.map(val => val.toFixed(1).padStart(7)).join(' ')
                            ).join('\n')}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Reconstructed Block (before +128 shift)</h4>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {intermediateOutputs.reconstructedBlock?.map(row => 
                            row.map(val => val.toFixed(1).padStart(7)).join(' ')
                          ).join('\n')}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              
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
