
import React from 'react';
import PillIcon from './icons/PillIcon';

const LoadingScreen: React.FC = () => {
  const [isBlocking, setIsBlocking] = React.useState(true);
  const [showForceButton, setShowForceButton] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlocking(false);
    }, 8000); // Increased total block time but added force button earlier
    
    const forceTimer = setTimeout(() => {
        setShowForceButton(true);
    }, 3000);

    return () => {
        clearTimeout(timer);
        clearTimeout(forceTimer);
    };
  }, []);

  if (!isBlocking) return null;

  return (
    <div 
      className="fixed inset-0 bg-[var(--theme-bg-50,theme(colors.gray.50))] z-50 flex flex-col items-center justify-center animate-in fade-in duration-300"
      style={{ transition: 'opacity 0.5s ease' }}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <PillIcon className="w-10 h-10 text-indigo-600 animate-spin-slow" />
            </div>
            <div className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
        </div>
        
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Safe & Save</h2>
        <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-loading-bar"></div>
        </div>
        <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Loading System...</p>
        
        {showForceButton && (
            <button 
                onClick={() => setIsBlocking(false)}
                className="mt-8 px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm animate-in fade-in slide-in-from-bottom-2"
            >
                সরাসরি প্রবেশ করুন (Force Enter)
            </button>
        )}
      </div>
      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
        }
        @keyframes loading-bar {
            0% { width: 0%; margin-left: 0; }
            50% { width: 100%; margin-left: 0; }
            100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
            animation: loading-bar 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
