import CarDetail from './CarDetail';
import { notFound } from 'next/navigation';
import { getCarIdFromSlug } from '@/lib/utils';
import type { Metadata, ResolvingMetadata } from 'next';

async function getCar(id: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/cars/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch car", error);
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id: slug } = await params;
    const id = getCarIdFromSlug(slug);
    const car = await getCar(id);

    if (!car) {
        return {
            title: 'Không tìm thấy xe',
            description: 'Tin đăng bán xe không tồn tại hoặc đã bị xóa.',
        };
    }

    const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(car.price);
    const title = `${car.year} ${car.make} ${car.model} ${car.trim || ''} - ${price}`;
    const description = `Cần bán xe ${car.year} ${car.make} ${car.model}. ${car.description ? car.description.substring(0, 150).replace(/\n/g, ' ') + '...' : ''}`;

    // Prioritize thumbnail, then first image, then fallback
    const images = car.thumbnail
        ? [car.thumbnail]
        : (car.images && car.images.length > 0 ? [car.images[0]] : []);

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: images,
            type: 'article',
            url: `http://localhost:3001/cars/${slug}`,
            siteName: 'Chợ xe JDM',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: images,
        },
    };
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: slug } = await params;
    const id = getCarIdFromSlug(slug);
    const car = await getCar(id);

    if (!car) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Vehicle',
        name: `${car.year} ${car.make} ${car.model}`,
        image: car.images || [],
        description: car.description,
        brand: {
            '@type': 'Brand',
            name: car.make,
        },
        model: car.model,
        vehicleConfiguration: car.trim,
        productionDate: car.year,
        offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'VND',
            itemCondition: 'https://schema.org/UsedCondition',
            availability: car.status === 'SOLD' ? 'https://schema.org/Sold' : 'https://schema.org/InStock',
            url: `http://localhost:3001/cars/${slug}`,
            seller: {
                '@type': 'Person',
                name: car.seller?.name || 'Người bán ẩn danh',
            },
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
                }}
            />
            <CarDetail car={car} />
        </>
    );
}
