import Link from 'next/link';
import TokenHandler from '../components/TokenHandler';

async function getCars() {
  try {
    const res = await fetch('http://localhost:3000/cars', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch cars", error);
    return [];
  }
}

export default async function Home() {
  const cars = await getCars();

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

        {cars.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-none shadow-lg border border-gray-200">
            <p className="text-gray-500 text-lg">Chưa có xe nào được đăng bán. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car: any) => (
              <Link key={car.id} href={`/cars/${car.id}`} className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-[var(--jdm-red)]">
                <div className="relative h-64 overflow-hidden">
                  {car.thumbnail || (car.images && car.images.length > 0) ? (
                    <img src={car.thumbnail || car.images[0]} alt={car.model} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                      Không có hình ảnh
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-[var(--jdm-red)] px-3 py-1 rounded-none text-white font-bold shadow-md">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(car.price))}
                  </div>
                  {car.status === 'SOLD' && (
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-black/90 border-l-4 border-[var(--jdm-red)] px-3 py-1 shadow-md">
                        <span className="text-white font-bold text-xs uppercase tracking-wider">ĐÃ BÁN</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-black group-hover:text-[var(--jdm-red)] transition-colors">{car.year} {car.make} {car.model}</h2>
                  <p className="text-gray-600 mt-3 text-sm line-clamp-2 h-10">{car.description}</p>
                  <div className="mt-6 flex justify-between items-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      {car.mileage} km
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {car.location}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
