import Link from 'next/link';
import TokenHandler from '../components/TokenHandler';
import CarFeed from '@/components/CarFeed';

async function getCars(searchParams: any) {
  try {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '12');

    // Safely append search params
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        }
      });
    }

    const res = await fetch(`http://localhost:3000/cars?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch cars", error);
    return [];
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const cars = await getCars(resolvedSearchParams);

  return (
    <div className="min-h-screen bg-white text-black p-6 pt-20 selection:bg-red-500/30">
      <TokenHandler />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-black tracking-tighter uppercase">
              Chợ xe <span className="text-[var(--jdm-red)]">JDM</span>
            </h1>
            <p className="text-gray-600 mt-2">Tìm kiếm huyền thoại trong mơ của bạn.</p>
          </div>
          <Link href="/sell" className="px-6 py-3 rounded-none bg-[var(--jdm-red)] hover:bg-red-700 text-white font-bold transition transform hover:scale-105 shadow-md uppercase tracking-wide">
            Đăng bán xe ngay
          </Link>
        </div>

        <CarFeed initialCars={cars} />
      </div>
    </div>
  );
}
