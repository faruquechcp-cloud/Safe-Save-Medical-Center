import React from 'react';

interface MessengerIconProps {
  className?: string;
}

const MessengerIcon: React.FC<MessengerIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.463 5.496 3.743 7.152.196.142.31.368.31.61v2.54c0 .48.53.76.92.48l2.84-2.03c.16-.11.35-.17.55-.17h1.637c5.523 0 10-4.145 10-9.258S17.523 2 12 2zm4.84 8.74l-2.67 4.24c-.4.63-1.26.78-1.85.31l-2.33-1.87c-.18-.14-.43-.14-.61 0l-2.88 2.16c-.36.27-.85-.12-.66-.52l2.67-4.24c.4-.63 1.26-.78 1.85-.31l2.33 1.87c.18.14.43.14.61 0l2.88-2.16c.36-.27.85.12.66.52z" />
  </svg>
);

export default MessengerIcon;
