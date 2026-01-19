import { Skeleton } from "@/components/ui/Skeleton";

export default function TagsSkeleton() {
    // Predefined widths to avoid hydration mismatch (no Math.random())
    const categories = [
        [80, 100, 70, 90, 110, 75, 95, 85],      // Category 1: 8 tags
        [90, 75, 105, 80, 95, 70],               // Category 2: 6 tags
        [85, 100, 70, 95, 80, 110, 75, 90, 105, 85] // Category 3: 10 tags
    ];

    return (
        <div className="space-y-8">
            {categories.map((tagWidths, catIndex) => (
                <div key={catIndex}>
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-6" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tagWidths.map((width, tagIndex) => (
                            <Skeleton
                                key={tagIndex}
                                className="h-8"
                                style={{ width: `${width}px` }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

