
import React, { useState } from 'react';
import { ProcessingControls } from '@/components/ProcessingControls';
import { applyFrequencyFilter } from '@/utils/frequencyFilterUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, FileImage, ChartBar } from 'lucide-react';

interface FrequencyFilterControlsProps {
  cutoffFrequency: number;
  imageUrl: string;
  onProcessingComplete?: (result: any) => void;
}

interface ProcessingSteps {
  original: string;
  frequencyDomain?: string;
  filteredFrequencyDomain?: string;
  result?: string;
  filterType?: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
}

export const FrequencyFilterControls: React.FC<FrequencyFilterControlsProps> = ({ 
  cutoffFrequency, 
  imageUrl,
  onProcessingComplete
}) => {
  const [processingSteps, setProcessingSteps] = useState<ProcessingSteps>({ original: imageUrl });
  
  // Define filter processing functions
  const performLowPassFilter = async (imageUrl: string) => {
    const result = await applyFrequencyFilter(imageUrl, 'lowpass', cutoffFrequency, true);
    
    // Store intermediate steps for visualization
    setProcessingSteps({
      original: imageUrl,
      frequencyDomain: result.intermediateOutputs?.frequencyDomain,
      filteredFrequencyDomain: result.intermediateOutputs?.filteredFrequencyDomain,
      result: result.processedImageData,
      filterType: 'lowpass'
    });
    
    if (onProcessingComplete) {
      onProcessingComplete(result);
    }
    
    return result;
  };

  const performHighPassFilter = async (imageUrl: string) => {
    const result = await applyFrequencyFilter(imageUrl, 'highpass', cutoffFrequency, true);
    
    // Store intermediate steps for visualization
    setProcessingSteps({
      original: imageUrl,
      frequencyDomain: result.intermediateOutputs?.frequencyDomain,
      filteredFrequencyDomain: result.intermediateOutputs?.filteredFrequencyDomain,
      result: result.processedImageData,
      filterType: 'highpass'
    });
    
    if (onProcessingComplete) {
      onProcessingComplete(result);
    }
    
    return result;
  };

  const performBandPassFilter = async (imageUrl: string) => {
    const result = await applyFrequencyFilter(imageUrl, 'bandpass', cutoffFrequency, true);
    
    // Store intermediate steps for visualization
    setProcessingSteps({
      original: imageUrl,
      frequencyDomain: result.intermediateOutputs?.frequencyDomain,
      filteredFrequencyDomain: result.intermediateOutputs?.filteredFrequencyDomain,
      result: result.processedImageData,
      filterType: 'bandpass'
    });
    
    if (onProcessingComplete) {
      onProcessingComplete(result);
    }
    
    return result;
  };

  const performNotchFilter = async (imageUrl: string) => {
    const result = await applyFrequencyFilter(imageUrl, 'notch', cutoffFrequency, true);
    
    // Store intermediate steps for visualization
    setProcessingSteps({
      original: imageUrl,
      frequencyDomain: result.intermediateOutputs?.frequencyDomain,
      filteredFrequencyDomain: result.intermediateOutputs?.filteredFrequencyDomain,
      result: result.processedImageData,
      filterType: 'notch'
    });
    
    if (onProcessingComplete) {
      onProcessingComplete(result);
    }
    
    return result;
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
      
      {/* Visualization of intermediate processing steps */}
      {processingSteps.frequencyDomain && (
        <div className="mt-6 p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
            <Layers size={18} className="text-primary" />
            {processingSteps.filterType?.charAt(0).toUpperCase() + processingSteps.filterType?.slice(1)} Filter Processing Steps
          </h3>
          
          <Tabs defaultValue="visual">
            <TabsList className="mb-2">
              <TabsTrigger value="visual">Visual Representation</TabsTrigger>
              <TabsTrigger value="description">Processing Description</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visual" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-neutral-100 border rounded-lg overflow-hidden w-full aspect-square">
                    <img 
                      src={processingSteps.original}
                      alt="Original image" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium">1. Original Image</span>
                  <span className="text-xs text-muted-foreground">Spatial domain</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-neutral-100 border rounded-lg overflow-hidden w-full aspect-square">
                    <img 
                      src={processingSteps.frequencyDomain}
                      alt="Frequency domain" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium">2. Frequency Domain</span>
                  <span className="text-xs text-muted-foreground">FFT transform</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-neutral-100 border rounded-lg overflow-hidden w-full aspect-square">
                    <img 
                      src={processingSteps.filteredFrequencyDomain} 
                      alt="Filtered frequency domain" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium">3. Filtered Frequency</span>
                  <span className="text-xs text-muted-foreground">{processingSteps.filterType} applied</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-neutral-100 border rounded-lg overflow-hidden w-full aspect-square">
                    <img 
                      src={processingSteps.result}
                      alt="Result image" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium">4. Result Image</span>
                  <span className="text-xs text-muted-foreground">Inverse FFT applied</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="description" className="space-y-4">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 text-primary flex-shrink-0">
                    <FileImage size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">1. Original Image</h4>
                    <p className="text-muted-foreground">
                      This is the input image in the spatial domain, where each pixel represents intensity at a specific location.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 text-primary flex-shrink-0">
                    <ChartBar size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">2. Fast Fourier Transform (FFT)</h4>
                    <p className="text-muted-foreground">
                      The image is transformed from the spatial domain to the frequency domain using FFT.
                      The bright spot in the center represents low frequencies, while the outer regions
                      represent higher frequencies.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 text-primary flex-shrink-0">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">3. Filter Application</h4>
                    <p className="text-muted-foreground">
                      {processingSteps.filterType === 'lowpass' && (
                        "The low-pass filter preserves low frequencies (central region) and attenuates high frequencies (outer region), resulting in a smoother image."
                      )}
                      {processingSteps.filterType === 'highpass' && (
                        "The high-pass filter attenuates low frequencies (central region) and preserves high frequencies (outer region), enhancing edges and details."
                      )}
                      {processingSteps.filterType === 'bandpass' && (
                        "The band-pass filter preserves frequencies within a specific range while attenuating frequencies outside that range."
                      )}
                      {processingSteps.filterType === 'notch' && (
                        "The notch filter removes specific frequencies, often used to eliminate periodic noise patterns."
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 text-primary flex-shrink-0">
                    <FileImage size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">4. Inverse FFT</h4>
                    <p className="text-muted-foreground">
                      The filtered frequency-domain representation is transformed back to the spatial domain
                      using the inverse FFT, resulting in the processed image.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
};
