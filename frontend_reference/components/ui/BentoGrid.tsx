import React from 'react';

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={`grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={`row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-md p-4 border justify-between flex flex-col space-y-4 ${className}`}
            style={{
                backgroundColor: 'var(--color-soft-gold)',
                borderColor: 'var(--color-warm-beige)',
            }}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold mb-2 mt-2" style={{ color: 'var(--color-matte-black)' }}>
                    {title}
                </div>
                <div className="font-sans font-normal text-sm" style={{ color: 'var(--color-matte-black)', opacity: 0.8 }}>
                    {description}
                </div>
            </div>
        </div>
    );
};
