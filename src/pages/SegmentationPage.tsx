
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { type ImageData } from '@/types';
import { toast } from 'sonner';

const SegmentationPage = () => {
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

  // Function to perform split and merge segmentation
  const performSplitAndMerge = async (imageUrl: string) => {
    const startTime = performance.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // For demonstration purposes - in a real implementation, this would
    // contain the actual split and merge algorithm
    const processedImageData = imageUrl; // For now, just return the original image
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    toast.success('Split and merge segmentation completed');
    
    return {
      processedImageData,
      processingMethod: 'Split and Merge Segmentation',
      processingTime
    };
  };

  // Function to perform watershed transform segmentation
  const performWatershedTransform = async (imageUrl: string) => {
    const startTime = performance.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demonstration purposes - in a real implementation, this would
    // contain the actual watershed transform algorithm
    const processedImageData = imageUrl; // For now, just return the original image
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    toast.success('Watershed transform completed');
    
    return {
      processedImageData,
      processingMethod: 'Watershed Transform',
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
        <h1 className="text-2xl font-bold mt-2">Image Segmentation</h1>
        <p className="text-muted-foreground">
          Segment images using split and merge techniques and watershed transform.
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
                title="Split and Merge Segmentation"
                description="Recursively split the image into quadrants and merge similar regions."
                imageUrl={imageData.original}
                processingFn={performSplitAndMerge}
              />
              
              <ProcessingControls
                title="Watershed Transform"
                description="Treat the image as a topographic surface and segment it based on watersheds."
                imageUrl={imageData.original}
                processingFn={performWatershedTransform}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <h2 className="text-xl font-semibold mb-4">About Image Segmentation</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Image segmentation is the process of partitioning an image into multiple segments to simplify 
                or change the representation into something more meaningful and easier to analyze.
              </p>
              
              <h3 className="font-medium text-md mt-4">Split and Merge Technique</h3>
              <p className="text-sm text-muted-foreground">
                This approach works by first dividing the image into quadrants and then checking if each 
                quadrant meets a homogeneity criterion. If not, it's further split. Similar adjacent regions 
                are then merged to form the final segmentation.
              </p>
              
              <h3 className="font-medium text-md mt-4">Watershed Transform</h3>
              <p className="text-sm text-muted-foreground">
                This technique treats the image as a topographic surface where pixel values represent heights. 
                The algorithm finds "watershed lines" which divide the image into regions, similar to how 
                water basins are separated in geography.
              </p>
              
              <h3 className="font-medium text-md mt-4">Applications</h3>
              <p className="text-sm text-muted-foreground">
                Image segmentation is crucial in medical imaging, object detection, recognition tasks, 
                and satellite image analysis. It helps in identifying objects and boundaries in images.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentationPage;
