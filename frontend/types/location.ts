import type { Category } from './category';
import type { User } from './user';

export interface Location {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    image: string | null;
    note: string | null;
    isPublic: boolean;
    categoryId: string | null;
    category?: Category;
    userId: string;
    user?: User;
    likeCount?: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LocationsResponse {
    data: Location[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateLocationDto {
    name: string;
    latitude: number;
    longitude: number;
    note?: string;
    categoryId?: string;
    isPublic?: boolean;
}

export type UpdateLocationDto = Partial<CreateLocationDto>;

export interface FilterLocationDto {
    search?: string;
    categoryId?: string;
    isPublic?: boolean;
    page?: number;
    limit?: number;
}
