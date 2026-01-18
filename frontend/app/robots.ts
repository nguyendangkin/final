import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'http://localhost:3001';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/login/', '/wallet/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
