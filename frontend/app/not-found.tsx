import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - Không tìm thấy trang | 4Gach JDM',
};

export default function NotFound() {
    return (
        <div className="min-h-[80vh] pt-16 flex flex-col items-center justify-center bg-white text-black px-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-[var(--jdm-red)] tracking-tighter select-none">
                    404
                </h1>
                <div className="space-y-2 mt-4">
                    <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">
                        Lạc đường thôi
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị tháo dỡ.
                    </p>
                </div>

                <div className="mt-10">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 bg-black hover:bg-[var(--jdm-red)] text-white text-sm font-bold uppercase tracking-widest transition-colors duration-300"
                    >
                        Về vạch xuất phát
                    </Link>
                </div>
            </div>
        </div>
    );
}
