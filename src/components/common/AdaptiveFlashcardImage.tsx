import React from 'react';
import { Maximize2 } from 'lucide-react';

interface AdaptiveFlashcardImageProps {
  src: string;
  alt: string;
  title?: string;
  onEnlarge: () => void;
  language?: string;
  className?: string;
}

export const AdaptiveFlashcardImage: React.FC<AdaptiveFlashcardImageProps> = ({
  src,
  alt,
  title,
  onEnlarge,
  language = 'id',
  className = ''
}) => {
  if (!src || !src.trim()) return null;

  return (
    <div 
      className={`w-full relative group/adaptiveimg overflow-hidden rounded-none bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center select-none transition-all ${className}`}
      title={alt}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-[280px] sm:max-h-[360px] object-contain rounded-none transition-transform duration-200"
        loading="lazy"
      />

      {/* Minimal corner zoom icon trigger (Enlarge Lightbox) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEnlarge();
        }}
        className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/85 backdrop-blur-xs flex items-center justify-center opacity-75 sm:opacity-0 sm:group-hover/adaptiveimg:opacity-100 transition-opacity cursor-pointer shadow-xs"
        title={language === 'en' ? 'Open image pop-up' : 'Buka pop-up gambar'}
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
