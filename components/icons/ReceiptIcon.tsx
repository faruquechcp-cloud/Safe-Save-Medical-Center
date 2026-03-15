import React from 'react';

interface ReceiptIconProps {
  className?: string;
}

const ReceiptIcon: React.FC<ReceiptIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m2.25 0H5.625m3.375 0H18m-12.75 0h.008v.008H5.25v-.008Zm0 0H2.25m9.75-12H9A2.25 2.25 0 0 0 6.75 4.5v15A2.25 2.25 0 0 0 9 21.75h6A2.25 2.25 0 0 0 17.25 19.5V4.5A2.25 2.25 0 0 0 15 2.25H12Zm0 0V9" />
  </svg>
);

export default ReceiptIcon;
