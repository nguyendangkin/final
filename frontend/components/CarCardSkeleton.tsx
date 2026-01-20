import { Skeleton } from "@/components/ui/Skeleton";

export default function CarCardSkeleton() {
    return (
        <div className="group relative bg-white border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Image Placeholder */}
            <div className="relative aspect-[4/3] w-full bg-gray-100">
                <Skeleton className="h-full w-full" />
                {/* Badge Placeholder */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-5 flex flex-col flex-1">
                {/* Title */}
                <div className="mb-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-[1.5fr_1fr] gap-y-2 gap-x-4 mb-4 flex-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                </div>

                {/* Price and Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-8" />
                </div>
            </div>
        </div>
    );
}
