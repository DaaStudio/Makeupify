import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSlider: React.FC<Props> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  const onMouseUp = () => setIsDragging(false);
  const onTouchEnd = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      className="relative w-full max-w-3xl aspect-[3/4] md:aspect-square lg:aspect-[4/3] mx-auto overflow-hidden rounded-xl shadow-2xl select-none"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      onMouseLeave={onMouseUp}
    >
      {/* Before Image (Background) */}
      <img 
        src={beforeImage} 
        alt="Before" 
        className="absolute top-0 left-0 w-full h-full object-cover" 
      />
      
      {/* Label Before */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10">
        BEFORE
      </div>

      {/* After Image (Clipped on top) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={afterImage} 
          alt="After" 
          className="absolute top-0 left-0 max-w-none h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} 
        />
        {/* Label After */}
         <div className="absolute top-4 right-4 bg-purple-600/80 text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10">
          AFTER
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="rotate-90 origin-center" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
