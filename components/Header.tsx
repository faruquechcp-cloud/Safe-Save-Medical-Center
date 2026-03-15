
import React, { useState, useEffect, useMemo } from 'react';
import PillIcon from './icons/PillIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import LanguageIcon from './icons/LanguageIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon'; 
import ClockIcon from './icons/ClockIcon'; 
import Bars3Icon from './icons/Bars3Icon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import { ViewMode, User } from './types'; 
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenSettings: (tab?: string) => void;
  currentView: ViewMode;
  onOpenHeldInvoices: () => void; 
  heldInvoicesCount: number;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  onLogout,
  onOpenSettings,
  onOpenHeldInvoices, 
  heldInvoicesCount,
  onToggleSidebar,
  currentView
}) => {
  const { logoUrl, language, setLanguage, getEffectiveAppName, license } = useSettings();
  const { t } = useTranslations();
  const appNameDisplay = getEffectiveAppName();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoLoadError, setLogoLoadError] = useState(false);
  
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);
  
  useEffect(() => {
    setLogoLoadError(false); 
  }, [logoUrl]);

  const formatTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, 
    });

    if (language === 'bn') {
      return timeStr.replace('AM', 'পূর্বাহ্ণ').replace('PM', 'অপরাহ্ণ');
    }
    return timeStr;
  };

  const formatDateHeader = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
    };
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', options);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  // License Status Helper
  const licenseBadge = useMemo(() => {
    if (!license) return null;
    
    // FIX: Change inferred type from LicenseDuration to string to allow status text updates
    let label: string = license.type;
    let colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    
    if (license.type === 'TRIAL') {
      label = "Trial";
      colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }

    if (license.expiryDate) {
      const expiry = new Date(license.expiryDate);
      const diff = expiry.getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      
      if (days <= 7) {
        const daysLabel = language === 'bn' ? `${days.toLocaleString('bn-BD')} দিন বাকি` : `${days}d Left`;
        label = daysLabel;
        colorClass = "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse";
      } else if (days <= 30) {
        colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
      }
    } else if (license.type === 'LIFETIME') {
        label = language === 'bn' ? "লাইফটাইম" : "Lifetime";
    }

    if (license.type === 'TRIAL' && label === 'Trial') {
        label = language === 'bn' ? "ট্রায়াল" : "Trial";
    }

    return (
      <button 
        onClick={() => onOpenSettings('license')}
        className={`hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-125 ${colorClass}`}
        title="Check License Status"
      >
        <ShieldCheckIcon className="w-3 h-3" />
        <span>{label}</span>
      </button>
    );
  }, [license, onOpenSettings]);

  return (
    <header className="bg-primary-900 border-b border-primary-800 shadow-md h-16 shrink-0 sticky top-0 z-40 text-white">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-slate-100 hover:bg-primary-800 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex items-center justify-center shrink-0 bg-white/10 rounded-lg backdrop-blur-sm">
              {logoUrl && !logoLoadError ? (
                <img 
                  src={logoUrl} 
                  alt={appNameDisplay} 
                  className="max-h-10 max-w-10 object-contain" 
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <PillIcon className="w-8 h-8 text-white" /> 
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-white leading-none uppercase tracking-tight">
                {appNameDisplay}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t(`viewMode.${currentView}`)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {licenseBadge}

          <div className="hidden md:flex flex-col items-end mr-2 text-slate-300">
            <div className="flex items-center text-xs font-black">
              <ClockIcon className="w-3.5 h-3.5 mr-1 text-white" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="text-[10px] opacity-75 font-bold">
              <span>{formatDateHeader(currentTime)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
                onClick={onOpenHeldInvoices}
                className="relative p-2 rounded-full text-slate-300 hover:bg-primary-800 transition-colors" 
                title={t('header.heldInvoicesTitle')}
              >
                <ArchiveBoxIcon className="w-5 h-5" /> 
                {heldInvoicesCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black leading-none text-white bg-rose-500 rounded-full ring-1 ring-primary-900">
                    {heldInvoicesCount}
                  </span>
                )}
            </button>
            
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full text-slate-300 hover:bg-primary-800 transition-colors flex items-center space-x-1" 
              title="Change Language"
            >
              <LanguageIcon className="w-5 h-5" />
              <span className="text-xs font-black hidden sm:inline">{language === 'en' ? 'BN' : 'EN'}</span>
            </button>

            <button
              onClick={() => onOpenSettings()}
              className="p-2 rounded-full text-slate-300 hover:bg-primary-800 transition-colors" 
              title={t('header.settings')}
            >
              <CogIcon className="w-5 h-5" /> 
            </button>
          </div>
          
          <div className="h-8 w-px bg-primary-800 mx-1 hidden sm:block"></div>
          
          {currentUser && (
            <div className="flex items-center space-x-3 pl-1">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-black text-white leading-none uppercase tracking-tight">
                      {language === 'bn' && currentUser.username.toLowerCase() === 'admin' ? 'অ্যাডমিন' : currentUser.username}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                      {language === 'bn' && currentUser.role.toLowerCase() === 'admin' ? 'অ্যাডমিন' : currentUser.role}
                    </p>
                </div>
                <button
                    onClick={onLogout}
                    className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-rose-500 transition-all shadow-sm" 
                    title={t('header.logout')}
                >
                    <LogoutIcon className="w-5 h-5" /> 
                </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
