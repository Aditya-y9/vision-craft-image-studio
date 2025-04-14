
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HistogramPage from "./pages/HistogramPage";
import SpatialFilteringPage from "./pages/SpatialFilteringPage";
import EdgeDetectionPage from "./pages/EdgeDetectionPage";
import FrequencyDomainPage from "./pages/FrequencyDomainPage";
import JpegCompressionPage from "./pages/JpegCompressionPage";
import SegmentationPage from "./pages/SegmentationPage";
import CompressionPage from "./pages/CompressionPage";
import ArithmeticCodingPage from "./pages/ArithmeticCodingPage";
import ColorProcessingPage from "./pages/ColorProcessingPage";
import NonLinearFilteringPage from "./pages/NonLinearFilteringPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/histogram" element={<HistogramPage />} />
            <Route path="/spatial-filtering" element={<SpatialFilteringPage />} />
            <Route path="/edge-detection" element={<EdgeDetectionPage />} />
            <Route path="/frequency-domain" element={<FrequencyDomainPage />} />
            <Route path="/jpeg-compression" element={<JpegCompressionPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
            <Route path="/compression" element={<CompressionPage />} />
            <Route path="/arithmetic-coding" element={<ArithmeticCodingPage />} />
            <Route path="/color-processing" element={<ColorProcessingPage />} />
            <Route path="/non-linear-filtering" element={<NonLinearFilteringPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
