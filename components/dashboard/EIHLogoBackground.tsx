import React from 'react';
import Image from 'next/image';

const EIHLogoBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Dark Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      
      {/* The Logo Image */}
      <div className="relative w-full h-full scale-110 opacity-20 blur-3xl">
        <Image
          src="/logo-bg.jpg" // Ensure your logo is in the /public folder
          alt="Ethereal Inn Background"
          fill
          priority
          className="object-contain"
        />
      </div>

      {/* Subtle Gradient for luxury feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-20" />
    </div>
  );
};

export default EIHLogoBackground;