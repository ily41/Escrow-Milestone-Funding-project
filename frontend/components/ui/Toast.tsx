'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'pending' | 'confirmed';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        if (duration > 0 && type !== 'pending') {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, type]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose(id);
        }, 300); // Wait for exit animation
    };

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#4CAF50' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                    borderColor: '#4CAF50',
                    bgColor: 'var(--color-soft-gold)',
                };
            case 'error':
                return {
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ),
                    borderColor: 'var(--color-deep-red)',
                    bgColor: 'var(--color-soft-gold)',
                };
            case 'warning':
                return {
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ),
                    borderColor: '#f59e0b',
                    bgColor: 'var(--color-soft-gold)',
                };
            case 'pending':
                return {
                    icon: (
                        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ),
                    borderColor: 'var(--color-deep-red)',
                    bgColor: 'var(--color-soft-gold)',
                };
            case 'confirmed':
                return {
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9333ea' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    borderColor: '#9333ea',
                    bgColor: 'var(--color-soft-gold)',
                };
            default:
                return {
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    borderColor: 'var(--color-deep-red)',
                    bgColor: 'var(--color-soft-gold)',
                };
        }
    };

    const { icon, borderColor, bgColor } = getIconAndColors();

    return (
        <div
            className={`
        flex items-center w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg border-l-4
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
            style={{
                backgroundColor: bgColor,
                borderLeftColor: borderColor,
                color: 'var(--color-matte-black)',
            }}
            role="alert"
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
                {icon}
            </div>
            <div className="ml-3 text-sm font-normal" style={{ color: 'var(--color-matte-black)' }}>{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 hover:opacity-70 transition-opacity"
                style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-matte-black)',
                }}
                onClick={handleClose}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
            </button>
        </div>
    );
};

// Toast Container to manage multiple toasts
export const ToastContainer = () => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleAddToast = (event: CustomEvent<ToastProps>) => {
            setToasts((prev) => [...prev, event.detail]);
        };

        window.addEventListener('add-toast' as any, handleAddToast);

        return () => {
            window.removeEventListener('add-toast' as any, handleAddToast);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>,
        document.body
    );
};

// Helper function to trigger toasts
export const toast = {
    success: (message: string, duration?: number) => dispatchToast(message, 'success', duration),
    error: (message: string, duration?: number) => dispatchToast(message, 'error', duration),
    warning: (message: string, duration?: number) => dispatchToast(message, 'warning', duration),
    info: (message: string, duration?: number) => dispatchToast(message, 'info', duration),
    pending: (message: string) => dispatchToast(message, 'pending', 0), // Pending usually stays until updated
    confirmed: (message: string, duration?: number) => dispatchToast(message, 'confirmed', duration),
};

const dispatchToast = (message: string, type: ToastType, duration?: number) => {
    const event = new CustomEvent('add-toast', {
        detail: {
            id: Math.random().toString(36).substr(2, 9),
            message,
            type,
            duration,
        },
    });
    window.dispatchEvent(event);
};

export default Toast;
