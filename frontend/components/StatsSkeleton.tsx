import { Skeleton } from "@/components/ui/Skeleton";

export default function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Users Stats Skeleton */}
            <div className="bg-gray-50 p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-12" />
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-8" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Cars Stats Skeleton */}
            <div className="bg-gray-50 p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-12" />
                </div>
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-8" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
