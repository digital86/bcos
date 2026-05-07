import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Logo from './Logo';

const PageLoader = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Show loader on route Change
    // We don't hide the previous page content immediately to avoid a white flash
    // unless the navigation is very fast.
    setActive(true);
    setVisible(true);

    // Scroll to top immediately on navigation
    window.scrollTo(0, 0);

    // We keep the loader visible for a bit longer to ensure components had time to mount 
    // and start their own internal fetching which usually causes layout shifts
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for fade out animation before removing from DOM
      const removeTimer = setTimeout(() => setActive(false), 500);
      return () => clearTimeout(removeTimer);
    }, 1000); // 1s is usually enough for React components to settle

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!active) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white transition-all duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backdropFilter: visible ? 'none' : 'blur(10px)' }}
    >
      <div className="relative flex flex-col items-center p-8">
        {/* Animated Background Glow */}
        <div className={`absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-150 transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Logo with scaling animation */}
        <div className={`transform transition-all duration-700 ${visible ? 'scale-100' : 'scale-90 opacity-0'}`}>
          <Logo className="h-24 w-auto animate-float" />
        </div>

        {/* Loading Progress Bar */}
        <div className={`mt-10 w-64 h-[3px] bg-muted/20 rounded-full overflow-hidden transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
          <div className="h-full bg-gradient-to-r from-primary via-bcos-lime to-primary animate-loading-bar origin-left"></div>
        </div>

        {/* Status text */}
        <p className={`mt-4 text-xs font-medium text-muted-foreground/60 tracking-widest uppercase transition-all duration-700 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          Chargement en cours
        </p>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
