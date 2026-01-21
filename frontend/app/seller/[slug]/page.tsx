import SellerProfile from './SellerProfile';
import { notFound } from 'next/navigation';
import { getCarIdFromSlug } from '@/lib/utils';

async function getSellerProfile(id: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/users/${id}/profile`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch seller profile", error);
        return null;
    }
}

export default async function SellerPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const id = getCarIdFromSlug(slug);
    const seller = await getSellerProfile(id);

    if (!seller) {
        notFound();
    }

    return <SellerProfile seller={seller} />;
}
