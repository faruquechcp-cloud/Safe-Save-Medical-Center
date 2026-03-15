
import React from 'react';

interface PillIconProps {
  className?: string;
}

const PillIcon: React.FC<PillIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M12 5c-3.86 0-7 3.14-7 7s3.14 7 7 7V5z"/>
  </svg>
);

export default PillIcon;
