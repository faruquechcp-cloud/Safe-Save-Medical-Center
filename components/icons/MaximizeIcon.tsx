import React from 'react';

interface MaximizeIconProps {
  className?: string;
}

const MaximizeIcon: React.FC<MaximizeIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-5 h-5"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25h13.5v13.5H5.25V5.25z" />
  </svg>
);

export default MaximizeIcon;
