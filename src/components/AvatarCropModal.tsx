import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
  aspectRatio?: number; // default 1:1
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Viewport size in pixels
  const CROP_BOX_SIZE = 260;

  // Load image
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Draw preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = CROP_BOX_SIZE;
    const height = CROP_BOX_SIZE / aspectRatio;

    canvas.width = width * 2; // retina scaling
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Calculate base cover scaling
    const scaleToCover = Math.max(width / img.width, height / img.height);
    const finalScale = scaleToCover * zoom;

    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;

    // Centered origin + user offset
    const drawX = (width - drawWidth) / 2 + offset.x;
    const drawY = (height - drawHeight) / 2 + offset.y;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }, [zoom, offset, imageLoaded, aspectRatio]);

  useEffect(() => {
    if (imageLoaded && isOpen) {
      drawPreview();
    }
  }, [imageLoaded, isOpen, drawPreview]);

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialOffsetRef.current = { ...offset };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + zoomDelta).toFixed(2))));
  };

  // Confirm Crop
  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    const OUTPUT_SIZE = 480;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE / aspectRatio;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    // High quality smoothing
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    const width = CROP_BOX_SIZE;
    const height = CROP_BOX_SIZE / aspectRatio;

    const scaleToCover = Math.max(width / img.width, height / img.height);
    const finalScale = scaleToCover * zoom;

    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;

    const drawX = (width - drawWidth) / 2 + offset.x;
    const drawY = (height - drawHeight) / 2 + offset.y;

    // Scale factor from preview to output
    const scaleFactor = OUTPUT_SIZE / width;

    outCtx.drawImage(
      img,
      drawX * scaleFactor,
      drawY * scaleFactor,
      drawWidth * scaleFactor,
      drawHeight * scaleFactor
    );

    const croppedBase64 = outCanvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedBase64);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-stone-900 font-sans">
              裁剪与调整头像 (Crop & Adjust)
            </h2>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">
              拖动平移位置，滑动调节缩放
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-5 flex flex-col items-center select-none bg-stone-50/50">
          <div
            className="relative overflow-hidden rounded-2xl border-2 border-stone-300 shadow-md bg-stone-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Live Canvas */}
            <canvas
              ref={canvasRef}
              style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
              className="block pointer-events-none"
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-r border-b border-white/15"></div>
              <div className="border-b border-white/15"></div>
              <div className="border-r border-white/15"></div>
              <div className="border-r border-white/15"></div>
              <div></div>
            </div>

            {/* Drag hint badge */}
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none font-sans">
              <Move size={10} />
              <span>按住拖拽</span>
            </div>
          </div>

          {/* Controls: Zoom & Reset */}
          <div className="w-full mt-4 space-y-3 px-2">
            <div className="flex items-center gap-3">
              <ZoomOut size={15} className="text-stone-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <ZoomIn size={15} className="text-stone-400 shrink-0" />
              <span className="text-xs font-semibold text-stone-600 font-mono w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-sans"
              >
                <RotateCcw size={12} />
                <span>重置居中</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stone-100 bg-white flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer font-sans"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer font-sans"
          >
            <Check size={14} />
            <span>确认裁剪并保存</span>
          </button>
        </div>

      </div>
    </div>
  );
};
