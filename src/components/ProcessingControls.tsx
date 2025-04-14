
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Lightbulb } from 'lucide-react';
import { ProcessingResult } from '@/types';

interface ProcessingControlsProps {
  title: string;
  description: string;
  imageUrl: string;
  onProcessingComplete?: (result: ProcessingResult) => void;
  processingFn: (imageUrl: string) => Promise<ProcessingResult>;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  title,
  description,
  imageUrl,
  onProcessingComplete,
  processingFn,
  disabled = false,
  children,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  
  const handleProcess = async () => {
    if (!imageUrl || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingTime(null);
    
    try {
      const result = await processingFn(imageUrl);
      setProcessingTime(result.processingTime);
      
      if (onProcessingComplete) {
        onProcessingComplete(result);
      }
    } catch (error) {
      console.error('Error during image processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="algorithm-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Lightbulb size={18} className="text-primary" />
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          
          {/* Processing parameters form */}
          {children && (
            <div className="processing-parameters">
              {children}
            </div>
          )}
          
          {processingTime !== null && (
            <span className="processing-time">
              Processing completed in {processingTime.toFixed(2)} ms
            </span>
          )}
        </div>
        
        <Button 
          disabled={disabled || isProcessing || !imageUrl} 
          onClick={handleProcess}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Process
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
