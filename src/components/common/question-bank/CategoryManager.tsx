import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { IQuestionBankCategory } from '../../../types/questionBank';
import toast from 'react-hot-toast';

interface CategoryManagerProps {
    categories: IQuestionBankCategory[];
    selectedCategoryIds: string[];
    onCategorySelect: (categoryIds: string[]) => void;
    onCreate: (name: string) => Promise<void>;
    onUpdate: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onToggleActive: (id: string) => Promise<void>;
    isLoading?: boolean;
    minRequired?: number;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories,
    selectedCategoryIds,
    onCategorySelect,
    onCreate,
    onUpdate,
    onDelete,
    onToggleActive,
    isLoading = false,
    minRequired = 1,
}) => {
    const [open, setOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleToggle = (categoryId: string) => {
        if (selectedCategoryIds.includes(categoryId)) {
            if (selectedCategoryIds.length <= minRequired) {
                toast.error(`At least ${minRequired} category is required`);
                return;
            }
            onCategorySelect(selectedCategoryIds.filter((id) => id !== categoryId));
        } else {
            onCategorySelect([...selectedCategoryIds, categoryId]);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Category name is required');
            return;
        }
        setIsCreating(true);
        try {
            await onCreate(newCategoryName.trim());
            setNewCategoryName('');
            toast.success('Category created successfully');
        } catch (error) {
            toast.error('Failed to create category');
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartEdit = (category: IQuestionBankCategory) => {
        setEditingId(category.id);
        setEditingName(category.name);
    };

    const handleSaveEdit = async () => {
        if (!editingName.trim() || !editingId) {
            toast.error('Category name is required');
            return;
        }
        try {
            await onUpdate(editingId, editingName.trim());
            setEditingId(null);
            setEditingName('');
            toast.success('Category updated successfully');
        } catch (error) {
            toast.error('Failed to update category');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await onDelete(id);
            // Remove from selected if it was selected
            if (selectedCategoryIds.includes(id)) {
                onCategorySelect(selectedCategoryIds.filter((cid) => cid !== id));
            }
            toast.success('Category deleted successfully');
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await onToggleActive(id);
            toast.success('Category status updated');
        } catch (error) {
            toast.error('Failed to update category status');
        }
    };

    const selectedCategories = categories.filter((cat) =>
        selectedCategoryIds.includes(cat.id)
    );

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categories *
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start min-h-[42px] h-auto"
                        type="button"
                    >
                        {selectedCategories.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {selectedCategories.map((cat) => (
                                    <span
                                        key={cat.id}
                                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${cat.isActive
                                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            }`}
                                    >
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-400">Select or create categories...</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="max-h-96 overflow-y-auto">
                        {/* Create New Category */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Create New Category
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCreate();
                                        }
                                    }}
                                    placeholder="Type category name..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:border-brand-500"
                                    disabled={isCreating}
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !newCategoryName.trim()}
                                    className="px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    type="button"
                                    title="Create Category"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="p-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-500"></div>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                    <p className="mb-1">No categories found.</p>
                                    <p className="text-xs">Type above and press Enter to create one!</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                                        >
                                            <Checkbox
                                                checked={selectedCategoryIds.includes(category.id)}
                                                onCheckedChange={() => handleToggle(category.id)}
                                                id={`category-${category.id}`}
                                            />

                                            {editingId === category.id ? (
                                                <div className="flex-1 flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleSaveEdit();
                                                            } else if (e.key === 'Escape') {
                                                                handleCancelEdit();
                                                            }
                                                        }}
                                                        className="flex-1 px-2 py-1 text-sm border border-brand-500 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="p-1 text-success-600 hover:bg-success-100 dark:hover:bg-success-500/20 rounded transition-colors"
                                                        type="button"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-1 text-error-600 hover:bg-error-100 dark:hover:bg-error-500/20 rounded transition-colors"
                                                        type="button"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <label
                                                        htmlFor={`category-${category.id}`}
                                                        className={`flex-1 text-sm cursor-pointer ${category.isActive
                                                            ? 'text-gray-800 dark:text-white'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                            }`}
                                                    >
                                                        {category.name}
                                                        {!category.isActive && (
                                                            <span className="ml-1 text-xs">(Inactive)</span>
                                                        )}
                                                    </label>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleToggleActive(category.id)}
                                                            className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                            title={category.isActive ? 'Deactivate' : 'Activate'}
                                                            type="button"
                                                        >
                                                            {category.isActive ? (
                                                                <Eye size={14} />
                                                            ) : (
                                                                <EyeOff size={14} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleStartEdit(category)}
                                                            className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                            title="Edit"
                                                            type="button"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="p-1 text-error-600 hover:bg-error-100 dark:hover:bg-error-500/20 rounded transition-colors"
                                                            title="Delete"
                                                            type="button"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {selectedCategories.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                </p>
            )}
        </div>
    );
};
