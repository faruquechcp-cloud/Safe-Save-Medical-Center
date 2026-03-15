
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext';
import { themes, availableFonts } from '../themes';
import { useAuth } from '../contexts/AuthContext'; 
import { CustomTransactionCategorySetting, User, UserRole, ViewMode, NotificationSettings } from '../types';
import TrashIcon from './icons/TrashIcon';
import CogIcon from './icons/CogIcon';
import PlusIcon from './icons/PlusIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import UserIcon from './icons/UserIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import BellIcon from './icons/BellIcon';
import ChatBubbleLeftIcon from './icons/ChatBubbleLeftIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import { useTranslations } from '../hooks/useTranslations';
import { db } from '../db'; 
import ConfirmationModal from './ConfirmationModal';
import { exportFullDatabase, importFullDatabase } from '../utils/exportUtils';
import { validateLicenseKey } from '../utils/licenseUtils';
import { createDatabaseBackup, uploadBackupToGoogleDrive, listBackupsFromGoogleDrive, downloadBackupFromGoogleDrive } from '../utils/backupUtils';

type SettingsTab = 'general' | 'branding' | 'accounting' | 'notifications' | 'user' | 'license' | 'backup';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CustomTransactionCategorySetting[];
  onAddCustomCategory: (name: string, type: 'income' | 'expense') => void;
  onDeleteCustomCategory: (id: string, name: string) => void;
  zIndex?: number;
  initialTab?: string;
}

