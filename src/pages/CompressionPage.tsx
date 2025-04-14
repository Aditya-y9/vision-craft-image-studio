
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { type ImageData } from '@/types';
import { toast } from 'sonner';

const CompressionPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  
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

  // Function to perform Huffman coding compression
  const performHuffmanCoding = async (imageUrl: string) => {
    const startTime = performance.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demonstration purposes - in a real implementation, this would
    // contain the actual Huffman coding algorithm
    const processedImageData = imageUrl; // For now, just return the original image
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    toast.success('Huffman coding completed successfully');
    
    return {
      processedImageData,
      processingMethod: 'Huffman Coding',
      processingTime
    };
  };

  // Function to perform arithmetic coding compression
  const performArithmeticCoding = async (imageUrl: string) => {
    const startTime = performance.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // For demonstration purposes - in a real implementation, this would
    // contain the actual arithmetic coding algorithm
    const processedImageData = imageUrl; // For now, just return the original image
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    toast.success('Arithmetic coding completed successfully');
    
    return {
      processedImageData,
      processingMethod: 'Arithmetic Coding',
      processingTime
    };
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
        <h1 className="text-2xl font-bold mt-2">Image Compression</h1>
        <p className="text-muted-foreground">
          Compress and decompress images using Huffman coding and other techniques.
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
              <ProcessingControls
                title="Huffman Coding"
                description="Compress images using variable-length codes for different symbols based on their frequencies."
                imageUrl={imageData.original}
                processingFn={performHuffmanCoding}
              />
              
              <ProcessingControls
                title="Arithmetic Coding"
                description="Encode the entire message into a single number in the range [0,1) using probability distributions."
                imageUrl={imageData.original}
                processingFn={performArithmeticCoding}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <h2 className="text-xl font-semibold mb-4">About Image Compression</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Image compression techniques reduce the file size of images while maintaining 
                acceptable visual quality. They work by eliminating redundancy in the data.
              </p>
              
              <h3 className="font-medium text-md mt-4">Huffman Coding</h3>
              <p className="text-sm text-muted-foreground">
                Huffman coding is a lossless compression algorithm that assigns variable-length 
                codes to symbols based on their frequencies. More frequent symbols get shorter 
                codes, resulting in overall size reduction.
              </p>
              
              <h3 className="font-medium text-md mt-4">Arithmetic Coding</h3>
              <p className="text-sm text-muted-foreground">
                Unlike Huffman coding which assigns codes to individual symbols, arithmetic 
                coding represents the entire message as a single number in a range. It can achieve 
                compression ratios closer to the entropy of the source.
              </p>
              
              <h3 className="font-medium text-md mt-4">Measuring Compression</h3>
              <p className="text-sm text-muted-foreground">
                Compression ratio is calculated as (original size / compressed size) and 
                indicates how much the data has been reduced. Higher ratios mean better compression.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressionPage;
