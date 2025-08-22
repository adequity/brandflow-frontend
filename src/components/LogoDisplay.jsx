import React from 'react';
import useLogo from '../hooks/useLogo';

const LogoDisplay = ({ 
    size = 'medium', 
    className = '', 
    showText = true,
    textClassName = ''
}) => {
    const { getLogoDisplay, isLoading } = useLogo();

    if (isLoading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="bg-gray-300 rounded h-6 w-24"></div>
            </div>
        );
    }

    const logoDisplay = getLogoDisplay();

    const sizeClasses = {
        small: 'h-6 max-w-20',
        medium: 'h-8 max-w-32',
        large: 'h-12 max-w-48',
        xlarge: 'h-16 max-w-64'
    };

    const textSizeClasses = {
        small: 'text-lg',
        medium: 'text-xl',
        large: 'text-2xl',
        xlarge: 'text-3xl'
    };

    if (logoDisplay.type === 'image') {
        return (
            <div className={`flex items-center ${className}`}>
                <img 
                    src={logoDisplay.src} 
                    alt={logoDisplay.alt}
                    className={`object-contain ${sizeClasses[size]}`}
                />
            </div>
        );
    }

    if (showText) {
        return (
            <div className={`flex items-center ${className}`}>
                <span className={`${logoDisplay.className} ${textSizeClasses[size]} ${textClassName}`}>
                    {logoDisplay.text}
                </span>
            </div>
        );
    }

    return null;
};

export default LogoDisplay;