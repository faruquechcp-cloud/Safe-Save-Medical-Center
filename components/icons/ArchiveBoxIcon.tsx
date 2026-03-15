
import React from 'react';

interface ArchiveBoxIconProps {
  className?: string;
}

const ArchiveBoxIcon: React.FC<ArchiveBoxIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 21h16.5M12 16.5v4.5m-3.75-4.5H12m3.75-4.5H12M12 3v3.75m0 0h-3.75M12 6.75h3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v8.25A2.25 2.25 0 0118 16.5H6A2.25 2.25 0 013.75 14.25V6z" />
  </svg>
);

export default ArchiveBoxIcon;
