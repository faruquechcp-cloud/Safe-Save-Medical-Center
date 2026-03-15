
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { AppSettingsDexie, updateAppSettings as updateDexieAppSettings, defaultNotificationSettings } from '../db'; 
import { themes, AppTheme, defaultSettings, ThemeColorPalette, gradientThemes, GradientTheme, PrintTemplateType, PrintOptions } from '../themes';
import { LanguageCode, NotificationSettings, LicenseInfo, BackupSettings } from '../types';
import { generateMonochromaticPalette } from '../utils/colorUtils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface SettingsContextValue extends Omit<AppSettingsDexie, 'id'> {
  appName: string;
  setThemeKey: (key: string) => void;
  setAppNameBn: (name: string) => void;
  setAppNameEn: (name: string) => void;
  setProprietorBn: (name: string) => void;
  setProprietorEn: (name: string) => void;
  setLogoUrl: (url: string) => void;
  setAppIconUrl: (url: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: string) => void;
  setAccentPhotoUrl: (url: string) => void;
  setLanguage: (lang: LanguageCode) => void;
  setIsCustomSolidActive: (isActive: boolean) => void;
  setCustomSolidColor: (color: string) => void;
  setIsGradientThemeActive: (isActive: boolean) => void;
  setActiveGradientThemeKey: (key: string | null) => void;
  setPrintTemplate: (template: PrintTemplateType) => void;
  setCompanyAddressBn: (address: string) => void;
  setCompanyAddressEn: (address: string) => void;
  setCompanyContactBn: (contact: string) => void;
  setCompanyContactEn: (contact: string) => void;
  setCompanyEmail: (email: string) => void;
  setCompanyWebsite: (website: string) => void;
  setPrintFooterMessage: (message: string) => void;
  setDefaultPrintOptions: (options: PrintOptions) => void;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>; 
  updateBackupSettings: (updates: Partial<BackupSettings>) => Promise<void>;
  setVatPercentage: (vat: number) => Promise<void>;
  setInitialCashBalance: (balance: number) => Promise<void>;
  updateLicense: (license: LicenseInfo) => Promise<void>;
  
  getCurrentTheme: () => AppTheme;
  getEffectiveAppName: () => string;
  getActiveGradientTheme: () => GradientTheme | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const liveSettings = useLiveQuery(() => db.appSettings.get(0));

  useEffect(() => {
    if (liveSettings !== undefined) {
      console.log("SettingsContext: liveSettings loaded.");
      setHasLoaded(true);
    }
  }, [liveSettings]);

  // Safety timeout to ensure app doesn't stay stuck in loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasLoaded) {
        console.warn("SettingsContext: Safety timeout triggered! Forcing hasLoaded to true.");
        setHasLoaded(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasLoaded]);

  const stableSettings = liveSettings;
  const isLoading = !hasLoaded;

  const mergedSettings = stableSettings 
    ? { ...defaultSettings, ...stableSettings } 
    : undefined;

  const currentSettings = mergedSettings || { 
      ...defaultSettings, 
      id: 0, 
      currentUserId: null, 
      notificationSettings: defaultNotificationSettings, 
      vatPercentage: 0, 
      initialCashBalance: 0,
      license: undefined,
      systemId: 'LOADING...' 
  };

  const getCurrentTheme = useCallback((): AppTheme => {
    if (!currentSettings) return themes[0]; 
    return themes.find(t => t.key === currentSettings.themeKey) || themes[0];
  }, [currentSettings]);

  const getActiveGradientTheme = useCallback((): GradientTheme | undefined => {
    if (!currentSettings || !currentSettings.activeGradientThemeKey) return undefined;
    return gradientThemes.find(gt => gt.key === currentSettings.activeGradientThemeKey);
  }, [currentSettings]);

  const getEffectiveAppName = useCallback((): string => {
    if (!currentSettings) return defaultSettings.appNameEn; 
    return currentSettings.language === 'bn' ? currentSettings.appNameBn : currentSettings.appNameEn;
  }, [currentSettings]);

  useEffect(() => {
    if (!currentSettings) return;

    const baseTheme = getCurrentTheme();
    const activeGradientDetails = getActiveGradientTheme();
    const dynamicStyles = document.getElementById('dynamic-styles');

    let primaryPalette: ThemeColorPalette;
    let headerBackground: string;

    if (currentSettings.isGradientThemeActive && activeGradientDetails) {
      try {
        primaryPalette = generateMonochromaticPalette(activeGradientDetails.startColor);
        headerBackground = `linear-gradient(${activeGradientDetails.angle}, ${activeGradientDetails.startColor}, ${activeGradientDetails.endColor})`;
      } catch (e) {
        primaryPalette = baseTheme.palette;
        headerBackground = primaryPalette['600'];
      }
    } else if (currentSettings.isCustomSolidActive && currentSettings.customSolidColor) {
      try {
        primaryPalette = generateMonochromaticPalette(currentSettings.customSolidColor);
        headerBackground = primaryPalette['600'];
      } catch (e) {
        primaryPalette = baseTheme.palette;
        headerBackground = primaryPalette['600'];
      }
    } else {
      primaryPalette = baseTheme.palette;
      headerBackground = primaryPalette['600'];
    }

    let cssVariables = ':root {\n';
    Object.entries(baseTheme.palette).forEach(([shade, color]) => {
      cssVariables += `  --theme-bg-${shade}: ${color};\n`;
      cssVariables += `  --theme-text-${shade}: ${color};\n`;
      cssVariables += `  --theme-border-${shade}: ${color};\n`;
    });
    Object.entries(primaryPalette).forEach(([shade, color]) => {
      cssVariables += `  --color-primary-${shade}: ${color};\n`;
      cssVariables += `  --theme-ring-${shade}: ${color};\n`;
    });
    cssVariables += `  --header-background: ${headerBackground};\n}\n`;

    if (dynamicStyles) dynamicStyles.innerHTML = cssVariables;
    
    // CRITICAL FIX: Set font as a CSS variable on the root element
    document.documentElement.style.setProperty('--font-app-main', currentSettings.fontFamily);
    document.body.style.fontFamily = currentSettings.fontFamily;
    
    document.title = `${getEffectiveAppName()} Inventory`;
  }, [currentSettings, getCurrentTheme, getEffectiveAppName, getActiveGradientTheme]);


  const updateSetting = async (key: keyof Omit<AppSettingsDexie, 'id'>, value: any) => {
    if (!db) return;
    await updateDexieAppSettings({ [key]: value });
  };
  
  const updateMultipleSettings = async (updates: Partial<Omit<AppSettingsDexie, 'id'>>) => {
    if (!db) return;
    await updateDexieAppSettings(updates);
  };

  const contextValue: SettingsContextValue = {
    ...currentSettings,
    appName: getEffectiveAppName(),
    isLoading,
    setThemeKey: (themeKey) => updateSetting('themeKey', themeKey),
    setAppNameBn: (appNameBn) => updateSetting('appNameBn', appNameBn),
    setAppNameEn: (appNameEn) => updateSetting('appNameEn', appNameEn),
    setProprietorBn: (proprietorBn) => updateSetting('proprietorBn', proprietorBn),
    setProprietorEn: (proprietorEn) => updateSetting('proprietorEn', proprietorEn),
    setLogoUrl: (logoUrl) => updateSetting('logoUrl', logoUrl), 
    setAppIconUrl: (appIconUrl) => updateSetting('appIconUrl', appIconUrl),
    setFontFamily: (fontFamily) => updateSetting('fontFamily', fontFamily),
    setFontSize: (fontSize) => updateSetting('fontSize', fontSize),
    setAccentPhotoUrl: (accentPhotoUrl) => updateSetting('accentPhotoUrl', accentPhotoUrl),
    setLanguage: (language) => updateSetting('language', language),
    setIsCustomSolidActive: (isActive) => updateMultipleSettings({
      isCustomSolidActive: isActive,
      isGradientThemeActive: isActive ? false : (currentSettings?.isGradientThemeActive ?? false),
    }),
    setCustomSolidColor: (color) => updateMultipleSettings({
      customSolidColor: color,
      isCustomSolidActive: true,
      isGradientThemeActive: false,
    }),
    setIsGradientThemeActive: (isActive) => updateMultipleSettings({
      isGradientThemeActive: isActive,
      isCustomSolidActive: isActive ? false : (currentSettings?.isCustomSolidActive ?? false),
    }),
    setActiveGradientThemeKey: (key) => updateMultipleSettings({
      activeGradientThemeKey: key,
      isGradientThemeActive: !!key,
    }),
    setPrintTemplate: (template) => updateSetting('printTemplate', template),
    setCompanyAddressBn: (address) => updateSetting('companyAddressBn', address),
    setCompanyAddressEn: (address) => updateSetting('companyAddressEn', address),
    setCompanyContactBn: (contact) => updateSetting('companyContactBn', contact),
    setCompanyContactEn: (contact) => updateSetting('companyContactEn', contact),
    setCompanyEmail: (email) => updateSetting('companyEmail', email),
    setCompanyWebsite: (website) => updateSetting('companyWebsite', website),
    setPrintFooterMessage: (message) => updateSetting('printFooterMessage', message),
    setDefaultPrintOptions: (options) => updateSetting('defaultPrintOptions', options),
    updateNotificationSettings: (settings) => updateSetting('notificationSettings', settings),
    updateBackupSettings: (updates) => updateSetting('backupSettings', { ...currentSettings.backupSettings, ...updates }),
    setVatPercentage: (vat) => updateSetting('vatPercentage', vat),
    setInitialCashBalance: (balance) => updateSetting('initialCashBalance', balance),
    updateLicense: (license) => updateSetting('license', license),

    getCurrentTheme,
    getEffectiveAppName,
    getActiveGradientTheme,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
