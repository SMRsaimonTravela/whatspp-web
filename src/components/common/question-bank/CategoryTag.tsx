import React from 'react';
import { X } from 'lucide-react';
import { IQuestionBankCategory } from '../../../types/questionBank';
import { getRandomColor, getContrastTextColor } from '../../../utils/colors';

interface CategoryTagProps {
    category: IQuestionBankCategory;
    onRemove?: () => void;
    removable?: boolean;
    className?: string;
    onClick?: () => void;
    isSelected?: boolean;
}

export const CategoryTag: React.FC<CategoryTagProps> = ({
    category,
    onRemove,
    removable = false,
    className = '',
    onClick,
    isSelected,
}) => {
    // Determine styles
    let style = {};
    let classes = `inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[6px] transition-all border ${className}`;

    if (category.isActive) {
        const bgColor = getRandomColor(category.id);
        const textColor = getContrastTextColor(bgColor);
        style = {
            backgroundColor: bgColor,
            color: textColor,
            borderColor: isSelected ? 'currentColor' : 'transparent',
        };

        if (isSelected) {
            classes += ' ring-2 ring-offset-1 ring-brand-500 dark:ring-offset-gray-900';
        }
    } else {
        classes += ' bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-transparent';
    }

    if (onClick) {
        classes += ' cursor-pointer hover:opacity-80 active:scale-95';
    }

    const Component = onClick ? 'button' : 'span';

    return (
        <Component
            className={classes}
            style={style}
            onClick={onClick}
            type={onClick ? "button" : undefined}
        >
            {category.name}
            {removable && onRemove && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:brightness-90 rounded-full p-0.5 transition-all"
                    style={{ color: 'inherit' }}
                >
                    <X size={12} />
                </div>
            )}
        </Component>
    );
};
