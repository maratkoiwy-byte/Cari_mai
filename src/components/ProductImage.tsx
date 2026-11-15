import { useState } from 'react';
import { Package } from 'lucide-react';
import { resolveProductImage } from '../lib/images';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveProductImage(src);

  if (failed || !resolved) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EDEAE2] text-[#52524C] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
