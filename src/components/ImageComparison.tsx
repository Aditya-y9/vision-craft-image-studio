
import React from 'react';

interface ImageComparisonProps {
  originalSrc: string;
  processedSrc: string;
  originalLabel?: string;
  processedLabel?: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalSrc,
  processedSrc,
  originalLabel = 'Original',
  processedLabel = 'Processed',
}) => {
  return (
    <div className="image-comparison">
      <div className="bg-neutral-100 border rounded-lg overflow-hidden">
        <img src={originalSrc} alt="Original" />
        <div className="comparison-label">{originalLabel}</div>
      </div>
      <div className="bg-neutral-100 border rounded-lg overflow-hidden">
        <img src={processedSrc} alt="Processed" />
        <div className="comparison-label">{processedLabel}</div>
      </div>
    </div>
  );
};
