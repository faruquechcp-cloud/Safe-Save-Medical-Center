import React from 'react';

interface RestoreDownIconProps {
  className?: string;
}

const RestoreDownIcon: React.FC<RestoreDownIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-5 h-5"}
  >
    {/* Back rectangle */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25v-1.5A2.25 2.25 0 0013.5 4.5h-6A2.25 2.25 0 005.25 6.75v6A2.25 2.25 0 007.5 15h1.5" />
    {/* Front rectangle */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h6A2.25 2.25 0 0116.5 12v6a2.25 2.25 0 01-2.25 2.25h-6A2.25 2.25 0 016 18v-6A2.25 2.25 0 018.25 9.75z" />
  </svg>
);

export default RestoreDownIcon;
