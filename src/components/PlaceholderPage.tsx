
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from './ImageUploader';
import { ImageData } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const navigate = useNavigate();
  const [imageData, setImageData] = React.useState<ImageData | null>(null);

  // Load image from local storage if available
  React.useEffect(() => {
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
        <h1 className="text-2xl font-bold mt-2">{title}</h1>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>

      {!imageData ? (
        <ImageUploader onImageUpload={handleImageUpload} />
      ) : (
        <div className="bg-accent/30 p-6 rounded-lg text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={imageData.original} 
              alt="Uploaded" 
              className="max-h-52 rounded-lg border shadow-sm" 
            />
          </div>
          <h3 className="font-medium text-lg">
            {imageData.filename} loaded successfully!
          </h3>
          <p className="text-muted-foreground mt-6 mb-4">
            This module is coming soon! Check out the Histogram Processing module to see a complete implementation example.
          </p>
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/histogram')}
            >
              Try Histogram Processing
            </Button>
          </div>
        </div>
      )}

      <div className="mt-12 p-6 border rounded-lg bg-background">
        <h2 className="text-xl font-semibold mb-4">About {title}</h2>
        <p className="text-muted-foreground mb-6">
          {description} This module will demonstrate a thorough understanding of the underlying mathematical principles and 
          practical applications in digital image processing.
        </p>
        
        <div className="theory-section">
          <h3 className="font-semibold text-lg mb-2">Coming Soon!</h3>
          <p className="text-sm text-muted-foreground">
            This experiment will be fully implemented in the next version. For now, please explore the Histogram Processing module
            to see an example of the comprehensive implementation that will be applied to all experiments.
          </p>
        </div>
      </div>
    </div>
  );
};
