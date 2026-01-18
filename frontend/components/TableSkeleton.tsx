import { Skeleton } from "@/components/ui/Skeleton";

export default function TableSkeleton() {
    return (
        <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <th key={i} scope="col" className="px-6 py-3 text-left">
                                    <Skeleton className="h-4 w-24" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                            <tr key={row}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-4 w-24" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-4 w-20" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
