import { MetadataRoute } from 'next';
import { generateCarSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'http://localhost:3001';

    // Fetch cars
    let cars = [];
    try {
        const res = await fetch('http://localhost:3000/cars?limit=1000', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            cars = data.data || [];
        }
    } catch (e) {
        console.error('Failed to fetch cars for sitemap', e);
    }

    const carUrls = cars.map((car: any) => ({
        url: `${baseUrl}/cars/${generateCarSlug(car)}`,
        lastModified: car.updatedAt || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/sell`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/info`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...carUrls,
    ];
}
