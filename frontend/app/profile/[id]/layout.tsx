import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://icheck.app';

interface PublicUser {
    id: string;
    displayName: string;
    avatar: string | null;
    createdAt: string;
}

async function getUser(userId: string): Promise<PublicUser | null> {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/public`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const user = await getUser(id);

    if (!user) {
        return {
            title: 'Không tìm thấy người dùng',
            description: 'Người dùng này không tồn tại hoặc đã bị xóa.',
        };
    }

    const title = `${user.displayName} - Profile`;
    const description = `Xem profile và các địa điểm của ${user.displayName} trên iCheck - Sổ tay Bản đồ Cá nhân.`;
    const profileUrl = `${BASE_URL}/profile/${user.id}`;

    return {
        title,
        description,
        openGraph: {
            type: 'profile',
            title,
            description,
            url: profileUrl,
            siteName: 'iCheck',
            locale: 'vi_VN',
            images: user.avatar
                ? [
                    {
                        url: user.avatar,
                        width: 400,
                        height: 400,
                        alt: user.displayName,
                    },
                ]
                : [],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: user.avatar ? [user.avatar] : [],
        },
        alternates: {
            canonical: profileUrl,
        },
    };
}

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
