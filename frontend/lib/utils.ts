export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Normalize specialized characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

export function generateCarSlug(car: any): string {
    const name = `${car.year} ${car.make} ${car.model}`;
    const slug = slugify(name);
    return `${slug}-${car.id}`;
}

export function getCarIdFromSlug(slug: string): string {
    // UUID regex pattern
    const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const match = slug.match(uuidPattern);
    return match ? match[0] : slug; // Return uuid if found, else return slug (fallback)
}

export function generateSellerSlug(seller: any): string {
    const name = seller.name || seller.email || 'seller';
    const slug = slugify(name);
    return `${slug}-${seller.id}`;
}

export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

