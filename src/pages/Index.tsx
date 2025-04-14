
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Filter, Scissors, PieChart, Wand2, 
  ImageIcon, Layers, Download, Grid3X3, Palette, 
  FileUp, ExternalLink 
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { ExperimentCard } from '@/components/ExperimentCard';
import { ImageData } from '@/types';
import { Button } from '@/components/ui/button';

const experiments = [
  {
    title: 'Arithmetic Coding',
    description: 'Implementation of arithmetic coding techniques for image compression',
    icon: <Grid3X3 size={20} className="text-primary" />,
    path: '/arithmetic-coding',
  },
  {
    title: 'Histogram Processing',
    description: 'Display histograms and apply histogram equalization for image enhancement',
    icon: <BarChart size={20} className="text-primary" />,
    path: '/histogram',
  },
  {
    title: 'Non-linear Filtering',
    description: 'Advanced non-linear filtering techniques for image enhancement',
    icon: <Wand2 size={20} className="text-primary" />,
    path: '/non-linear-filtering',
  },
  {
    title: 'Edge Detection',
    description: 'Edge detection using various operators like Sobel, Prewitt, and Canny',
    icon: <Scissors size={20} className="text-primary" />,
    path: '/edge-detection',
  },
  {
    title: 'Frequency Domain Filtering',
    description: 'Apply filters in the frequency domain using Fourier transforms',
    icon: <PieChart size={20} className="text-primary" />,
    path: '/frequency-domain',
  },
  {
    title: 'JPEG Compression',
    description: 'Implementation of basic JPEG compression algorithm',
    icon: <ImageIcon size={20} className="text-primary" />,
    path: '/jpeg-compression',
  },
  {
    title: 'Image Enhancement',
    description: 'Enhance images using histogram processing and spatial filtering',
    icon: <Filter size={20} className="text-primary" />,
    path: '/spatial-filtering',
  },
  {
    title: 'Image Segmentation',
    description: 'Segment images using split-merge and watershed techniques',
    icon: <Layers size={20} className="text-primary" />,
    path: '/segmentation',
  },
  {
    title: 'Image Compression',
    description: 'Techniques for image compression and decompression',
    icon: <Download size={20} className="text-primary" />,
    path: '/compression',
  },
  {
    title: 'Color Image Processing',
    description: 'Manipulation and enhancement of color images',
    icon: <Palette size={20} className="text-primary" />,
    path: '/color-processing',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null);

  const handleImageUpload = (imageData: ImageData) => {
    setUploadedImage(imageData);
    localStorage.setItem('uploadedImage', JSON.stringify(imageData));
  };

  const handleExperimentClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto">
      <section className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Digital Image Processing Laboratory</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive suite of image processing algorithms and techniques
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {!uploadedImage ? (
            <ImageUploader onImageUpload={handleImageUpload} />
          ) : (
            <div className="bg-accent/30 p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={uploadedImage.original} 
                  alt="Uploaded" 
                  className="max-h-52 rounded-lg border shadow-sm" 
                />
              </div>
              <h3 className="font-medium text-lg">
                {uploadedImage.filename}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {uploadedImage.width} × {uploadedImage.height} pixels
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setUploadedImage(null)}
                >
                  <FileUp size={16} className="mr-1" /> Change Image
                </Button>
                <Button
                  onClick={() => navigate('/histogram')}
                >
                  <ExternalLink size={16} className="mr-1" /> Start Processing
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Available Experiments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <ExperimentCard
              key={exp.title}
              title={exp.title}
              description={exp.description}
              icon={exp.icon}
              to={exp.path}
              onClick={() => handleExperimentClick(exp.path)}
            />
          ))}
        </div>
      </section>

      <section className="mt-12 text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">About This Project</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This application demonstrates a comprehensive understanding of Digital Image Processing concepts and techniques.
          Each experiment is implemented with a focus on theoretical understanding and practical application,
          showcasing the fundamental principles of image processing.
        </p>
      </section>
    </div>
  );
};

export default Index;
