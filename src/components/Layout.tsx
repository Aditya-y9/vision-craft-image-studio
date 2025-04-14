
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleSidebar}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-lg font-medium">Vision Craft: Image Processing Studio</h1>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          Digital Image Processing Laboratory 2025 - <span className="font-medium">Academic Project</span>
        </footer>
      </div>
    </div>
  );
};