const InputGroup: React.FC<{title: string, icon?: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
  <div className="mb-10 last:mb-0">
    <div className="flex items-center space-x-3 mb-6 border-b border-gray-50 pb-4">
      {icon && <div className="text-primary-500 p-2 bg-primary-50 rounded-xl">{icon}</div>}
      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{title}</h3>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose,
    customCategories, onAddCustomCategory, onDeleteCustomCategory, zIndex, initialTab
}) => {
  const settings = useSettings();

  const { t } = useTranslations();
  const { currentUser, users, registerUser, deleteUser, updateUserCredentials, updateUserPermissions } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState({ ...settings });
  
  // User Management State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');

  // Self Update State
  const [selfUsername, setSelfUsername] = useState('');
  const [selfPassword, setSelfPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Notification Settings State
  const [notificationState, setNotificationState] = useState<NotificationSettings>(settings.notificationSettings);

  // License State
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [licenseStatusMsg, setLicenseStatusMsg] = useState('');

  // Notification State (Replaces alert)
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  const MODULES: {key: ViewMode, label: string}[] = [
    { key: 'dashboard', label: t('header.dashboard') },
    { key: 'products', label: t('header.products') },
    { key: 'sales', label: t('header.sales') },
    { key: 'purchases', label: t('header.purchases') },
    { key: 'customers', label: t('header.customers') },
    { key: 'suppliers', label: t('header.suppliers') },
    { key: 'accounting', label: t('header.accounting') },
    { key: 'reports', label: t('header.reports') },
    { key: 'serviceInvoices', label: t('header.serviceInvoices') },
    { key: 'saleReturns', label: t('header.saleReturns') },
  ];

  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
      setNotificationState({ ...settings.notificationSettings });
      setSelfUsername(currentUser?.username || '');
      setSelfPassword('');
      setConfirmPassword('');
      setNewUsername('');
      setNewPassword('');
      setNewCatName('');
      setStatusMessage(null);
      setNewLicenseKey('');
      setLicenseStatusMsg('');
      if (initialTab) {
          setActiveTab(initialTab as SettingsTab);
      } else {
          setActiveTab('general');
      }
    }
  }, [isOpen, settings, currentUser, initialTab]);

  useEffect(() => {
    if (activeTab === 'backup' && settings.backupSettings?.googleDriveEnabled) {
      fetchDriveBackups();
    }
  }, [activeTab, settings.backupSettings?.googleDriveEnabled]);

  const fetchDriveBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const files = await listBackupsFromGoogleDrive(settings.backupSettings!);
      setDriveBackups(files);
    } catch (e) {
      console.error('Failed to fetch backups', e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleConnectGoogleDrive = async () => {
    try {
      const baseUrl = (import.meta as any).env.VITE_APP_URL || '';
      const apiUrl = (window.location.protocol === 'file:' && baseUrl) 
        ? `${baseUrl.replace(/\/$/, '')}/api/auth/google/url`
        : '/api/auth/google/url';

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      const { url } = await response.json();
      window.open(url, 'google_auth_popup', 'width=600,height=700');
    } catch (e: any) {
      showStatus('error', e.message || 'Failed to get Google Auth URL');
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Drive?')) {
      await settings.updateBackupSettings({
        ...settings.backupSettings!,
        googleDriveEnabled: false,
        googleTokens: null,
        autoBackupEnabled: false
      });
      showStatus('success', 'Google Drive disconnected');
    }
  };

  const handleManualBackup = async () => {
    if (!settings.backupSettings?.googleTokens) return;
    setIsBackingUp(true);
    try {
      const content = await createDatabaseBackup();
      const success = await uploadBackupToGoogleDrive(content, settings.backupSettings);
      if (success) {
        await settings.updateBackupSettings({
          ...settings.backupSettings,
          lastBackupDate: new Date().toISOString()
        });
        showStatus('success', 'Backup successful!');
        fetchDriveBackups();
      } else {
        showStatus('error', 'Backup failed');
      }
    } catch (e: any) {
      showStatus('error', 'Backup failed: ' + e.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    if (!window.confirm(t('settings.importConfirm', 'Are you sure? This will overwrite ALL current data.'))) return;
    
    setIsRestoring(true);
    try {
      const content = await downloadBackupFromGoogleDrive(fileId, settings.backupSettings!);
      if (content) {
        await importFullDatabase(db, content);
        showStatus('success', 'System restored successfully!');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showStatus('error', 'Failed to download backup');
      }
    } catch (e: any) {
      showStatus('error', 'Restore failed: ' + e.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSave = async () => {
    try {
      await settings.setThemeKey(localSettings.themeKey);
      await settings.setAppNameBn(localSettings.appNameBn);
      await settings.setAppNameEn(localSettings.appNameEn);
      await settings.setProprietorBn(localSettings.proprietorBn);
      await settings.setProprietorEn(localSettings.proprietorEn);
      await settings.setLogoUrl(localSettings.logoUrl);
      await settings.setFontFamily(localSettings.fontFamily);
      await settings.setFontSize(localSettings.fontSize);
      await settings.setCompanyAddressBn(localSettings.companyAddressBn);
      await settings.setCompanyAddressEn(localSettings.companyAddressEn);
      await settings.setCompanyContactBn(localSettings.companyContactBn);
      await settings.setCompanyContactEn(localSettings.companyContactEn);
      await settings.setCompanyEmail(localSettings.companyEmail);
      await settings.setCompanyWebsite(localSettings.companyWebsite);
      await settings.setVatPercentage(localSettings.vatPercentage);
      await settings.setInitialCashBalance(localSettings.initialCashBalance);
      await settings.updateNotificationSettings(notificationState);
      
      if (selfPassword !== '' || selfUsername !== currentUser?.username) {
        if (selfPassword !== '' && selfPassword !== confirmPassword) {
          showStatus('error', t('settings.passwordsNoMatch'));
          return;
        }
        await updateUserCredentials(currentUser!.id, selfUsername, selfPassword || undefined);
      }
      showStatus('success', t('settings.savedSuccess'));
    } catch (err: any) {
      showStatus('error', t('common.error') + ": " + err.message);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleFullRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (window.confirm(t('settings.importConfirm', 'Are you sure? This will overwrite ALL current data.'))) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        await importFullDatabase(db, content);
        
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleRegister = async () => {
    if (!newUsername || !newPassword) {
        showStatus('error', "Required fields missing");
        return;
    }
    try {
      await registerUser(newUsername, newPassword, newUserRole, ['dashboard', 'products', 'sales']);
      setNewUsername('');
      setNewPassword('');
      showStatus('success', t('settings.teamAdded'));
    } catch (e: any) {
      showStatus('error', e.message);
    }
  };

  const togglePermission = async (userId: string, permission: ViewMode) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPerms = user.permissions.includes(permission)
      ? user.permissions.filter(p => p !== permission)
      : [...user.permissions, permission];
    await updateUserPermissions(userId, newPerms);
  };

  const handleActivateLicense = async () => {
    setLicenseStatusMsg('Validating...');
    try {
        const validation = validateLicenseKey(newLicenseKey.trim(), settings.systemId);
        if (validation.valid && validation.info) {
            await settings.updateLicense({
                key: newLicenseKey.trim(),
                type: validation.info.type,
                expiryDate: validation.info.expiryDate === 'LIFETIME' ? null : validation.info.expiryDate,
                activationDate: new Date().toISOString(),
                isValid: true
            });
            setLicenseStatusMsg('Activation Successful!');
            showStatus('success', 'License activated successfully!');
            setNewLicenseKey('');
        } else {
            setLicenseStatusMsg(validation.error || 'Invalid License Key');
            showStatus('error', 'Invalid License Key');
        }
    } catch (err) {
        setLicenseStatusMsg('Activation Failed');
    }
  };

  const TabButton: React.FC<{id: SettingsTab, label: string}> = ({id, label}) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-6 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl text-left ${
        activeTab === id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  // Helper to update notification state
  const updateNotif = (key: keyof NotificationSettings, value: any) => {
    setNotificationState(prev => ({ ...prev, [key]: value }));
  };

  // License Calculations
  const licenseExpiry = settings.license?.expiryDate;
  let daysRemaining = 'LIFETIME';
  if (licenseExpiry && licenseExpiry !== 'LIFETIME') {
      const expiry = new Date(licenseExpiry);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      daysRemaining = days > 0 ? `${days} Days` : 'Expired';
  } else if (!licenseExpiry && settings.license?.type === 'LIFETIME') {
      daysRemaining = 'Lifetime Access';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('header.settings')} size="5xl" zIndex={zIndex}>
      <div className="bg-white relative">
        {/* Status Notification */}
        {statusMessage && (
            <div className={`absolute top-0 left-0 right-0 p-3 text-center text-xs font-bold uppercase tracking-widest z-50 ${
                statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {statusMessage.text}
            </div>
        )}

        <div className="flex flex-col md:flex-row">
          {/* Tabs Sidebar */}
          <aside className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 p-4 sm:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 custom-scrollbar">
            <TabButton id="general" label={t('settings.generalTab')} />
            <TabButton id="branding" label={t('settings.brandingTab')} />
            <TabButton id="accounting" label={t('settings.accountingTab')} />
            <TabButton id="notifications" label={t('settings.notificationsTab', 'Notifications')} />
            <TabButton id="backup" label={t('settings.backupTab', 'Backup')} />
            <TabButton id="user" label={t('settings.userTab')} />
            <TabButton id="license" label={t('settings.licenseTab', 'License')} />
          </aside>

          {/* Content Area */}
          <div className="flex-1 p-6 sm:p-10 bg-white min-h-[500px]">
            {activeTab === 'general' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <InputGroup title={t('settings.generalTab')} icon={<CogIcon className="w-4 h-4"/>}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.appNameBnLabel')}</label>
                      <input type="text" value={localSettings.appNameBn} onChange={e => setLocalSettings({...localSettings, appNameBn: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.appNameEnLabel')}</label>
                      <input type="text" value={localSettings.appNameEn} onChange={e => setLocalSettings({...localSettings, appNameEn: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.themeColor')}</label>
                      <select value={localSettings.themeKey} onChange={e => setLocalSettings({...localSettings, themeKey: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all">
                        {themes.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('productForm.formLabel')}</label>
                      <select value={localSettings.fontFamily} onChange={e => setLocalSettings({...localSettings, fontFamily: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all">
                        {availableFonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                </InputGroup>

                <div className="pt-10 mt-10 border-t border-gray-50">
                  <InputGroup title={t('settings.maintenanceTitle', 'System Maintenance')} icon={<ShieldCheckIcon className="w-4 h-4"/>}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Manage full system data and backups</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => exportFullDatabase(db)}
                            className="flex-1 flex items-center justify-center px-6 py-4 bg-primary-50 text-primary-700 border border-primary-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-100 transition-all active:scale-95"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                            {t('settings.exportDbButton', 'Backup Full Database')}
                        </button>
                        <label className="flex-1 flex items-center justify-center px-6 py-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all active:scale-95 text-center cursor-pointer">
                            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                            {t('settings.importDbButton', 'Restore Full Database')}
                            <input type="file" accept=".json" className="hidden" onChange={handleFullRestore} />
                        </label>
                    </div>
                  </InputGroup>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <InputGroup title={t('settings.brandingTab')}>
                  <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 p-6 sm:p-8 bg-gray-50 rounded-[32px] border border-gray-100 mb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[24px] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-xl">
                        {localSettings.logoUrl ? (
                          <img src={localSettings.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" />
                        ) : (
                          <div className="text-gray-300 font-black uppercase text-[8px] tracking-widest">{t('settings.logoNoLogo')}</div>
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-primary-600/90 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-[24px] scale-95 group-hover:scale-100">
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('settings.logoUpdate')}</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{t('settings.logoLabel')}</h4>
                      <button onClick={() => setLocalSettings(p => ({...p, logoUrl: ''}))} className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 underline transition-colors">{t('settings.logoRemove')}</button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.proprietorBnLabel')}</label>
                        <input type="text" value={localSettings.proprietorBn} onChange={e => setLocalSettings({...localSettings, proprietorBn: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.proprietorEnLabel')}</label>
                        <input type="text" value={localSettings.proprietorEn} onChange={e => setLocalSettings({...localSettings, proprietorEn: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyAddressBnLabel')}</label>
                        <textarea value={localSettings.companyAddressBn} onChange={e => setLocalSettings({...localSettings, companyAddressBn: e.target.value})} rows={2} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyAddressEnLabel')}</label>
                        <textarea value={localSettings.companyAddressEn} onChange={e => setLocalSettings({...localSettings, companyAddressEn: e.target.value})} rows={2} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyContactBnLabel')}</label>
                        <input type="text" value={localSettings.companyContactBn} onChange={e => setLocalSettings({...localSettings, companyContactBn: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyContactEnLabel')}</label>
                        <input type="text" value={localSettings.companyContactEn} onChange={e => setLocalSettings({...localSettings, companyContactEn: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyEmailLabel')}</label>
                        <input type="email" value={localSettings.companyEmail} onChange={e => setLocalSettings({...localSettings, companyEmail: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.companyWebsiteLabel')}</label>
                        <input type="text" value={localSettings.companyWebsite} onChange={e => setLocalSettings({...localSettings, companyWebsite: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                      </div>
                    </div>
                  </div>
                </InputGroup>
              </div>
            )}

            {activeTab === 'accounting' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.vatLabel')}</label>
                    <input type="number" value={localSettings.vatPercentage} onChange={e => setLocalSettings({...localSettings, vatPercentage: e.target.value as any})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.initialBalanceLabel')}</label>
                    <input type="number" value={localSettings.initialCashBalance} onChange={e => setLocalSettings({...localSettings, initialCashBalance: e.target.value as any})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                  </div>
                </div>

                <InputGroup title={t('settings.accountingTab')} icon={<PlusIcon className="w-4 h-4"/>}>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <input placeholder={t('accounting.categoryLabel')} value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                            <select value={newCatType} onChange={e => setNewCatType(e.target.value as any)} className="w-32 bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                                <option value="income">{t('accounting.income')}</option>
                                <option value="expense">{t('accounting.expense')}</option>
                            </select>
                            <button onClick={() => { if(newCatName) { onAddCustomCategory(newCatName, newCatType); setNewCatName(''); } }} className="p-3 bg-primary-600 text-white rounded-xl shadow-lg active:scale-95"><PlusIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
                            {customCategories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                    <div>
                                        <div className="text-xs font-black text-gray-800 uppercase">{cat.name}</div>
                                        <div className={`text-[8px] font-black uppercase tracking-widest ${cat.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{t(`accounting.${cat.type}`)}</div>
                                    </div>
                                    <button onClick={() => onDeleteCustomCategory(cat.id, cat.name)} className="p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </InputGroup>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                <InputGroup title={t('settings.commChannels', 'Communication Channels')} icon={<BellIcon className="w-4 h-4"/>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${notificationState.whatsappEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationState.whatsappEnabled ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400'}`}>
                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.whatsappTitle', 'WhatsApp')}</span>
                                    <input type="checkbox" checked={notificationState.whatsappEnabled} onChange={e => updateNotif('whatsappEnabled', e.target.checked)} className="rounded text-green-600 w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{t('settings.whatsappDesc', 'Open App to Send')}</span>
                            </div>
                        </label>

                        <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${notificationState.messengerEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationState.messengerEnabled ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400'}`}>
                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.504 8.659.162.12.261.32.239.52l-.504 3.005a.446.446 0 00.508.53l3.226-.754a.54.54 0 01.371.045c1.173.53 2.49.824 3.864.824 6.627 0 12-4.975 12-11.111C24.208 4.974 18.835 0 12 0zm.16 14.444L9.57 11.66a.555.555 0 00-.776-.026l-3.324 3.52c-.392.415-.99.077-.736-.415l2.67-5.127c.224-.43.834-.492 1.137-.116l2.5 3.107a.555.555 0 00.776.026l3.43-3.52c.407-.418.995-.062.723.447l-2.82 5.253a.553.553 0 01-.98-.366z"/></svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.messengerTitle', 'Messenger')}</span>
                                    <input type="checkbox" checked={notificationState.messengerEnabled} onChange={e => updateNotif('messengerEnabled', e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{t('settings.messengerDesc', 'Manual Send')}</span>
                            </div>
                        </label>

                        <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${notificationState.smsEnabled ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationState.smsEnabled ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-400'}`}>
                                <ChatBubbleLeftIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.smsTitle', 'SMS Gateway')}</span>
                                    <input type="checkbox" checked={notificationState.smsEnabled} onChange={e => updateNotif('smsEnabled', e.target.checked)} className="rounded text-orange-600 w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{t('settings.smsDesc', 'Automated')}</span>
                            </div>
                        </label>

                        <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all ${notificationState.emailEnabled ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationState.emailEnabled ? 'bg-primary-100 text-primary-600' : 'bg-white text-gray-400'}`}>
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.emailTitle', 'Email')}</span>
                                    <input type="checkbox" checked={notificationState.emailEnabled} onChange={e => updateNotif('emailEnabled', e.target.checked)} className="rounded text-primary-600 w-4 h-4" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{t('settings.emailDesc', 'Automated (EmailJS)')}</span>
                            </div>
                        </label>
                    </div>
                </InputGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputGroup title={t('settings.autoTriggers', 'Automated Triggers')}>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-700">{t('settings.triggerSale', 'Send on Sale Complete')}</span>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" checked={notificationState.alertOnSale} onChange={e => updateNotif('alertOnSale', e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{ transform: notificationState.alertOnSale ? 'translateX(100%)' : 'translateX(0)', borderColor: notificationState.alertOnSale ? 'var(--color-primary-600)' : '#d1d5db' }}/>
                                    <div className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${notificationState.alertOnSale ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-700">{t('settings.triggerDue', 'Send on Payment Received')}</span>
                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" checked={notificationState.alertOnDuePayment} onChange={e => updateNotif('alertOnDuePayment', e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{ transform: notificationState.alertOnDuePayment ? 'translateX(100%)' : 'translateX(0)', borderColor: notificationState.alertOnDuePayment ? 'var(--color-primary-600)' : '#d1d5db' }}/>
                                    <div className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${notificationState.alertOnDuePayment ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                                </div>
                            </label>
                        </div>
                    </InputGroup>

                    <InputGroup title={t('settings.aiFeatures', 'Smart AI Features')} icon={<div className="text-purple-600">✨</div>}>
                         <label className="flex items-start space-x-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 cursor-pointer">
                            <input type="checkbox" checked={notificationState.useSmartAI} onChange={e => updateNotif('useSmartAI', e.target.checked)} className="mt-1 rounded text-purple-600 w-4 h-4" />
                            <div>
                                <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.aiDrafting', 'AI Message Drafting')}</span>
                                <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                                    {t('settings.aiDraftingDesc', 'Automatically generates professional and polite message content using Google Gemini AI based on context (Sale/Due/Reminder).')}
                                </span>
                            </div>
                        </label>
                    </InputGroup>
                </div>

                {notificationState.smsEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <InputGroup title={t('settings.smsConfigTitle', 'SMS Configuration')} icon={<ChatBubbleLeftIcon className="w-4 h-4"/>}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.gatewayUrl', 'Gateway URL')}</label>
                                    <input type="text" value={notificationState.smsGatewayUrl} onChange={e => updateNotif('smsGatewayUrl', e.target.value)} placeholder="https://api.sms..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.apiKey', 'API Key')}</label>
                                    <input type="password" value={notificationState.smsApiKey} onChange={e => updateNotif('smsApiKey', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.senderId', 'Sender ID')}</label>
                                    <input type="text" value={notificationState.smsSenderId} onChange={e => updateNotif('smsSenderId', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all" />
                                </div>
                            </div>
                        </InputGroup>
                    </div>
                )}

                {notificationState.emailEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <InputGroup title={t('settings.emailConfigTitle', 'Email Configuration (EmailJS)')} icon={<EnvelopeIcon className="w-4 h-4"/>}>
                            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 mb-4 text-[10px] text-primary-700 font-medium">
                                {t('settings.emailHelp', 'Get keys from emailjs.com. Template params: to_name, to_email, message, invoice_no.')}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.serviceId', 'Service ID')}</label>
                                    <input type="text" value={notificationState.emailServiceId} onChange={e => updateNotif('emailServiceId', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.templateId', 'Template ID')}</label>
                                    <input type="text" value={notificationState.emailTemplateId} onChange={e => updateNotif('emailTemplateId', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.publicKey', 'Public Key')}</label>
                                    <input type="password" value={notificationState.emailPublicKey} onChange={e => updateNotif('emailPublicKey', e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 transition-all" />
                                </div>
                            </div>
                        </InputGroup>
                    </div>
                )}
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <InputGroup title={t('settings.backupTab', 'Google Drive Backup')} icon={<ArrowUpTrayIcon className="w-4 h-4"/>}>
                  <div className="space-y-6">
                    {!settings.backupSettings?.googleDriveEnabled ? (
                      <div className="bg-primary-50 p-6 rounded-[32px] border border-primary-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary-900 mb-2">{t('settings.connectDrive', 'Connect Google Drive')}</h4>
                        <p className="text-[10px] text-primary-700 font-medium mb-4">
                          {t('settings.connectDriveDesc', 'Automatically back up your database to your Google Drive. Your data is encrypted and secure.')}
                        </p>
                        <button 
                          onClick={handleConnectGoogleDrive}
                          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-md"
                        >
                          {t('settings.connectButton', 'Connect Google Drive')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-green-50 rounded-[32px] border border-green-100">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-green-900 mb-1">{t('settings.driveConnected', 'Google Drive Connected')}</h4>
                            <p className="text-[10px] text-green-700 font-medium">
                              {t('settings.lastBackup', 'Last Backup')}: {settings.backupSettings?.lastBackupDate ? new Date(settings.backupSettings.lastBackupDate).toLocaleString() : t('common.never', 'Never')}
                            </p>
                          </div>
                          <button 
                            onClick={handleDisconnectGoogleDrive}
                            className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 underline"
                          >
                            {t('settings.disconnect', 'Disconnect')}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer">
                            <div>
                              <span className="block text-xs font-black text-gray-800 uppercase tracking-wide">{t('settings.autoBackup', 'Auto Backup')}</span>
                              <span className="text-[10px] text-gray-500 font-medium">{t('settings.autoBackupDesc', 'Automatically back up data')}</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={settings.backupSettings?.autoBackupEnabled} 
                              onChange={e => settings.updateBackupSettings({ ...settings.backupSettings!, autoBackupEnabled: e.target.checked })}
                              className="rounded text-primary-600 w-5 h-5" 
                            />
                          </label>

                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.backupInterval', 'Backup Interval (Hours)')}</label>
                            <select 
                              value={settings.backupSettings?.backupIntervalHours} 
                              onChange={e => settings.updateBackupSettings({ ...settings.backupSettings!, backupIntervalHours: parseInt(e.target.value) })}
                              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                            >
                              <option value={1}>1 Hour</option>
                              <option value={6}>6 Hours</option>
                              <option value={12}>12 Hours</option>
                              <option value={24}>24 Hours</option>
                              <option value={168}>1 Week</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          onClick={handleManualBackup}
                          disabled={isBackingUp}
                          className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-lg disabled:opacity-50"
                        >
                          {isBackingUp ? t('settings.backingUp', 'Backing up...') : t('settings.backupNow', 'Backup Now to Google Drive')}
                        </button>

                        <div className="pt-8 border-t border-gray-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t('settings.recentBackups', 'Recent Backups on Drive')}</h4>
                          {isLoadingBackups ? (
                            <div className="py-10 text-center text-[10px] font-bold text-gray-400 uppercase animate-pulse">{t('common.loading', 'Loading...')}</div>
                          ) : driveBackups.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                              {driveBackups.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                                  <div>
                                    <div className="text-[10px] font-black text-gray-800 uppercase tracking-tight truncate max-w-[200px]">{file.name}</div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                                      {new Date(file.createdTime).toLocaleString()} • {(file.size / 1024).toFixed(2)} KB
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleRestoreFromDrive(file.id)}
                                    disabled={isRestoring}
                                    className="px-4 py-2 bg-white text-primary-600 border border-primary-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                                  >
                                    {isRestoring ? t('common.loading') : t('common.restore', 'Restore')}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-10 text-center text-[10px] font-bold text-gray-400 uppercase bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              {t('settings.noBackupsFound', 'No backups found on Google Drive')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </InputGroup>
              </div>
            )}

            {activeTab === 'user' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <InputGroup title={t('settings.myAccount')} icon={<UserIcon className="w-4 h-4"/>}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.username')}</label>
                      <input type="text" value={selfUsername} onChange={e => setSelfUsername(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.password')}</label>
                      <input type="password" value={selfPassword} onChange={e => setSelfPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('common.save')}</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                  </div>
                </InputGroup>

                {currentUser?.role === 'admin' && (
                  <div className="pt-12 mt-12 border-t border-gray-50">
                    <InputGroup title={t('settings.manageTeam')} icon={<ShieldCheckIcon className="w-4 h-4"/>}>
                      {/* ... (Existing user management code unchanged) ... */}
                      <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex flex-col sm:flex-row gap-4 items-end mb-8 shadow-inner">
                        <div className="flex-1 w-full">
                           <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t('settings.username')}</label>
                           <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                        </div>
                        <div className="flex-1 w-full">
                           <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t('settings.password')}</label>
                           <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                        </div>
                        <div className="w-full sm:w-32">
                           <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t('settings.role')}</label>
                           <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 transition-all">
                             <option value="staff">Staff</option>
                             <option value="admin">Admin</option>
                           </select>
                        </div>
                        <button onClick={handleRegister} className="w-full sm:w-auto bg-primary-600 text-white font-black uppercase text-[9px] tracking-[0.2em] px-8 py-4 rounded-xl hover:bg-primary-700 transition-all shadow-md active:scale-95">{t('settings.inviteButton')}</button>
                      </div>
                      
                      <div className="overflow-x-auto border border-gray-50 rounded-[32px] shadow-sm mb-12">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.username')}</th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.permissions')}</th>
                              <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('settings.actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-50">
                            {users.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                   <div className="text-xs font-black text-gray-800 uppercase">{u.username}</div>
                                   <div className="text-[8px] font-bold text-gray-400 uppercase">{u.role}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-wrap gap-1.5">
                                      {MODULES.map(m => (
                                        <button 
                                          key={m.key} 
                                          onClick={() => togglePermission(u.id, m.key)}
                                          className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${u.permissions.includes(m.key) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-300 border border-gray-100 hover:border-gray-300'}`}
                                        >
                                          {m.label}
                                        </button>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <button 
                                     onClick={() => setUserToDelete(u)} 
                                     disabled={u.id === currentUser.id} 
                                     className={`p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${u.id === currentUser.id ? 'invisible' : ''}`}
                                   >
                                     <TrashIcon className="w-4 h-4"/>
                                   </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </InputGroup>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'license' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <InputGroup title={t('settings.licenseTab', 'License Management')} icon={<ShieldCheckIcon className="w-4 h-4"/>}>
                        
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[32px] p-8 text-white mb-8 shadow-xl">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary-300 mb-1">Current License Status</h4>
                                    <div className="text-3xl font-black tracking-tight">{daysRemaining}</div>
                                </div>
                                <div className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">License Type</div>
                                    <div className="text-sm font-bold">{settings.license?.type || 'N/A'}</div>
                                </div>
                            </div>
                            
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('activation.systemIdLabel', 'System ID (Hardware Lock)')}</span>
                                <div className="flex items-center gap-3">
                                    <code className="text-sm font-mono text-primary-300 bg-black/50 px-3 py-1.5 rounded-lg">{settings.systemId}</code>
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(settings.systemId); showStatus('success', 'Copied System ID!');}} 
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                        title="Copy System ID"
                                    >
                                        <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('activation.enterKeyInstruction', 'Enter New License Key')}</label>
                            <textarea 
                                value={newLicenseKey} 
                                onChange={e => setNewLicenseKey(e.target.value)} 
                                rows={3}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-mono font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                                placeholder={t('activation.keyPlaceholder', 'Paste your new license key here...')}
                            />
                            {licenseStatusMsg && (
                                <p className={`text-xs font-bold uppercase tracking-widest ${licenseStatusMsg.includes('Successful') ? 'text-green-600' : 'text-red-500'}`}>
                                    {licenseStatusMsg}
                                </p>
                            )}
                            <button 
                                onClick={handleActivateLicense}
                                disabled={!newLicenseKey}
                                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-primary-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('activation.activateButton', 'Activate New License')}
                            </button>
                        </div>

                        <div className="mt-8 text-center border-t border-gray-100 pt-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('activation.needLicense', 'Need a license?')}</p>
                            <p className="text-xs font-black text-gray-800 tracking-tight">{t('activation.contactSupport')}</p>
                        </div>
                    </InputGroup>
                </div>
            )}
          </div>
        </div>
        
        {/* Unified Action Footer */}
        <div className="px-6 sm:px-10 py-10 border-t border-gray-50 flex flex-col sm:flex-row-reverse gap-4 bg-gray-50/30 shrink-0">
          <button 
            onClick={handleSave} 
            className="w-full sm:w-auto px-16 py-5 text-[10px] sm:text-[11px] font-black text-white bg-primary-600 uppercase tracking-[0.3em] rounded-[24px] shadow-xl hover:brightness-110 transition-all active:scale-95"
          >
            {t('common.save')}
          </button>
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-10 py-5 text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[24px] transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {userToDelete && (
          <ConfirmationModal 
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            onConfirm={() => {
              deleteUser(userToDelete.id);
              setUserToDelete(null);
            }}
            title={t('settings.removeMemberTitle')}
            message={t('settings.removeMemberConfirm', { username: userToDelete.username })}
            confirmButtonText={t('confirmDelete.deleteButton')}
          />
      )}
    </Modal>
  );
};

export default SettingsModal;
