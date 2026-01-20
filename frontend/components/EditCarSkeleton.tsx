import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from 'lucide-react';

export default function EditCarSkeleton() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Images Section */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <Skeleton className="h-6 w-32 mb-6" />

                        {/* Thumbnail */}
                        <div className="mb-6">
                            <Skeleton className="h-5 w-48 mb-2" />
                            <Skeleton className="w-full h-64 rounded-none" />
                        </div>

                        {/* Album */}
                        <div>
                            <Skeleton className="h-5 w-32 mb-2" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-square rounded-none" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i}>
                                    <Skeleton className="h-5 w-24 mb-2" />
                                    <Skeleton className="h-12 w-full rounded-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
