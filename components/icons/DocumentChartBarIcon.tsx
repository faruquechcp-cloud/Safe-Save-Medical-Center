import React from 'react';

interface DocumentChartBarIconProps {
  className?: string;
}

const DocumentChartBarIcon: React.FC<DocumentChartBarIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25V7.5M12 17.25V4.5M15 17.25V10.5M17.25 21h-10.5A2.25 2.25 0 014.5 18.75V5.25A2.25 2.25 0 016.75 3h10.5A2.25 2.25 0 0119.5 5.25v13.5A2.25 2.25 0 0117.25 21z" />
  </svg>
);

export default DocumentChartBarIcon;
