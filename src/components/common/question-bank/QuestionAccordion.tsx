import React from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '../../ui/accordion';
import { CategoryTag } from './CategoryTag';
import { IQuestionAnswer, EQuestionStatus } from '../../../types/questionBank';
import { Edit2, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface QuestionAccordionProps {
    questions: IQuestionAnswer[];
    onEdit: (question: IQuestionAnswer) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string) => void;
    onApprove?: (id: string) => void;
    isAdmin?: boolean;
}

export const QuestionAccordion: React.FC<QuestionAccordionProps> = ({
    questions,
    onEdit,
    onDelete,
    onToggleActive,
    onApprove,
    isAdmin = false,
}) => {
    const getStatusBadge = (status: EQuestionStatus) => {
        if (status === EQuestionStatus.APPROVED) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400">
                    <CheckCircle size={10} />
                    Approved
                </span>
            );
        }
        return (
            <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                Pending
            </span>
        );
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this question?')) {
            onDelete(id);
        }
    };

    const handleToggleActive = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleActive(id);
    };

    const handleEdit = (question: IQuestionAnswer, e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(question);
    };

    const handleApprove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onApprove) {
            onApprove(id);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No questions found. Create your first question to get started!
            </div>
        );
    }

    return (
        <Accordion type="multiple" className="w-full space-y-2">
            {questions.map((question, index) => (
                <AccordionItem
                    key={question.id}
                    value={question.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
                >
                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                        <div className="flex items-center gap-3 flex-1 text-left min-w-0">
                            {/* Question Number */}
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-sm font-semibold">
                                {index + 1}
                            </span>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 grid gap-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {question.question}
                                    </p>
                                    {getStatusBadge(question.status)}
                                    {!question.isActive && (
                                        <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                {/* Categories Summary in Header */}
                                {question.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {question.categories.slice(0, 3).map((category) => (
                                            <CategoryTag key={category.id} category={category} className="text-[10px] py-0.5" />
                                        ))}
                                        {question.categories.length > 3 && (
                                            <span className="text-[10px] text-gray-400">+{question.categories.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions in Header */}
                            <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => handleEdit(question, e)}
                                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>

                                <button
                                    onClick={(e) => handleToggleActive(question.id, e)}
                                    className={`p-1.5 rounded-md transition-colors ${question.isActive
                                        ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        : 'text-gray-400 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'}`}
                                    title={question.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {question.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>

                                {isAdmin && question.status === EQuestionStatus.PENDING && onApprove && (
                                    <button
                                        onClick={(e) => handleApprove(question.id, e)}
                                        className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-md transition-colors"
                                        title="Approve"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}

                                <button
                                    onClick={(e) => handleDelete(question.id, e)}
                                    className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-md transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pl-11 pr-4"> {/* Indent to align with text */}
                            <div className="p-3   text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {question.answer}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};
