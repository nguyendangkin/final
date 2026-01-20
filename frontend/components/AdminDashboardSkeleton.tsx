import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
                    <div className="px-4 py-5 sm:px-6 bg-black text-white">
                        <Skeleton className="h-7 w-48 mb-2 bg-gray-700" />
                        <Skeleton className="h-4 w-64 bg-gray-700" />
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <Skeleton className="h-8 w-64 mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="border border-gray-200 p-4 h-full">
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
