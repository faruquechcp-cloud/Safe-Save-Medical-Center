
import React from 'react';

interface ArrowUpCircleIconProps {
  className?: string;
}

const ArrowUpCircleIcon: React.FC<ArrowUpCircleIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default ArrowUpCircleIcon;
