import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog';
import { CategoryManager } from './CategoryManager';
import {
    IQuestionAnswer,
    IQuestionBankCategory,
    ICreateQuestionPayload,
    IUpdateQuestionPayload,
} from '../../../types/questionBank';

const questionSchema = z.object({
    question: z.string().min(1, 'Question is required').max(255, 'Question must be less than 255 characters'),
    answer: z.string().min(1, 'Answer is required').max(255, 'Answer must be less than 255 characters'),
    categoryIds: z.array(z.string()).min(1, 'At least one category is required'),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ICreateQuestionPayload | IUpdateQuestionPayload) => Promise<void>;
    categories: IQuestionBankCategory[];
    onCreateCategory: (name: string) => Promise<void>;
    onUpdateCategory: (id: string, name: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
    onToggleCategoryActive: (id: string) => Promise<void>;
    editingQuestion?: IQuestionAnswer | null;
    categoriesLoading?: boolean;
    users?: { id: string; name: string; email: string; }[];
    onUserSelect?: (userId: string) => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = (props) => {
    const {
        open,
        onOpenChange,
        onSubmit,
        categories,
        onCreateCategory,
        onUpdateCategory,
        onDeleteCategory,
        onToggleCategoryActive,
        editingQuestion,
        categoriesLoading = false,
    } = props;
    const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<QuestionFormData>();

    useEffect(() => {
        if (editingQuestion) {
            setValue('question', editingQuestion.question);
            setValue('answer', editingQuestion.answer);
            const categoryIds = editingQuestion.categories.map((cat) => cat.id);
            setValue('categoryIds', categoryIds);
            setSelectedCategoryIds(categoryIds);
        } else {
            reset();
            setSelectedCategoryIds([]);
        }
    }, [editingQuestion, setValue, reset]);

    const handleFormSubmit = async (data: QuestionFormData) => {
        if (selectedCategoryIds.length === 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                question: data.question,
                answer: data.answer,
                categoryIds: selectedCategoryIds,
            });
            reset();
            setSelectedCategoryIds([]);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to submit question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            setSelectedCategoryIds([]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingQuestion ? 'Edit Question' : 'Create New Question'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* User Selection (Admin Only) */}
                    {props.users && props.users.length > 0 && !editingQuestion && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select User *
                            </label>
                            <select
                                onChange={(e) => props.onUserSelect?.(e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
                                defaultValue=""
                            >
                                <option value="" disabled>Select a user...</option>
                                {props.users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Question Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Question *
                        </label>
                        <div className="relative">
                            <textarea
                                {...register('question', {
                                    required: 'Question is required',
                                    maxLength: { value: 255, message: 'Question must be less than 255 characters' },
                                    onChange: (e) => {
                                        setValue('question', e.target.value);
                                        // Trigger re-render for char count if needed, or rely on watch
                                    }
                                })}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white ${errors.question ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="Enter your question..."
                                disabled={isSubmitting}
                            />
                            <div className={`absolute bottom-2 right-2 text-xs pointer-events-none ${(watch('question')?.length || 0) >= 240 ? 'text-error-500 font-medium' :
                                (watch('question')?.length || 0) >= 200 ? 'text-warning-500' : 'text-gray-400'
                                }`}>
                                {watch('question')?.length || 0}/255
                            </div>
                        </div>
                        {errors.question && (
                            <p className="text-xs text-error-500 mt-1">{errors.question.message}</p>
                        )}
                    </div>

                    {/* Answer Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Answer *
                        </label>
                        <div className="relative">
                            <textarea
                                {...register('answer', {
                                    required: 'Answer is required',
                                    maxLength: { value: 255, message: 'Answer must be less than 255 characters' },
                                    onChange: (e) => {
                                        setValue('answer', e.target.value);
                                    }
                                })}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white ${errors.answer ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="Enter the answer..."
                                disabled={isSubmitting}
                            />
                            <div className={`absolute bottom-2 right-2 text-xs pointer-events-none ${(watch('answer')?.length || 0) >= 240 ? 'text-error-500 font-medium' :
                                (watch('answer')?.length || 0) >= 200 ? 'text-warning-500' : 'text-gray-400'
                                }`}>
                                {watch('answer')?.length || 0}/255
                            </div>
                        </div>
                        {errors.answer && (
                            <p className="text-xs text-error-500 mt-1">{errors.answer.message}</p>
                        )}
                    </div>

                    {/* Categories Field */}
                    <div>
                        <CategoryManager
                            categories={categories}
                            selectedCategoryIds={selectedCategoryIds}
                            onCategorySelect={(ids) => {
                                setSelectedCategoryIds(ids);
                                setValue('categoryIds', ids);
                            }}
                            onCreate={onCreateCategory}
                            onUpdate={onUpdateCategory}
                            onDelete={onDeleteCategory}
                            onToggleActive={onToggleCategoryActive}
                            isLoading={categoriesLoading}
                            minRequired={1}
                        />
                        {selectedCategoryIds.length === 0 && (
                            <p className="text-xs text-error-500 mt-1">At least one category is required</p>
                        )}
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedCategoryIds.length === 0}
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : editingQuestion ? 'Update' : 'Create'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
