import { useEffect, useRef } from 'react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
}) => {
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-999 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed bottom-0 left-0 right-0 z-99999 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out sm:rounded-t-3xl ${isOpen ? 'translate-y-0' : 'translate-y-full'
                    } ${className}`}
                style={{ maxHeight: '90vh' }}
            >
                <div className="flex flex-col h-full">
                    {/* Handle for dragging (visual) */}
                    <div className="flex justify-center p-2">
                        <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>

                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};
