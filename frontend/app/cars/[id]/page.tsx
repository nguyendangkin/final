import CarDetail from './CarDetail';
import { notFound } from 'next/navigation';

async function getCar(id: string) {
    try {
        const res = await fetch(`http://localhost:3000/cars/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch car", error);
        return null;
    }
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const car = await getCar(id);

    if (!car) {
        notFound();
    }

    return <CarDetail car={car} />;
}
