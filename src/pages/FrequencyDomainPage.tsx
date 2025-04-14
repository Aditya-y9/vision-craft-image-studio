
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { ImageData as CustomImageData } from '@/types';
import { FrequencyFilterControls } from '@/components/FrequencyFilterControls';
import { FrequencyDomainTheory } from '@/components/FrequencyDomainTheory';

const FrequencyDomainPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<CustomImageData | null>(null);
  const [cutoffFrequency, setCutoffFrequency] = useState(50);
  
  // Load image from local storage if available
  useEffect(() => {
    const savedImageData = localStorage.getItem('uploadedImage');
    if (savedImageData) {
      try {
        const parsedData = JSON.parse(savedImageData) as CustomImageData;
        setImageData(parsedData);
      } catch (error) {
        console.error('Error parsing saved image data:', error);
      }
    }
  }, []);

  const handleImageUpload = (data: CustomImageData) => {
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
        <h1 className="text-2xl font-bold mt-2">Frequency Domain Filtering</h1>
        <p className="text-muted-foreground">
          Apply filters in the frequency domain using the Fast Fourier Transform (FFT).
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
                <Label>Cutoff Frequency: {cutoffFrequency}%</Label>
                <Slider 
                  value={[cutoffFrequency]} 
                  min={5}
                  max={95} 
                  step={5}
                  onValueChange={(value) => setCutoffFrequency(value[0])}
                  className="mt-2"
                />
              </div>
              
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                <Waves size={18} className="text-primary" />
                Frequency Domain Filters
              </h3>
              
              <FrequencyFilterControls 
                cutoffFrequency={cutoffFrequency}
                imageUrl={imageData.original}
              />
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <FrequencyDomainTheory />
          </div>
        </div>
      )}
    </div>
  );
};

export default FrequencyDomainPage;
