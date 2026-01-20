import { Skeleton } from "@/components/ui/Skeleton";
import CarCardSkeleton from "@/components/CarCardSkeleton";

export default function SellerProfileSkeleton() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header Skeleton */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-none shadow-sm" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-48 h-8 rounded-none" />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <Skeleton className="w-20 h-4 rounded-none" />
                                <Skeleton className="w-24 h-4 rounded-none" />
                                <Skeleton className="w-32 h-4 rounded-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                    <div className="pb-3 relative">
                        <Skeleton className="w-24 h-5 mb-1 bg-gray-300" />
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300"></div>
                    </div>
                    <div className="pb-3">
                        <Skeleton className="w-20 h-5 mb-1" />
                    </div>
                </div>

                {/* Cars Listings Skeleton */}
                <div className="mb-6">
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
