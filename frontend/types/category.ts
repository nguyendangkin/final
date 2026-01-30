export interface Category {
    id: string;
    name: string;
    icon: string | null;
    iconColor: string | null;
    parentId: string | null;
    parent?: Category;
    children?: Category[];
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryCount {
    categoryId: string;
    count: number;
}

export interface CreateCategoryDto {
    name: string;
    icon?: string;
    iconColor?: string;
    parentId?: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
