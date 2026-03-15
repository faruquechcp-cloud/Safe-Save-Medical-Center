
import React from 'react';

interface LanguageIconProps {
  className?: string;
}

const LanguageIcon: React.FC<LanguageIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502M9 5.25c-.653-.115-1.326-.186-2.008-.230M21 11.25v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V11.25M3 11.25a2.25 2.25 0 00-2.25-2.25v7.5A2.25 2.25 0 003 18.75m18-7.5A2.25 2.25 0 0021 9V5.25A2.25 2.25 0 0018.75 3h-7.5A2.25 2.25 0 009 5.25v3.75m.75 11.25h10.5" />
  </svg>
);

export default LanguageIcon;
