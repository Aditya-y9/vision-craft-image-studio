
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brush, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageProcessor } from '@/components/ImageProcessor';
import { ProcessingControls } from '@/components/ProcessingControls';
import { TheorySection } from '@/components/TheorySection';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ImageData } from '@/types';
import { toast } from 'sonner';
import { processImageWithTiming } from '@/utils/imageUtils';

const ColorProcessingPage = () => {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  
  // Color manipulation parameters
  const [redChannel, setRedChannel] = useState(100);
  const [greenChannel, setGreenChannel] = useState(100);
  const [blueChannel, setBlueChannel] = useState(100);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Load image from local storage if available
  useEffect(() => {
    const savedImageData = localStorage.getItem('uploadedImage');
    if (savedImageData) {
      try {
        const parsedData = JSON.parse(savedImageData) as ImageData;
        setImageData(parsedData);
      } catch (error) {
        console.error('Error parsing saved image data:', error);
      }
    }
  }, []);

  const handleImageUpload = (data: ImageData) => {
    setImageData(data);
    localStorage.setItem('uploadedImage', JSON.stringify(data));
  };

  const handleReset = () => {
    if (imageData) {
      const resetData = { ...imageData };
      delete resetData.processingMethod;
      delete resetData.processingTime;
      setImageData(resetData);
    }
    
    // Reset sliders
    setRedChannel(100);
    setGreenChannel(100);
    setBlueChannel(100);
    setBrightness(0);
    setContrast(100);
    setSaturation(100);
  };

  // RGB color manipulation
  const performRGBAdjustment = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      
      for (let i = 0; i < data.length; i += 4) {
        output.data[i] = Math.max(0, Math.min(255, data[i] * redChannel / 100));
        output.data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * greenChannel / 100));
        output.data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * blueChannel / 100));
        output.data[i + 3] = data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h, s, l];
  };

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // HSL adjustment (brightness, contrast, saturation)
  const performHSLAdjustment = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      
      // Brightness and contrast adjustments
      const factor = contrast / 100;
      const brightnessFactor = brightness / 100;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to HSL
        let [h, s, l] = rgbToHsl(r, g, b);
        
        // Apply adjustments
        s = Math.max(0, Math.min(1, s * (saturation / 100)));
        l = Math.max(0, Math.min(1, l * factor + brightnessFactor));
        
        // Convert back to RGB
        const [newR, newG, newB] = hslToRgb(h, s, l);
        
        output.data[i] = newR;
        output.data[i + 1] = newG;
        output.data[i + 2] = newB;
        output.data[i + 3] = data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  // Color space conversions
  const performRGBToGray = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminance formula for gray
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        output.data[i] = gray;
        output.data[i + 1] = gray;
        output.data[i + 2] = gray;
        output.data[i + 3] = data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  // Color inversion
  const performColorInversion = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      
      for (let i = 0; i < data.length; i += 4) {
        output.data[i] = 255 - data[i]; // Invert red
        output.data[i + 1] = 255 - data[i + 1]; // Invert green
        output.data[i + 2] = 255 - data[i + 2]; // Invert blue
        output.data[i + 3] = data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  // Sepia tone filter
  const performSepia = async (imageUrl: string) => {
    return processImageWithTiming(imageUrl, (imageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        output.data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        output.data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        output.data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        output.data[i + 3] = data[i + 3]; // Keep original alpha
      }
      
      return output;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-1"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mt-2">Color Image Processing</h1>
        <p className="text-muted-foreground">
          Manipulate and enhance color images through various techniques.
        </p>
      </div>

      {!imageData ? (
        <ImageUploader onImageUpload={handleImageUpload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ImageProcessor 
              imageData={imageData} 
              onReset={handleReset}
              onProcessedImageChange={(processedImage) => {
                setImageData(prev => prev ? {
                  ...prev,
                  processed: processedImage
                } : null);
              }}
            >
              <div className="mb-8 space-y-4">
                <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                  <Palette size={18} className="text-primary" />
                  RGB Channel Adjustment
                </h3>
                
                <div>
                  <div className="flex justify-between">
                    <Label className="text-red-500">Red: {redChannel}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setRedChannel(100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[redChannel]} 
                    min={0} 
                    max={200} 
                    step={1}
                    onValueChange={(value) => setRedChannel(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label className="text-green-500">Green: {greenChannel}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setGreenChannel(100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[greenChannel]} 
                    min={0} 
                    max={200} 
                    step={1}
                    onValueChange={(value) => setGreenChannel(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label className="text-blue-500">Blue: {blueChannel}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setBlueChannel(100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[blueChannel]} 
                    min={0} 
                    max={200} 
                    step={1}
                    onValueChange={(value) => setBlueChannel(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={() => performRGBAdjustment(imageData.original).then(result => {
                    if (imageData) {
                      setImageData({
                        ...imageData,
                        processed: result.processedImageData,
                        processingMethod: 'RGB Channel Adjustment',
                        processingTime: result.processingTime
                      });
                    }
                  })}
                >
                  <Brush className="mr-2 h-4 w-4" />
                  Apply RGB Adjustment
                </Button>
              </div>
              
              <div className="mb-8 space-y-4 border-t pt-4">
                <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                  <Palette size={18} className="text-primary" />
                  HSL Adjustments
                </h3>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Brightness: {brightness > 0 ? '+' : ''}{brightness}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setBrightness(0)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[brightness]} 
                    min={-100} 
                    max={100} 
                    step={1}
                    onValueChange={(value) => setBrightness(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Contrast: {contrast}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setContrast(100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[contrast]} 
                    min={0} 
                    max={200} 
                    step={1}
                    onValueChange={(value) => setContrast(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Saturation: {saturation}%</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setSaturation(100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider 
                    value={[saturation]} 
                    min={0} 
                    max={200} 
                    step={1}
                    onValueChange={(value) => setSaturation(value[0])}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={() => performHSLAdjustment(imageData.original).then(result => {
                    if (imageData) {
                      setImageData({
                        ...imageData,
                        processed: result.processedImageData,
                        processingMethod: 'HSL Adjustment',
                        processingTime: result.processingTime
                      });
                    }
                  })}
                >
                  <Brush className="mr-2 h-4 w-4" />
                  Apply HSL Adjustment
                </Button>
              </div>
              
              <div className="mb-4 border-t pt-4">
                <h3 className="font-medium text-lg mb-2 flex items-center gap-2">
                  <Palette size={18} className="text-primary" />
                  Color Effects
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <ProcessingControls
                    title="Grayscale"
                    description="Convert color image to grayscale using luminance formula."
                    imageUrl={imageData.original}
                    processingFn={performRGBToGray}
                  />
                  
                  <ProcessingControls
                    title="Color Inversion"
                    description="Invert all color channels (negative effect)."
                    imageUrl={imageData.original}
                    processingFn={performColorInversion}
                  />
                  
                  <ProcessingControls
                    title="Sepia"
                    description="Apply a vintage sepia tone effect to the image."
                    imageUrl={imageData.original}
                    processingFn={performSepia}
                  />
                </div>
              </div>
            </ImageProcessor>
          </div>
          
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-background">
              <TheorySection title="About Color Image Processing">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Color image processing</strong> involves manipulating the individual color 
                    channels of an image to achieve various effects. Unlike grayscale images which have 
                    only one intensity channel, color images typically have three or more channels.
                  </p>
                  
                  <h4 className="font-medium">RGB Color Model</h4>
                  <p>
                    The RGB (Red, Green, Blue) color model is an additive model where colors are formed 
                    by combining different intensities of red, green, and blue light. Each channel typically 
                    uses 8 bits, allowing 256 intensity levels per channel.
                  </p>
                  
                  <h4 className="font-medium">HSL/HSV Color Models</h4>
                  <p>
                    HSL (Hue, Saturation, Lightness) and HSV (Hue, Saturation, Value) are more intuitive 
                    ways to represent colors. Hue represents the color type, saturation the intensity or 
                    purity, and lightness/value the brightness.
                  </p>
                  
                  <h4 className="font-medium">Color Balance</h4>
                  <p>
                    Color balance adjustments modify the RGB intensities to correct color casts or create 
                    artistic effects. Increasing or decreasing individual channels can dramatically affect 
                    the color composition.
                  </p>
                  
                  <h4 className="font-medium">Color Space Conversion</h4>
                  <p>
                    Converting between color spaces (RGB, HSL, CMYK, YUV, etc.) allows for different types 
                    of image manipulations. For example, separating luminance (brightness) from chrominance 
                    (color information) in YUV space enables different types of processing.
                  </p>
                  
                  <h4 className="font-medium">Applications</h4>
                  <p>
                    Color processing is essential in photography, film production, medical imaging, remote 
                    sensing, and many other fields. It can enhance visual appeal, correct imperfections, 
                    highlight specific features, or create artistic effects.
                  </p>
                </div>
              </TheorySection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorProcessingPage;
