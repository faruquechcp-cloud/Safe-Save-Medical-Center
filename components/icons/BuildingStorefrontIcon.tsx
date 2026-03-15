import React from 'react';

interface BuildingStorefrontIconProps {
  className?: string;
}

const BuildingStorefrontIcon: React.FC<BuildingStorefrontIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25H10.5V7.5h3v3.75a2.25 2.25 0 002.25 2.25H16.5v7.5h-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 21v-7.125A2.25 2.25 0 019 11.625h2.25c.154 0 .303-.024.446-.071L18 9.75M21 21v-2.25c0-.966-.784-1.75-1.75-1.75H16.5V15H15V7.5m-3 7.5V15m1.5 0V7.5M3 21h18M3 10.5h18M3 7.5h18M3 4.5h18.007M12 4.5v3M4.5 3.75h15A2.25 2.25 0 0121.75 6v10.5A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5V6A2.25 2.25 0 014.5 3.75z" />
  </svg>
);

export default BuildingStorefrontIcon;
