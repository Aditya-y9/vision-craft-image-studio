
import React from 'react';
import { TheorySection } from '@/components/TheorySection';

export const FrequencyDomainTheory: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 bg-background">
      <TheorySection title="About Frequency Domain Filtering">
        <div className="space-y-4 text-sm">
          <p>
            <strong>Frequency domain filtering</strong> involves transforming an image from the 
            spatial domain to the frequency domain using the Fast Fourier Transform (FFT), 
            applying filters, and then transforming back to the spatial domain.
          </p>
          
          <h4 className="font-medium">Fourier Transform</h4>
          <p>
            The Fourier Transform decomposes an image into its sine and cosine components, 
            representing the image as a sum of sinusoids of different frequencies. The 2D FFT 
            is defined as:
          </p>
          <p>
            F(u,v) = ∑∑ f(x,y) × e^(-j2π(ux/M+vy/N))
          </p>
          
          <h4 className="font-medium">Low-Pass Filtering</h4>
          <p>
            Low-pass filters suppress high-frequency components while allowing low-frequency 
            components to pass. This results in smoothing or blurring of the image, reducing noise and detail.
          </p>
          
          <h4 className="font-medium">High-Pass Filtering</h4>
          <p>
            High-pass filters do the opposite, suppressing low-frequency components while 
            enhancing high-frequency ones. This results in edge enhancement and sharpening.
          </p>
          
          <h4 className="font-medium">Band-Pass/Notch Filtering</h4>
          <p>
            Band-pass filters allow a specific range of frequencies to pass while blocking others. 
            Notch filters remove specific frequency components, useful for removing periodic noise patterns.
          </p>
          
          <h4 className="font-medium">Applications</h4>
          <p>
            Frequency domain filtering is essential in image restoration, enhancement, and analysis. 
            It's used in medical imaging, remote sensing, and various scientific applications where 
            specific frequency analysis is required.
          </p>
        </div>
      </TheorySection>
    </div>
  );
};
