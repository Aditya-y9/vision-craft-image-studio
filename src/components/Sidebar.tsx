
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BarChart, 
  Filter, 
  Scissors, 
  Image as ImageIcon, 
  Layers, 
  PieChart, 
  Palette, 
  Download, 
  Grid3X3, 
  Wand2 
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <div className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="flex items-center gap-2">
          <ImageIcon size={24} className="text-primary" />
          <span className="font-semibold">DIP Laboratory</span>
        </div>
      </div>
      
      <div className="sidebar-content">
        <nav className="py-2">
          <NavLink 
            to="/" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Home size={18} />
            <span className="sidebar-item-text">Dashboard</span>
          </NavLink>
          
          <div className="sidebar-section-title">Basic Processing</div>
          <NavLink 
            to="/histogram" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <BarChart size={18} />
            <span className="sidebar-item-text">Histogram Processing</span>
          </NavLink>
          
          <NavLink 
            to="/spatial-filtering" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Filter size={18} />
            <span className="sidebar-item-text">Spatial Filtering</span>
          </NavLink>
          
          <NavLink 
            to="/edge-detection" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Scissors size={18} />
            <span className="sidebar-item-text">Edge Detection</span>
          </NavLink>
          
          <NavLink 
            to="/frequency-domain" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <PieChart size={18} />
            <span className="sidebar-item-text">Frequency Filtering</span>
          </NavLink>
          
          <div className="sidebar-section-title">Advanced Processing</div>
          
          <NavLink 
            to="/jpeg-compression" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <ImageIcon size={18} />
            <span className="sidebar-item-text">JPEG Compression</span>
          </NavLink>
          
          <NavLink 
            to="/segmentation" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Layers size={18} />
            <span className="sidebar-item-text">Image Segmentation</span>
          </NavLink>
          
          <NavLink 
            to="/compression" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Download size={18} />
            <span className="sidebar-item-text">Image Compression</span>
          </NavLink>
          
          <NavLink 
            to="/arithmetic-coding" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Grid3X3 size={18} />
            <span className="sidebar-item-text">Arithmetic Coding</span>
          </NavLink>
          
          <NavLink 
            to="/color-processing" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Palette size={18} />
            <span className="sidebar-item-text">Color Processing</span>
          </NavLink>
          
          <NavLink 
            to="/non-linear-filtering" 
            className={({isActive}) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={() => onClose()}
          >
            <Wand2 size={18} />
            <span className="sidebar-item-text">Non-linear Filtering</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
