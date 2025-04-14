
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ExperimentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  onClick?: () => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  title,
  description,
  icon,
  to,
  onClick,
}) => {
  return (
    <Card 
      className={cn(
        "transition-all duration-300 hover:shadow-md hover:border-primary/50 cursor-pointer", 
        "flex flex-col h-full"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};
