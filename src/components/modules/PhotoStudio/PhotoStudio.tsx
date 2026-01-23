'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Camera, Sparkles, Image, User, ArrowUp, Eraser,
  Loader2, X, Download, ChevronLeft, ChevronRight, Trash2,
  RotateCcw, Palette, Zap, Check, AlertCircle, Upload
} from 'lucide-react';

interface PhotoStudioProps {
  onBack: () => void;
}

type Tool = 'enhance' | 'background' | 'retouch' | 'upscale' | 'remove' | 'headshot' | 'artstyle';

interface ToolConfig {
  id: Tool;
  name: string;
  icon: React.ReactNode;
  description: string;
  cost: string;
  endpoint: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: string;
  error?: string;
}

interface ProcessingJob {
  imageId: string;
  tool: Tool;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  result?: string;
  error?: string;
  cost?: number;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'enhance',
    name: 'Enhance',
    icon: <Sparkles size={20} />,
    description: 'One-tap HD enhancement with AI',
    cost: '$0.012',
    endpoint: '/photo-studio/enhance',
  },
  {
    id: 'background',
    name: 'BG Remove',
    icon: <Image size={20} />,
    description: 'Remove or replace background',
    cost: '$0.018',
    endpoint: '/photo-studio/background/remove',
  },
  {
    id: 'retouch',
    name: 'Retouch',
    icon: <User size={20} />,
    description: 'Portrait retouching & skin smoothing',
    cost: '$0.024',
    endpoint: '/photo-studio/retouch',
  },
  {
    id: 'upscale',
    name: 'Upscale',
    icon: <ArrowUp size={20} />,
    description: 'Upscale images 2x, 4x, or 8x',
    cost: '$0.012-$0.036',
    endpoint: '/photo-studio/upscale',
  },
  {
    id: 'remove',
    name: 'Object Rm',
    icon: <Eraser size={20} />,
    description: 'Remove unwanted objects',
    cost: '$0.030',
    endpoint: '/photo-studio/remove-object',
  },
  {
    id: 'headshot',
    name: 'Headshot',
    icon: <Camera size={20} />,
    description: 'Generate professional headshots',
    cost: '$1.80',
    endpoint: '/photo-studio/headshot/generate',
  },
  {
    id: 'artstyle',
    name: 'Art Style',
    icon: <Palette size={20} />,
    description: 'Transform to various art styles',
    cost: '$0.024',
    endpoint: '/photo-studio/art-style',
  },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export default function PhotoStudio({ onBack }: PhotoStudioProps) {
  // Upload state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool state
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [processing, setProcessing] = useState(false);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  // Before/After comparison
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Enhancement options
  const [enhanceLevel, setEnhanceLevel] = useState(50);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4 | 8>(2);

  // Cost tracking
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Calculate estimated cost when images or tool changes
  useEffect(() => {
    if (!selectedTool || images.length === 0) {
      setEstimatedCost(0);
      return;
    }

    const tool = TOOLS.find(t => t.id === selectedTool);
    if (!tool) return;

    // Parse base cost (take first number if range)
    const baseCost = parseFloat(tool.cost.replace('$', '').split('-')[0]);

    // Calculate for all selected images
    let cost = baseCost * images.filter(img => img.status !== 'done').length;

    // Adjust for upscale factor
    if (selectedTool === 'upscale') {
      cost = cost * (upscaleFactor === 2 ? 1 : upscaleFactor === 4 ? 2 : 3);
    }

    setEstimatedCost(cost);
  }, [selectedTool, images, upscaleFactor]);

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, 50 - images.length) // Max 50 images
      .map(file => ({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return newImages;
    });
  }, []);

  const clearAllImages = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setSelectedImageIndex(0);
  }, [images]);

  // Process images with selected tool
  const processImages = useCallback(async () => {
    if (!selectedTool || images.length === 0) return;

    const tool = TOOLS.find(t => t.id === selectedTool);
    if (!tool) return;

    setProcessing(true);
    setError(null);

    const pendingImages = images.filter(img => img.status === 'pending');

    for (const image of pendingImages) {
      // Update status to processing
      setImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, status: 'processing' as const } : img
      ));

      try {
        const formData = new FormData();
        formData.append('image', image.file);
        formData.append('tool', selectedTool);

        if (selectedTool === 'enhance') {
          formData.append('level', enhanceLevel.toString());
        }
        if (selectedTool === 'upscale') {
          formData.append('factor', upscaleFactor.toString());
        }

        const response = await fetch(`${BACKEND_URL}${tool.endpoint}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Processing failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Update image with result
        setImages(prev => prev.map(img =>
          img.id === image.id
            ? { ...img, status: 'done' as const, result: result.image_url }
            : img
        ));

        // Track cost
        const cost = result.cost_charged || 0;
        setTotalSpent(prev => prev + cost);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Processing failed';
        setImages(prev => prev.map(img =>
          img.id === image.id
            ? { ...img, status: 'error' as const, error: errorMessage }
            : img
        ));
        setError(errorMessage);
      }
    }

    setProcessing(false);
    setShowComparison(true);
  }, [selectedTool, images, enhanceLevel, upscaleFactor]);

  // Comparison slider handler
  const handleSliderMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!comparisonRef.current) return;

    const rect = comparisonRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  }, []);

  // Download processed image
  const downloadImage = useCallback(async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download image');
    }
  }, []);

  const currentImage = images[selectedImageIndex];

  return (
    <div className="flex-1 flex flex-col bg-panel-dark overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Camera size={24} className="text-blue-400" />
          <h1 className="text-lg font-bold">AI Photo Studio</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Cost Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-sm text-zinc-400">
              {estimatedCost > 0 ? `~$${estimatedCost.toFixed(3)}` : '$0.00'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)}>
                <X size={16} className="text-red-400" />
              </button>
            </div>
          )}

          {/* Upload Zone */}
          {images.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={e => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload size={48} className="mx-auto mb-4 text-zinc-500" />
              <h3 className="text-lg font-medium mb-2">
                {isDragging ? 'Drop photos here' : 'Tap to upload or drag photos here'}
              </h3>
              <p className="text-sm text-zinc-500">
                Supports: JPG, PNG, WEBP, HEIC | Up to 50 images at once
              </p>
            </div>
          ) : (
            <>
              {/* Image Preview Area */}
              <div className="bg-zinc-800/50 rounded-2xl overflow-hidden">
                {/* Main Image Display */}
                <div className="relative aspect-[4/3] bg-zinc-900">
                  {currentImage && (
                    <>
                      {showComparison && currentImage.result ? (
                        // Before/After Comparison View
                        <div
                          ref={comparisonRef}
                          className="relative w-full h-full cursor-ew-resize"
                          onMouseMove={handleSliderMove}
                          onTouchMove={handleSliderMove}
                        >
                          {/* After (full) */}
                          <img
                            src={currentImage.result}
                            alt="After"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                          {/* Before (clipped) */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${sliderPosition}%` }}
                          >
                            <img
                              src={currentImage.preview}
                              alt="Before"
                              className="absolute inset-0 w-full h-full object-contain"
                              style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                            />
                          </div>
                          {/* Slider */}
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                            style={{ left: `${sliderPosition}%` }}
                          >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <ChevronLeft size={14} className="text-zinc-800" />
                              <ChevronRight size={14} className="text-zinc-800" />
                            </div>
                          </div>
                          {/* Labels */}
                          <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/50 text-xs">
                            Before
                          </div>
                          <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/50 text-xs">
                            After
                          </div>
                        </div>
                      ) : (
                        // Single Image View
                        <img
                          src={currentImage.result || currentImage.preview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}

                      {/* Processing Overlay */}
                      {currentImage.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 size={48} className="mx-auto mb-4 text-blue-400 animate-spin" />
                            <p className="text-lg font-medium">Processing...</p>
                            <p className="text-sm text-zinc-400">This may take a few seconds</p>
                          </div>
                        </div>
                      )}

                      {/* Error Overlay */}
                      {currentImage.status === 'error' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                            <p className="text-lg font-medium text-red-400">Processing Failed</p>
                            <p className="text-sm text-zinc-400">{currentImage.error}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-3 border-t border-zinc-700 flex gap-2 overflow-x-auto">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`
                          relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                          ${idx === selectedImageIndex ? 'ring-2 ring-blue-400' : 'opacity-60 hover:opacity-100'}
                        `}
                      >
                        <img
                          src={img.preview}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.status === 'done' && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={10} />
                          </div>
                        )}
                        {img.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                        {img.status === 'error' && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                            <X size={10} />
                          </div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </button>
                    ))}
                    {/* Add More Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-zinc-400 transition-colors"
                    >
                      <span className="text-2xl text-zinc-500">+</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tool Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-400">QUICK TOOLS</h3>
                  <span className="text-xs text-zinc-500">{images.length} image{images.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                      className={`
                        flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                        ${selectedTool === tool.id
                          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white'
                        }
                      `}
                    >
                      {tool.icon}
                      <span className="text-xs font-medium truncate w-full text-center">
                        {tool.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Options */}
              {selectedTool && (
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{TOOLS.find(t => t.id === selectedTool)?.name}</h4>
                      <p className="text-sm text-zinc-400">
                        {TOOLS.find(t => t.id === selectedTool)?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Est. cost</p>
                      <p className="font-medium text-yellow-400">${estimatedCost.toFixed(3)}</p>
                    </div>
                  </div>

                  {/* Enhance Level Slider */}
                  {selectedTool === 'enhance' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Enhancement Level</span>
                        <span className="text-blue-400">{enhanceLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={enhanceLevel}
                        onChange={e => setEnhanceLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Natural</span>
                        <span>Editorial</span>
                      </div>
                    </div>
                  )}

                  {/* Upscale Factor */}
                  {selectedTool === 'upscale' && (
                    <div className="flex gap-2">
                      {([2, 4, 8] as const).map(factor => (
                        <button
                          key={factor}
                          onClick={() => setUpscaleFactor(factor)}
                          className={`
                            flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                            ${upscaleFactor === factor
                              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                              : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
                            }
                          `}
                        >
                          {factor}x
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Process Button */}
                  <button
                    onClick={processImages}
                    disabled={processing || images.every(img => img.status === 'done')}
                    className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Apply to {images.filter(img => img.status === 'pending').length || 'All'} Image{images.filter(img => img.status === 'pending').length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              {currentImage?.status === 'done' && currentImage.result && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    <ChevronRight size={18} />
                    {showComparison ? 'Hide' : 'Compare'}
                  </button>
                  <button
                    onClick={() => downloadImage(currentImage.result!, `enhanced_${currentImage.file.name}`)}
                    className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              )}

              {/* Batch Actions */}
              {images.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setImages(prev => prev.map(img => ({ ...img, status: 'pending' as const, result: undefined })));
                      setShowComparison(false);
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw size={16} />
                    Reset All
                  </button>
                  <button
                    onClick={clearAllImages}
                    className="flex-1 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                </div>
              )}
            </>
          )}

          {/* Cost Summary */}
          {totalSpent > 0 && (
            <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Session Total</p>
                <p className="text-lg font-medium">${totalSpent.toFixed(3)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Images Processed</p>
                <p className="text-lg font-medium">{images.filter(img => img.status === 'done').length}</p>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <p className="text-xs text-zinc-500 text-center">
            Your images are processed securely and deleted within 24 hours. Never used for AI training.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
