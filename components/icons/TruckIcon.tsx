import React from 'react';

interface TruckIconProps {
  className?: string;
}

const TruckIcon: React.FC<TruckIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M7.5 18L6 19.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 18L18 19.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 13.5L4.5 6H19.5L21 13.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18H3V10.5C3 9.67157 3.67157 9 4.5 9H19.5C20.3284 9 21 9.67157 21 10.5V18H12Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18V9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 18A1.5 1.5 0 1 0 7.5 15A1.5 1.5 0 0 0 7.5 18Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 18A1.5 1.5 0 1 0 16.5 15A1.5 1.5 0 0 0 16.5 18Z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default TruckIcon;
