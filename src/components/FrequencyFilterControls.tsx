
import React from 'react';
import { ProcessingControls } from '@/components/ProcessingControls';
import { applyFrequencyFilter } from '@/utils/frequencyFilterUtils';

interface FrequencyFilterControlsProps {
  cutoffFrequency: number;
  imageUrl: string;
}

export const FrequencyFilterControls: React.FC<FrequencyFilterControlsProps> = ({ 
  cutoffFrequency, 
  imageUrl 
}) => {
  
  // Define filter processing functions
  const performLowPassFilter = (imageUrl: string) => {
    return applyFrequencyFilter(imageUrl, 'lowpass', cutoffFrequency);
  };

  const performHighPassFilter = (imageUrl: string) => {
    return applyFrequencyFilter(imageUrl, 'highpass', cutoffFrequency);
  };

  const performBandPassFilter = (imageUrl: string) => {
    return applyFrequencyFilter(imageUrl, 'bandpass', cutoffFrequency);
  };

  const performNotchFilter = (imageUrl: string) => {
    return applyFrequencyFilter(imageUrl, 'notch', cutoffFrequency);
  };

  return (
    <>
      <ProcessingControls
        title="Low-Pass Filter"
        description="Removes high-frequency components, resulting in a smoother image."
        imageUrl={imageUrl}
        processingFn={performLowPassFilter}
      />
      
      <ProcessingControls
        title="High-Pass Filter"
        description="Removes low-frequency components, enhancing edges and details."
        imageUrl={imageUrl}
        processingFn={performHighPassFilter}
      />
      
      <ProcessingControls
        title="Band-Pass Filter"
        description="Preserves a specific range of frequencies, useful for texture analysis."
        imageUrl={imageUrl}
        processingFn={performBandPassFilter}
      />
      
      <ProcessingControls
        title="Notch Filter"
        description="Removes specific frequencies, useful for eliminating periodic noise patterns."
        imageUrl={imageUrl}
        processingFn={performNotchFilter}
      />
    </>
  );
};
