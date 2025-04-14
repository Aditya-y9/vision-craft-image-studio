
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fileToDataUrl } from '@/utils/imageUtils';
import { toast } from 'sonner';
import { ImageData } from '@/types';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, className }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        const file = acceptedFiles[0];
        
        // Check if the file is an image
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload a valid image file');
          return;
        }

        // Convert file to data URL
        const dataUrl = await fileToDataUrl(file);
        
        // Create temporary image to get dimensions
        const img = new Image();
        img.src = dataUrl;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        onImageUpload({
          original: dataUrl,
          filename: file.name,
          width: img.width,
          height: img.height,
          type: file.type,
          size: file.size,
        });

        toast.success(`Successfully loaded ${file.name}`);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors hover:bg-accent/50',
        isDragActive ? 'border-primary bg-accent/50' : 'border-muted',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 rounded-full bg-primary/10">
          {isDragActive ? (
            <FileType size={28} className="text-primary" />
          ) : (
            <Upload size={28} className="text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">
            {isDragActive ? 'Drop the image here' : 'Upload an image to begin'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your image here, or click to browse files
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Supports: PNG, JPG, JPEG, BMP, GIF, TIFF, WebP
          </p>
        </div>
        <Button variant="outline" className="mt-2">
          Browse Files
        </Button>
      </div>
    </div>
  );
};
