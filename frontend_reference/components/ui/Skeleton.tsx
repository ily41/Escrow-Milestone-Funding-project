import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    variant = 'text',
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

    const variantClasses = {
        text: 'rounded-md',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
