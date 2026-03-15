
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations'; // Import useTranslations

const Footer: React.FC = () => {
  const { getEffectiveAppName } = useSettings();
  const { t } = useTranslations();
  const appNameDisplay = getEffectiveAppName(); // Use translated app name

  const year = new Date().getFullYear();
  const copyrightText = t('footer.copyright', `© ${year} ${appNameDisplay}. All rights reserved.`);
  // Basic replacement for placeholder
  const formattedCopyright = copyrightText
    .replace('{year}', year.toString())
    .replace('{appName}', appNameDisplay);


  return (
    <footer className="bg-[var(--theme-bg-800,theme(colors.gray.800))] text-[var(--theme-text-100,theme(colors.gray.100))] text-center py-4 mt-auto print:hidden">
      <div className="container mx-auto px-4">
        <p>{formattedCopyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
