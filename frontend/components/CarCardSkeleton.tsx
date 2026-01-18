import { Skeleton } from "@/components/ui/Skeleton";

export default function CarCardSkeleton() {
    return (
        <div className="group relative bg-white border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Image Placeholder */}
            <div className="relative aspect-[16/9] w-full bg-gray-100">
                <Skeleton className="h-full w-full" />
                {/* Badge Placeholder */}
                <div className="absolute top-2 left-2">
                    <Skeleton className="h-6 w-20" />
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>

                <div className="flex-1" />

                {/* Price and Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </div>
        </div>
    );
}
