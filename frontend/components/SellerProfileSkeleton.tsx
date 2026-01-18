import { Skeleton } from "@/components/ui/Skeleton";
import CarCardSkeleton from "@/components/CarCardSkeleton";

export default function SellerProfileSkeleton() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header Skeleton */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-center gap-6">
                        <Skeleton className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="w-64 h-10 bg-gray-200" />
                            <div className="flex flex-wrap items-center gap-4">
                                <Skeleton className="w-24 h-5" />
                                <Skeleton className="w-32 h-5" />
                                <Skeleton className="w-48 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cars Listings Skeleton */}
                <div className="mb-6">
                    <Skeleton className="w-48 h-8 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <CarCardSkeleton key={i} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
