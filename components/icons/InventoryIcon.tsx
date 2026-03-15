import React from 'react';

interface InventoryIconProps {
  className?: string;
}

const InventoryIcon: React.FC<InventoryIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 3v1.5m0 0a2.25 2.25 0 012.25 2.25h1.5a2.25 2.25 0 012.25 2.25V21h-12V9A2.25 2.25 0 016 6.75h1.5A2.25 2.25 0 019.75 4.5V3m0 0h4.5M3.75 7.5h16.5" />
  </svg>
);

export default InventoryIcon;
