export interface User {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}
