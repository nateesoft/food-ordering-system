'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  /** ข้อความบรรยายใต้ภาพ (เช่น ชื่อเมนู) */
  caption?: string;
  onClose: () => void;
}

/**
 * Modal แสดงรูปภาพแบบเต็มจอ (lightbox)
 * - คลิกพื้นหลัง / ปุ่มกากบาท / กด Esc เพื่อปิด
 * - คลิกที่รูปเพื่อสลับซูม
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  src,
  alt = '',
  caption,
  onClose,
}) => {
  const [zoomed, setZoomed] = useState(false);

  // ปิดด้วยปุ่ม Escape + ล็อคการเลื่อนหน้าจอเบื้องหลัง
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // รีเซ็ตซูมทุกครั้งที่เปิด/ปิด
  useEffect(() => {
    if (!isOpen) setZoomed(false);
  }, [isOpen]);

  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || caption || 'Image preview'}
    >
      {/* ปุ่มปิด */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-7 h-7" />
      </button>

      {/* ปุ่มซูม */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        {zoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
      </button>

      {/* รูปภาพ */}
      <div
        className={`flex-1 w-full flex items-center justify-center p-4 sm:p-8 ${
          zoomed ? 'overflow-auto' : 'overflow-hidden'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={() => setZoomed((z) => !z)}
          className={`select-none rounded-lg shadow-2xl animate-scale-in transition-transform duration-300 ${
            zoomed
              ? 'max-w-none max-h-none w-auto h-auto cursor-zoom-out scale-100'
              : 'max-w-[95vw] max-h-[82vh] object-contain cursor-zoom-in'
          }`}
          draggable={false}
        />
      </div>

      {caption && (
        <p
          className="pb-6 px-4 text-center text-white/90 text-sm sm:text-base font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </p>
      )}
    </div>
  );
};

export default ImageLightbox;
