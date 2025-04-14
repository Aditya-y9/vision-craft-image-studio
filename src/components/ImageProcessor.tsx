
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageData, ProcessingResult } from '@/types';
import { RotateCcw, Download, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface ImageProcessorProps {
  imageData: ImageData;
  onReset: () => void;
  onProcessedImageChange?: (processedImage: string) => void;
  children?: React.ReactNode;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  imageData,
  onReset,
  onProcessedImageChange,
  children
}) => {
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [displayImage, setDisplayImage] = useState<string>(imageData.original);
  
  const handleProcessedImage = (result: ProcessingResult) => {
    // Add current image to history
    const newHistory = [
      ...history.slice(0, historyIndex + 1), 
      displayImage
    ];
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Update display image
    setDisplayImage(result.processedImageData);
    
    // Call parent callback if provided
    if (onProcessedImageChange) {
      onProcessedImageChange(result.processedImageData);
    }
  };

  const handleUndo = () => {
    if (historyIndex > -1) {
      const previousImage = history[historyIndex];
      setDisplayImage(previousImage);
      setHistoryIndex(historyIndex - 1);
      
      if (onProcessedImageChange) {
        onProcessedImageChange(previousImage);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextImage = history[historyIndex + 1];
      setDisplayImage(nextImage);
      setHistoryIndex(historyIndex + 1);
      
      if (onProcessedImageChange) {
        onProcessedImageChange(nextImage);
      }
    }
  };

  const handleReset = () => {
    setDisplayImage(imageData.original);
    onReset();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `processed-${imageData.filename}`;
    link.href = displayImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully');
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="image-canvas-container bg-neutral-100 border">
        <img 
          src={displayImage} 
          alt="Processing preview" 
          className="image-display"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            title="Reset to original image"
          >
            <RotateCcw size={16} className="mr-1" /> Reset
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex < 0}
            title="Undo last operation"
          >
            <Undo size={16} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo operation"
          >
            <Redo size={16} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleDownload}
            title="Download processed image"
          >
            <Download size={16} className="mr-1" /> Download
          </Button>
        </div>
      </div>
      
      {/* Image processing controls */}
      <div className="mt-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              imageUrl: imageData.original,
              onProcessingComplete: handleProcessedImage,
            });
          }
          return child;
        })}
      </div>
      
      {/* Image info */}
      <div className="mt-4 p-2 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        <p>Filename: <span className="font-medium">{imageData.filename}</span></p>
        <p>Dimensions: <span className="font-medium">{imageData.width} × {imageData.height} px</span></p>
        {imageData.processingMethod && (
          <p>
            Last operation: <span className="font-medium">{imageData.processingMethod}</span>
            {imageData.processingTime && (
              <span className="text-xs ml-2">
                ({imageData.processingTime.toFixed(2)} ms)
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};
