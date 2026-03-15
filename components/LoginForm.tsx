
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import LanguageIcon from './icons/LanguageIcon';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error: authError } = useAuth();
  const { getEffectiveAppName, logoUrl, language, setLanguage } = useSettings();
  const { t } = useTranslations();
  const appNameDisplay = getEffectiveAppName();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isLoading) return;
    try {
      await login(username, password);
    } catch (err) {
      // Handled by context
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const handleResetDB = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি সমস্ত ডাটা মুছে ফেলে সিস্টেম রিসেট করতে চান? এটি আপনার সমস্ত ইনভয়েস এবং সেটিংস মুছে ফেলবে।')) {
      const { db } = await import('../db');
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4 font-sans">
      <div className="w-full max-w-xl flex flex-col items-center py-4">
        <div className="bg-white shadow-2xl rounded-[40px] md:rounded-[60px] border border-white/50 p-8 md:p-12 w-full relative overflow-hidden">
            
            {/* Language Toggle */}
            <div className="absolute top-6 right-6 z-10">
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                    <LanguageIcon className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
                </button>
            </div>

            <div className="text-center mb-8">
                <div className="inline-flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full bg-white shadow-lg border-[8px] border-gray-50 mb-6 overflow-hidden">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-3" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="bg-primary-600 w-full h-full flex items-center justify-center">
                             <span className="text-white text-3xl font-black">S&S</span>
                        </div>
                    )}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 leading-tight">
                    {appNameDisplay}
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest opacity-80">
                    {t('login.subtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('login.usernameLabel')}</label>
                    <input
                        type="text"
                        required
                        autoFocus
                        disabled={isLoading}
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-6 py-4 bg-[#f8fafc] border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg font-bold text-gray-700 placeholder:text-gray-300 cursor-text shadow-inner"
                        placeholder={t('login.usernamePlaceholder')}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t('login.passwordLabel')}</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-6 py-4 bg-[#f8fafc] border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg font-bold text-gray-700 placeholder:text-gray-300 cursor-text shadow-inner"
                            placeholder="••••••••"
                        />
                        <button type="button" disabled={isLoading} onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary-600 disabled:opacity-30 cursor-pointer transition-all">
                            {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {authError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-red-600 text-center uppercase tracking-tight">{authError}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-primary-600 text-white text-lg font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                    {isLoading ? t('login.signingInButton') : t('login.signInButton')}
                </button>
            </form>
        </div>
        
        <div className="mt-8 text-center space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] opacity-60">PROFESSIONAL ERP V1.0.0</p>
            <button 
                onClick={handleResetDB}
                className="text-[9px] font-bold text-gray-300 hover:text-red-400 uppercase tracking-widest transition-all cursor-pointer"
            >
                Reset System Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
