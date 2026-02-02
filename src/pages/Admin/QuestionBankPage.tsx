import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageMeta from '../../components/common/PageMeta';
import { adminService } from '../../services/adminService';
import { QuestionAccordion } from '../../components/common/question-bank/QuestionAccordion';
import { QuestionForm } from '../../components/common/question-bank/QuestionForm';
import DynamicFilter from '../../components/common/DynamicFilter';
import CommonPagination from '../../components/common/CommonPagination';
import {
    IQuestionAnswer,
    ICreateQuestionAdminPayload,
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
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // Fetch Questions
    const {
        data: questionsData,
        isLoading: questionsLoading,
        error: questionsError,
    } = useQuery<IPaginatedQuestionResponse>({
        queryKey: ['admin-questions', currentPage, filters, selectedUserId],
        queryFn: () =>
            adminService.getQuestionBankQuestions({
                page: currentPage,
                limit: 20,
                ...filters,
                userId: selectedUserId,
            }),
        enabled: !!selectedUserId,
    });

    // Fetch Categories
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
    } = useQuery<IPaginatedCategoryResponse>({
        queryKey: ['admin-categories', selectedUserId],
        queryFn: () =>
            adminService.getQuestionBankCategories({
                limit: 100,
                userId: selectedUserId,
            }),
        enabled: !!selectedUserId,
    });

    const questions = questionsData?.data || [];
    const categories = categoriesData?.data || [];
    const pagination = questionsData?.pagination;
    const apiFilters = questionsData?.filters || {};

    // Mutations for Questions
    const createQuestionMutation = useMutation({
        mutationFn: (data: ICreateQuestionAdminPayload) =>
            adminService.createQuestionBankQuestion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            toast.success('Question created successfully');
        },
        onError: () => {
            toast.error('Failed to create question');
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateQuestionPayload }) =>
            adminService.updateQuestionBankQuestion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            toast.success('Question updated successfully');
        },
        onError: () => {
            toast.error('Failed to update question');
        },
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteQuestionBankQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            toast.success('Question deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete question');
        },
    });

    const toggleQuestionActiveMutation = useMutation({
        mutationFn: (id: string) => adminService.toggleQuestionBankQuestionActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            toast.success('Question status updated');
        },
        onError: () => {
            toast.error('Failed to update question status');
        },
    });

    const approveQuestionMutation = useMutation({
        mutationFn: (id: string) => adminService.approveQuestionBankQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            toast.success('Question approved successfully');
        },
        onError: () => {
            toast.error('Failed to approve question');
        },
    });

    // Mutations for Categories
    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => {
            if (!selectedUserId) {
                throw new Error('Please select a user first');
            }
            return adminService.createQuestionBankCategory({ name, userId: selectedUserId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create category');
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            adminService.updateQuestionBankCategory(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteQuestionBankCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
    });

    const toggleCategoryActiveMutation = useMutation({
        mutationFn: (id: string) => adminService.toggleQuestionBankCategoryActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
    });

    // Fetch Hosts for selection
    const { data: hostsData } = useQuery({
        queryKey: ['admin-hosts-list'],
        queryFn: () => adminService.getHostUsers({ limit: 100 }),
    });

    const hosts = hostsData?.data || [];

    // Handlers
    const handleCreateQuestion = () => {
        if (!selectedUserId) {
            toast.error('Please select a host first');
            return;
        }
        setEditingQuestion(null);
        setIsFormOpen(true);
    };

    const handleEditQuestion = (question: IQuestionAnswer) => {
        setEditingQuestion(question);
        setSelectedUserId(question.createdById);
        setIsFormOpen(true);
    };

    const handleSubmitQuestion = async (
        data: ICreateQuestionAdminPayload | IUpdateQuestionPayload
    ) => {
        if (editingQuestion) {
            await updateQuestionMutation.mutateAsync({
                id: editingQuestion.id,
                data: data as IUpdateQuestionPayload,
            });
        } else {
            if (!selectedUserId) {
                toast.error('Please select a user first');
                return;
            }
            await createQuestionMutation.mutateAsync({
                ...(data as IUpdateQuestionPayload),
                userId: selectedUserId,
            } as ICreateQuestionAdminPayload);
        }
    };

    const handleFilterChange = (newFilters: Record<string, unknown>) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const selectedHost = hosts.find(h => h.id === selectedUserId);

    return (
        <>
            <PageMeta
                title="Question Bank (Admin) | WhatsApp AI Bot"
                description="Manage Q&A pairs for all users"
            />

            <div className="space-y-6">
                {/* Header Card with Host Selection */}
                <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                    Question Bank <span className="text-sm text-gray-500">(Admin)</span>
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Manage Q&A pairs for specific hosts
                                </p>
                            </div>

                            {selectedUserId && (
                                <button
                                    onClick={handleCreateQuestion}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                                >
                                    <Plus size={20} />
                                    Add Question
                                </button>
                            )}
                        </div>

                        {/* Global Host Selector */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Host to Manage
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => {
                                    setSelectedUserId(e.target.value);
                                    setFilters({}); // Reset filters when changing user
                                    setCurrentPage(1);
                                }}
                                className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 text-base text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none transition-colors"
                            >
                                <option value="">-- Select a Host --</option>
                                {hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name} ({host.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filters - Only shown when user is selected */}
                        {selectedUserId && Object.keys(apiFilters).length > 0 && (
                            <div className="mt-2 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <DynamicFilter
                                    filters={apiFilters}
                                    values={filters}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area - Only shown when user is selected */}
                {!selectedUserId ? (
                    <div className="rounded-2xl bg-white p-12 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Host Selected
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Please select a host from the dropdown above to view and manage their Question Bank.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                        {/* Questions Header Stats */}
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {selectedHost?.name}'s Questions
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total: <span className="font-medium text-brand-600 dark:text-brand-400">{pagination?.total || 0}</span> questions
                                </p>
                            </div>
                        </div>

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
                                onApprove={(id) => approveQuestionMutation.mutate(id)}
                                isAdmin={true}
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
                )}
            </div>

            {/* Question Form Dialog - Context aware, simplified */}
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
        </>
    );
}
