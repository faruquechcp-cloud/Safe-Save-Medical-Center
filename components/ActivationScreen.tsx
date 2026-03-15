
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { validateLicenseKey } from '../utils/licenseUtils';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import LanguageIcon from './icons/LanguageIcon';
import { useTranslations } from '../hooks/useTranslations';

interface ActivationScreenProps {
  onSuccess: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ onSuccess }) => {
  const { updateLicense, getEffectiveAppName, systemId, language, setLanguage } = useSettings();
  const { t } = useTranslations();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySystemId = () => {
    navigator.clipboard.writeText(systemId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const validation = validateLicenseKey(licenseKey.trim(), systemId);

      if (validation.valid && validation.info) {
        await updateLicense({
          key: licenseKey.trim(),
          type: validation.info.type,
          expiryDate: validation.info.expiryDate === 'LIFETIME' ? null : validation.info.expiryDate,
          activationDate: new Date().toISOString(),
          isValid: true
        });
        onSuccess();
      } else {
        setError(validation.error || t('activation.invalidKey', 'Invalid License Key'));
      }
    } catch (err) {
      setError(t('activation.failed', 'Activation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans relative overflow-auto"
      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100 }}
    >
      
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-10">
         <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all active:scale-95 backdrop-blur-md"
            title="Change Language"
         >
            <LanguageIcon className="w-4 h-4" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
         </button>
      </div>

      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-800 relative z-0">
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheckIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{getEffectiveAppName()}</h2>
          <p className="text-primary-100 text-xs font-bold uppercase tracking-[0.2em] mt-2">{t('activation.subtitle', 'Software Activation')}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center shadow-inner">
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">{t('activation.systemIdLabel', 'Your System ID')}</p>
             <div className="flex items-center justify-center space-x-3 bg-white p-3 rounded-xl border border-gray-200">
                <code className="text-lg font-mono font-bold text-primary-600 tracking-wider select-all">{systemId}</code>
                <button onClick={handleCopySystemId} className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors" title="Copy ID">
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                </button>
             </div>
             <p className="text-[10px] font-bold mt-3 h-4">
                {copied ? 
                    <span className="text-green-600 uppercase tracking-widest">{t('activation.copied', 'Copied!')}</span> : 
                    <span className="text-gray-400 uppercase tracking-widest">{t('activation.sendIdInstruction')}</span>
                }
             </p>
          </div>

          <p className="text-sm text-gray-600 text-center leading-relaxed font-medium px-2">
            {t('activation.enterKeyInstruction')}
          </p>

          <form onSubmit={handleActivate} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                {t('activation.keyLabel')}
              </label>
              <textarea
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder={t('activation.keyPlaceholder')}
                rows={3}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center animate-in fade-in slide-in-from-top-1">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey}
              className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary-100 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? t('activation.validatingButton') : t('activation.activateButton')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('activation.needLicense')}</p>
            <p className="text-xs font-black text-gray-800 tracking-tight">{t('activation.contactSupport')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationScreen;
