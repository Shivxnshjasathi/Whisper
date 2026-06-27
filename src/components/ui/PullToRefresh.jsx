import { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, isRefetching, children }) {
  const contentRef = useRef(null);
  const iconRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    let currentPull = 0;

    const handleTouchStart = (e) => {
      if (mainEl.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && mainEl.scrollTop <= 0) {
        currentPull = Math.min(diff * 0.4, 80);
        
        if (contentRef.current && iconRef.current) {
          contentRef.current.style.transition = 'none';
          contentRef.current.style.transform = `translateY(${currentPull}px)`;
          
          iconRef.current.style.opacity = currentPull > 10 ? '1' : '0';
          iconRef.current.style.transform = `rotate(${currentPull * 3}deg)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      
      if (currentPull > 50 && !isRefetching) {
        onRefresh();
      }
      
      currentPull = 0;
      if (contentRef.current && iconRef.current) {
        contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        contentRef.current.style.transform = isRefetching ? 'translateY(60px)' : 'translateY(0px)';
        
        if (!isRefetching) {
           iconRef.current.style.opacity = '0';
        }
      }
    };

    mainEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    mainEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      mainEl.removeEventListener('touchstart', handleTouchStart);
      mainEl.removeEventListener('touchmove', handleTouchMove);
      mainEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefetching]);

  useEffect(() => {
    if (contentRef.current) {
       contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
       contentRef.current.style.transform = isRefetching ? 'translateY(60px)' : 'translateY(0px)';
    }
    if (iconRef.current && !isRefetching) {
       iconRef.current.style.opacity = '0';
    }
  }, [isRefetching]);

  return (
    <div className="relative w-full min-h-full">
      {/* Indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-10"
        style={{ height: '60px' }}
      >
        <RefreshCw 
          ref={iconRef}
          className={`w-5 h-5 text-white/50 opacity-0 transition-opacity ${isRefetching ? 'animate-spin !opacity-100' : ''}`}
        />
      </div>
      
      {/* Content wrapper */}
      <div ref={contentRef} className="min-h-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
