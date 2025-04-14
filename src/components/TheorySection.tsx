
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface TheorySectionProps {
  title: string;
  children: React.ReactNode;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="theory-section">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <span>{title}</span>
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} className="mr-1" />
              Hide Theory
            </>
          ) : (
            <>
              <ChevronDown size={16} className="mr-1" />
              View Theory
            </>
          )}
        </Button>
      </div>
      
      {expanded && (
        <div className="mt-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};
