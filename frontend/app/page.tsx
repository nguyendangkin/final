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

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Trang Chủ | Chợ Xe JDM Số 1 Việt Nam",
  description: "Duyệt hàng trăm tin đăng bán xe JDM, xe thể thao Nhật Bản. Tìm kiếm các mẫu xe huyền thoại như Supra, GTR, Civic Type R, RX-7.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const cars = await getCars(resolvedSearchParams);

  return (
    <div className="min-h-screen bg-white text-black p-6 pt-20 selection:bg-red-500/30">
      <TokenHandler />
      <div className="max-w-7xl mx-auto">


        <CarFeed initialCars={cars} />
      </div>
    </div>
  );
}
