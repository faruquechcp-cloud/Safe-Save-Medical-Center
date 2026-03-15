
import React from 'react';

interface PrinterIconProps {
  className?: string;
}

const PrinterIcon: React.FC<PrinterIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75 6.75 4.5 17.25 4.5 17.25 6.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75 4.5 6.75 4.5 20.25 19.5 20.25 19.5 6.75 17.25 6.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8.25 13.5 8.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.75 14.25 15.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75 14.25 12.75" />
  </svg>
);

export default PrinterIcon;
