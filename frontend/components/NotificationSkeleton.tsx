import { Skeleton } from "@/components/ui/Skeleton";

export default function NotificationSkeleton() {
    return (
        <div className="bg-white border border-gray-200 p-4 mb-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    {/* Title */}
                    <Skeleton className="h-5 w-3/4" />

                    {/* Message */}
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>

                    {/* Date */}
                    <Skeleton className="h-3 w-32" />
                </div>

                {/* Icon/Status placeholder */}
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
        </div>
    );
}
