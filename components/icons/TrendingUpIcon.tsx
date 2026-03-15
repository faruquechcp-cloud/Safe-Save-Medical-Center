import React from 'react';

interface TrendingUpIconProps {
  className?: string;
}

const TrendingUpIcon: React.FC<TrendingUpIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21.75 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 7.5h3v3" />
  </svg>
);

export default TrendingUpIcon;
