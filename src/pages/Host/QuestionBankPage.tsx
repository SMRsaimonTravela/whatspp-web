import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageMeta from '../../components/common/PageMeta';
import { hostService } from '../../services/hostService';
import { QuestionAccordion } from '../../components/common/question-bank/QuestionAccordion';
import { QuestionForm } from '../../components/common/question-bank/QuestionForm';
import { ExampleQAModal } from '../../components/common/question-bank/ExampleQAModal';
import DynamicFilter from '../../components/common/DynamicFilter';
import CommonPagination from '../../components/common/CommonPagination';
import {
    IQuestionAnswer,
    ICreateQuestionPayload,
    IUpdateQuestionPayload,
    IPaginatedQuestionResponse,
    IPaginatedCategoryResponse,
} from '../../types/questionBank';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function QuestionBankPage() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Record<string, unknown>>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<IQuestionAnswer | null>(null);
    const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);

    // Fetch Questions
    const {
        data: questionsData,
        isLoading: questionsLoading,
        error: questionsError,
    } = useQuery<IPaginatedQuestionResponse>({
        queryKey: ['host-questions', currentPage, filters],
        queryFn: () =>
            hostService.getQuestionBankQuestions({
                page: currentPage,
                limit: 20,
                ...filters,
            }),
    });

    // Fetch Categories
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
    } = useQuery<IPaginatedCategoryResponse>({
        queryKey: ['host-categories'],
        queryFn: () => hostService.getQuestionBankCategories({ limit: 100 }),
    });

    const questions = questionsData?.data || [];
    const categories = categoriesData?.data || [];
    const pagination = questionsData?.pagination;
    const apiFilters = questionsData?.filters || {};

    // Mutations for Questions
    const createQuestionMutation = useMutation({
        mutationFn: (data: ICreateQuestionPayload) =>
            hostService.createQuestionBankQuestion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-questions'] });
            toast.success('Question created successfully');
        },
        onError: () => {
            toast.error('Failed to create question');
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateQuestionPayload }) =>
            hostService.updateQuestionBankQuestion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-questions'] });
            toast.success('Question updated successfully');
        },
        onError: () => {
            toast.error('Failed to update question');
        },
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (id: string) => hostService.deleteQuestionBankQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-questions'] });
            toast.success('Question deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete question');
        },
    });

    const toggleQuestionActiveMutation = useMutation({
        mutationFn: (id: string) => hostService.toggleQuestionBankQuestionActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-questions'] });
            toast.success('Question status updated');
        },
        onError: () => {
            toast.error('Failed to update question status');
        },
    });

    // Mutations for Categories
    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => hostService.createQuestionBankCategory({ name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-categories'] });
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            hostService.updateQuestionBankCategory(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-categories'] });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => hostService.deleteQuestionBankCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-categories'] });
        },
    });

    const toggleCategoryActiveMutation = useMutation({
        mutationFn: (id: string) => hostService.toggleQuestionBankCategoryActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['host-categories'] });
        },
    });

    // Handlers
    const handleCreateQuestion = () => {
        setEditingQuestion(null);
        setIsFormOpen(true);
    };

    const handleEditQuestion = (question: IQuestionAnswer) => {
        setEditingQuestion(question);
        setIsFormOpen(true);
    };

    const handleSubmitQuestion = async (data: ICreateQuestionPayload | IUpdateQuestionPayload) => {
        if (editingQuestion) {
            await updateQuestionMutation.mutateAsync({
                id: editingQuestion.id,
                data: data as IUpdateQuestionPayload,
            });
        } else {
            await createQuestionMutation.mutateAsync(data as ICreateQuestionPayload);
        }
    };

    const handleFilterChange = (newFilters: Record<string, unknown>) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    return (
        <>
            <PageMeta
                title="Question Bank | WhatsApp AI Bot"
                description="Manage your Q&A pairs for the AI bot"
            />

            <div className="space-y-6">
                {/* Header & Filters Card */}
                <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Question Bank
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Questions Used: <span className="font-medium text-brand-600 dark:text-brand-400">{pagination?.total || 0}</span> / 100
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsExampleModalOpen(true)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Show Example Q&A
                            </button>
                            <button
                                onClick={handleCreateQuestion}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                            >
                                <Plus size={20} />
                                Add Question
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    {Object.keys(apiFilters).length > 0 && (
                        <DynamicFilter
                            filters={apiFilters}
                            values={filters}
                            onChange={handleFilterChange}
                        />
                    )}
                </div>

                {/* Questions List Card */}
                <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    {/* Category Tabs */}
                    <div className="mb-6 overflow-x-auto pb-2 -mx-2 px-2">
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => {
                                    const newFilters = { ...filters };
                                    delete newFilters.categoryId;
                                    handleFilterChange(newFilters);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${!filters.categoryId
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                All Questions
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleFilterChange({ ...filters, categoryId: cat.id })}
                                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${filters.categoryId === cat.id
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Questions List */}
                    {questionsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : questionsError ? (
                        <div className="text-center py-12">
                            <p className="text-error-500">Failed to load questions. Please try again.</p>
                        </div>
                    ) : (
                        <QuestionAccordion
                            questions={questions}
                            onEdit={handleEditQuestion}
                            onDelete={(id) => deleteQuestionMutation.mutate(id)}
                            onToggleActive={(id) => toggleQuestionActiveMutation.mutate(id)}
                        />
                    )}

                    {/* Pagination */}
                    {pagination && pagination.total > pagination.per_page && (
                        <div className="mt-6">
                            <CommonPagination
                                pagination={pagination}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Question Form Dialog */}
            <QuestionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleSubmitQuestion}
                categories={categories}
                onCreateCategory={(name) => createCategoryMutation.mutateAsync(name)}
                onUpdateCategory={(id, name) => updateCategoryMutation.mutateAsync({ id, name })}
                onDeleteCategory={(id) => deleteCategoryMutation.mutateAsync(id)}
                onToggleCategoryActive={(id) => toggleCategoryActiveMutation.mutateAsync(id)}
                editingQuestion={editingQuestion}
                categoriesLoading={categoriesLoading}
            />

            {/* Example Q&A Modal */}
            <ExampleQAModal
                open={isExampleModalOpen}
                onOpenChange={setIsExampleModalOpen}
            />
        </>
    );
}
