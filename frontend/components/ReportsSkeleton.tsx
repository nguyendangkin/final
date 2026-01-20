import { Skeleton } from "@/components/ui/Skeleton";

export default function ReportsSkeleton() {
    return (
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-black text-white">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[20%]">Người tố cáo</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[25%]">Xe bị tố cáo</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[20%]">Người bán</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[15%]">Lý do</th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider w-[20%]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="ml-4 space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <Skeleton className="h-16 w-24 rounded-none" />
                                        <div className="ml-4 space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        <Skeleton className="h-5 w-20 rounded-none" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-2">
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-20" />
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
