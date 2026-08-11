import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'header' | 'footer';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'header', className = '' }) => {
  const sizeClasses = 
    size === 'sm' 
      ? 'h-10 w-10 rounded-lg shadow-sm' 
      : size === 'lg' 
        ? 'h-24 md:h-28 rounded-xl shadow-md' 
        : 'h-16 w-16 md:h-20 md:w-20 rounded-xl shadow-md'; // default size

  return (
    <img 
      src="/logo.jpg" 
      alt="Raipur Samvad" 
      className={`${sizeClasses} object-cover transition-all duration-300 ${className}`} 
    />
  );
};
