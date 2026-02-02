import { IPagination } from './common';

// Enums
export enum EQuestionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
}

// Interfaces
export interface IQuestionBankCategory {
    id: string;
    name: string;
    isActive: boolean;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface IQuestionAnswer {
    id: string;
    question: string;
    answer: string;
    isActive: boolean;
    status: EQuestionStatus;
    createdById: string;
    categories: IQuestionBankCategory[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface ICreateCategoryPayload {
    name: string;
}

export interface ICreateCategoryAdminPayload {
    name: string;
    userId: string;
}

export interface IUpdateCategoryPayload {
    name: string;
}

export interface ICreateQuestionPayload {
    question: string;
    answer: string;
    categoryIds: string[];
}

export interface ICreateQuestionAdminPayload {
    question: string;
    answer: string;
    categoryIds: string[];
    userId: string;
}

export interface IUpdateQuestionPayload {
    question?: string;
    answer?: string;
    categoryIds?: string[];
}

export interface IQuestionBankFilters {
    search?: string;
    status?: EQuestionStatus;
    isActive?: 'true' | 'false';
    userId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
}

export interface ICategoryFilters {
    search?: string;
    isActive?: 'true' | 'false';
    userId?: string;
    page?: number;
    limit?: number;
}

// Filter type definitions following filters.d.ts pattern
type StringFilter = {
    label: string;
    placeholder: string;
    type: 'string';
};

type SelectFilter = {
    label: string;
    placeholder: string;
    type: 'select';
    values: Array<{ label: string; value: string | number }>;
};

export type IQuestionBankFilterTypes = {
    search?: StringFilter;
    status?: SelectFilter;
    isActive?: SelectFilter;
    userId?: SelectFilter;
    categoryId?: SelectFilter;
};

export type ICategoryFilterTypes = {
    search?: StringFilter;
    isActive?: SelectFilter;
    userId?: SelectFilter;
};

// Response interfaces using IPagination
export interface IPaginatedQuestionResponse {
    success: boolean;
    message: string;
    data: IQuestionAnswer[];
    filters?: IQuestionBankFilterTypes;
    pagination: IPagination;
}

export interface IPaginatedCategoryResponse {
    success: boolean;
    message: string;
    data: IQuestionBankCategory[];
    filters?: ICategoryFilterTypes;
    pagination: IPagination;
}

export interface ISerializedQuestion {
    question: string; // "Q1: What is...?"
    answer: string;   // "A1: The answer is..."
}

export interface ISerializedQuestionsResponse {
    success: boolean;
    message: string;
    data: ISerializedQuestion[];
}
