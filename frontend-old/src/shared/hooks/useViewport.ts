// src/hooks/useViewport.ts
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useViewport() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleWindowResize);
    // Limpia el listener al desmontar el componente
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []); // El array vacío asegura que el efecto solo se ejecute al montar/desmontar

  return {
    width,
    isMobile: width <= MOBILE_BREAKPOINT,
    isTablet: width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT,
    isDesktop: width > TABLET_BREAKPOINT,
  };
}
