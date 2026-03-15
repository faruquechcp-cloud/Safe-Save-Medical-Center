
export interface ThemeColorPalette {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

export interface AppTheme {
  name: string;
  key: string;
  palette: ThemeColorPalette;
}

export interface GradientTheme {
  name: string;
  key: string;
  startColor: string;
  endColor: string;
  angle: string; // e.g., 'to right', '45deg'
}

export const themes: AppTheme[] = [
  {
    name: "Teal (Default)",
    key: "teal",
    palette: {
      '50': '#f0fdfa', '100': '#ccfbf1', '200': '#a7f3d0', '300': '#74e6b9', '400': '#2dd4bf',
      '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e'
    }
  },
  {
    name: "Blue",
    key: "blue",
    palette: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
      '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554'
    }
  },
  {
    name: "Indigo",
    key: "indigo",
    palette: {
      '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8',
      '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b'
    }
  },
  {
    name: "Rose",
    key: "rose",
    palette: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185',
      '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519'
    }
  },
  {
    name: "Emerald",
    key: "emerald",
    palette: {
      '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399',
      '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22'
    }
  },
];

export const gradientThemes: GradientTheme[] = [
  { name: 'Ocean Breeze', key: 'ocean_breeze', startColor: '#2E3192', endColor: '#1BFFFF', angle: 'to right' },
  { name: 'Sunset', key: 'sunset', startColor: '#FF9933', endColor: '#FF5E62', angle: '135deg' },
  { name: 'Forest Dew', key: 'forest_dew', startColor: '#00467F', endColor: '#A5CC82', angle: 'to bottom right' },
  { name: 'Purple Bliss', key: 'purple_bliss', startColor: '#6713D2', endColor: '#CC208E', angle: 'to top left' },
  { name: 'Mango Passion', key: 'mango_passion', startColor: '#ffe259', endColor: '#ffa751', angle: '6deg' },
  { name: 'Aqua Marine', key: 'aqua_marine', startColor: '#13547a', endColor: '#80d0c7', angle: 'to right' }
];


export const availableFonts = [
  { name: "System Default (Native)", value: "'Hind Siliguri', 'Noto Sans Bengali', 'Siyam Rupali', 'Vrinda', 'SolaimanLipi', 'Bangla Sangam MN', 'Bangla MN', 'Lohit Bengali', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
  { name: "Hind Siliguri (Bengali - Modern)", value: "'Hind Siliguri', 'Siyam Rupali', 'Vrinda', sans-serif" },
  { name: "Inter (English - Global Standard)", value: "'Inter', sans-serif" },
  { name: "Noto Sans Bengali", value: "'Noto Sans Bengali', 'Siyam Rupali', 'Vrinda', sans-serif" },
  { name: "Roboto (Modern Sans)", value: "'Roboto', sans-serif" }, 
  { name: "Lato (Professional)", value: "'Lato', sans-serif" },
  { name: "Arial", value: "Arial, Helvetica, sans-serif" },
  { name: "Verdana", value: "Verdana, Geneva, Tahoma, sans-serif" },
];

export const fontSizes = [
  { name: "Small", value: "14px", remBase: 0.875 },
  { name: "Medium (Default)", value: "16px", remBase: 1 },
  { name: "Large", value: "18px", remBase: 1.125 },
  { name: "Extra Large", value: "20px", remBase: 1.25},
];

export type PrintTemplateType = 'standard' | 'thermal' | 'professional' | 'modern' | 'minimalist';
export type PaperSize = 'A4' | 'A5' | 'Letter' | 'Thermal80' | 'Custom';

export interface PrintOptions {
  showBatch: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTotal: boolean;
  showReason: boolean;
  paperSize: PaperSize;
  customWidth: number;
  customHeight: number;
  contentScale: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export const defaultSettings = {
  themeKey: 'teal',
  appNameBn: 'সেফ এন্ড সেভ মেডিক্যাল সেন্টার', 
  appNameEn: 'Safe & Save Medical Center',
  proprietorBn: '',
  proprietorEn: '',
  logoUrl: '', 
  appIconUrl: '/favicon.ico', 
  fontFamily: availableFonts[0].value,
  fontSize: fontSizes[1].value,
  accentPhotoUrl: '',
  language: 'bn' as const,
  isCustomSolidActive: false,
  customSolidColor: themes[0].palette['500'], 
  isGradientThemeActive: false,
  activeGradientThemeKey: null as string | null,
  // Print Settings
  printTemplate: 'standard' as PrintTemplateType,
  companyAddressBn: '',
  companyAddressEn: '',
  companyContactBn: '',
  companyContactEn: '',
  companyEmail: '',
  companyWebsite: '',
  printFooterMessage: 'আমাদের সেবা গ্রহণের জন্য ধন্যবাদ!',
  // Print Options Defaults
  defaultPrintOptions: {
    showBatch: true,
    showUnitPrice: true,
    showDiscount: true,
    showTotal: true,
    showReason: true,
    paperSize: 'A4' as PaperSize,
    customWidth: 210,
    customHeight: 297,
    contentScale: 100, // as percentage
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  }
};
