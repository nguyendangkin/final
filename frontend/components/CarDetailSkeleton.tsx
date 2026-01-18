import { Skeleton } from './ui/Skeleton';

export default function CarDetailSkeleton() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb Skeleton */}
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-16 h-4" />
                    <span className="text-gray-300">/</span>
                    <Skeleton className="w-24 h-4" />
                    <span className="text-gray-300">/</span>
                    <Skeleton className="w-32 h-4" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Image Gallery Skeleton */}
                        <div className="bg-white rounded-none overflow-hidden shadow-sm border border-gray-100">
                            <div className="relative aspect-[16/9]">
                                <Skeleton className="w-full h-full" />
                            </div>

                            {/* Thumbnails */}
                            <div className="p-4 grid grid-cols-5 md:grid-cols-6 gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-square w-full" />
                                ))}
                            </div>
                        </div>

                        {/* Title & Key Specs Mobile Skeleton */}
                        <div className="lg:hidden bg-white p-6 rounded-none shadow-sm border border-gray-100">
                            <Skeleton className="w-3/4 h-8 mb-2" />
                            <Skeleton className="w-1/2 h-8" />
                        </div>

                        {/* Specs Skeleton */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <Skeleton className="w-48 h-8 mb-6" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="w-20 h-3" />
                                        <Skeleton className="w-24 h-6" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description Skeleton */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <Skeleton className="w-48 h-8 mb-4" />
                            <div className="space-y-3">
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-3/4 h-4" />
                            </div>
                        </div>

                        {/* Legal Info Skeleton */}
                        <div className="bg-gray-50 p-6 md:p-8 rounded-none border border-gray-100">
                            <Skeleton className="w-48 h-8 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10" />
                                    <div className="space-y-1">
                                        <Skeleton className="w-24 h-3" />
                                        <Skeleton className="w-32 h-5" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10" />
                                    <div className="space-y-1">
                                        <Skeleton className="w-24 h-3" />
                                        <Skeleton className="w-32 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">

                            {/* Price Card Skeleton */}
                            <div className="bg-white p-6 rounded-none shadow-lg border border-gray-100">
                                <div className="border-b border-gray-100 pb-4 mb-4 space-y-2">
                                    <Skeleton className="w-3/4 h-8" />
                                    <Skeleton className="w-1/2 h-6" />
                                </div>

                                <div className="mb-6 space-y-2">
                                    <Skeleton className="w-20 h-3" />
                                    <Skeleton className="w-2/3 h-10" />
                                </div>

                                <div className="space-y-3">
                                    <Skeleton className="w-full h-12" />
                                    <Skeleton className="w-full h-12" />
                                </div>
                            </div>

                            {/* Seller Info Skeleton */}
                            <div className="bg-white p-6 rounded-none shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <Skeleton className="w-14 h-14" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="w-32 h-6" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-3 space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="w-20 h-4" />
                                        <Skeleton className="w-16 h-4" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="w-20 h-4" />
                                        <Skeleton className="w-24 h-4" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
