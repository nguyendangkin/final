import { Skeleton } from "@/components/ui/Skeleton";

interface TableSkeletonProps {
    type?: 'users' | 'cars';
}

export default function TableSkeleton({ type = 'cars' }: TableSkeletonProps) {
    const isUsers = type === 'users';
    const columns = isUsers ? 5 : 6;

    return (
        <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[...Array(columns)].map((_, i) => (
                                <th key={i} scope="col" className="px-6 py-3 text-left">
                                    <Skeleton className="h-4 w-24" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[...Array(8)].map((_, row) => (
                            <tr key={row}>
                                {/* Col 1: Image/Identity */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isUsers ? (
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    ) : (
                                        <Skeleton className="h-16 w-24 rounded-sm" />
                                    )}
                                </td>

                                {/* Col 2: Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>

                                {/* Col 3 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-4 w-24" />
                                </td>

                                {/* Col 4 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isUsers ? (
                                        <Skeleton className="h-6 w-20 rounded-full" /> // Status for Users
                                    ) : (
                                        <Skeleton className="h-4 w-20" />             // Text for Cars
                                    )}
                                </td>

                                {/* Col 5 */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isUsers ? (
                                        // Users Action Col (Col 5)
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-20" />
                                        </div>
                                    ) : (
                                        // Cars Status Col (Col 5)
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    )}
                                </td>

                                {/* Col 6 (Cars only) */}
                                {!isUsers && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
