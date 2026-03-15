
import React, { useState } from 'react';
import { generateLicenseKey } from '../utils/licenseUtils';
import { LicenseDuration } from '../types';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

const LicenseGeneratorApp: React.FC = () => {
  const [targetSystemId, setTargetSystemId] = useState('');
  const [duration, setDuration] = useState<LicenseDuration>('1Y');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSystemId.trim()) return;
    
    const key = generateLicenseKey(duration, targetSystemId.trim());
    setGeneratedKey(key);
    setCopyStatus('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6 font-sans text-gray-800">
      <div className="max-w-xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-800">
        
        {/* Header */}
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Admin License Tool</h1>
          <p className="text-primary-200 text-xs font-bold uppercase tracking-[0.2em] mt-2">Safe & Save Medical Center</p>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Target Client System ID
              </label>
              <input 
                type="text" 
                value={targetSystemId}
                onChange={(e) => setTargetSystemId(e.target.value)}
                placeholder="Paste System ID here (e.g. SYS-XXXX-...)"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                License Duration
              </label>
              <div className="relative">
                <select 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value as LicenseDuration)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 appearance-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all cursor-pointer"
                >
                    <option value="TRIAL">Trial (7 Days)</option>
                    <option value="1Y">1 Year License</option>
                    <option value="2Y">2 Year License</option>
                    <option value="3Y">3 Year License</option>
                    <option value="5Y">5 Year License</option>
                    <option value="10Y">10 Year License</option>
                    <option value="LIFETIME">Lifetime Access</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-700 active:scale-95 transition-all shadow-xl shadow-primary-200"
            >
              Generate License Key
            </button>
          </form>

          {/* Result Area */}
          {generatedKey && (
            <div className="pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">
                    Generated Key
                </label>
                {copyStatus && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded">{copyStatus}</span>}
              </div>
              
              <div className="relative group">
                <textarea 
                    readOnly
                    value={generatedKey}
                    rows={5}
                    className="w-full px-5 py-4 bg-green-50/50 border-2 border-green-500/20 rounded-2xl text-xs font-mono font-bold text-gray-700 focus:outline-none resize-none"
                />
                <button 
                    onClick={handleCopy}
                    className="absolute bottom-4 right-4 p-2 bg-white text-green-600 rounded-xl shadow-md hover:bg-green-50 border border-green-100 transition-all active:scale-90"
                    title="Copy to Clipboard"
                >
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
                Copy this key and send it to the client. It is locked to their hardware ID.
              </p>
            </div>
          )}

        </div>
      </div>
      
      <div className="fixed bottom-4 text-gray-600 text-[10px] font-bold uppercase tracking-widest opacity-50">
        Standalone Generator Tool v1.0
      </div>
    </div>
  );
};

export default LicenseGeneratorApp;
