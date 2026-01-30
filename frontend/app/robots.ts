import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://icheck.app'

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/profile/*', '/login'],
                disallow: [
                    '/api/',
                    '/auth/',
                    '/locations/*',
                    '/categories/*',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
