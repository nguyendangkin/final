import { Skeleton } from "@/components/ui/Skeleton";

export default function AnnouncementSkeleton() {
    return (
        <div className="bg-white border border-gray-200 p-4 mb-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>
        </div>
    );
}
