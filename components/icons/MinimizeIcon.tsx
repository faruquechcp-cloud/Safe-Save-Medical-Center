import React from 'react';

interface MinimizeIconProps {
  className?: string;
}

const MinimizeIcon: React.FC<MinimizeIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-5 h-5"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

export default MinimizeIcon;
