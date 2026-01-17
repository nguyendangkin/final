import SellerProfile from './SellerProfile';
import { notFound } from 'next/navigation';

async function getSellerProfile(id: string) {
    try {
        const res = await fetch(`http://localhost:3000/users/${id}/profile`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch seller profile", error);
        return null;
    }
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const seller = await getSellerProfile(id);

    if (!seller) {
        notFound();
    }

    return <SellerProfile seller={seller} />;
}
