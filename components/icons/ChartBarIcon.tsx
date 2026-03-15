import React from 'react';

interface ChartBarIconProps {
  className?: string;
}

const ChartBarIcon: React.FC<ChartBarIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12H5.25V8.25C5.25 7.629 5.754 7.125 6.375 7.125H7.5V3.375C7.5 2.754 8.004 2.25 8.625 2.25H9.75V1.5H6.375C5.053 1.5 3.975 2.578 3.975 3.9V13.125H3ZM12.75 21.75V11.25C12.75 10.629 13.254 10.125 13.875 10.125H15V6.375C15 5.754 15.504 5.25 16.125 5.25H17.25V4.5H13.875C12.553 4.5 11.475 5.578 11.475 6.9V21.75H12.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V21.75H9.375V7.5H8.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V21.75H16.875V10.5H15.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 18.375V21.75H21.375V18.375C21.375 17.053 20.297 15.975 18.975 15.975H18.75V15.225H20.25C20.871 15.225 21.375 15.729 21.375 16.35V18.375Z" />
 </svg>
);

export default ChartBarIcon;