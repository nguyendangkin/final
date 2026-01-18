import { Skeleton } from './ui/Skeleton';

export default function WalletSkeleton() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Skeleton className="w-48 h-5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Wallet Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-black rounded-none p-8 shadow-xl border border-gray-900 h-64 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-2">
                                    <Skeleton className="w-24 h-4 bg-gray-800" />
                                    <Skeleton className="w-64 h-12 bg-gray-800" />
                                </div>
                                <Skeleton className="w-12 h-12 bg-gray-800" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-12 w-full bg-gray-800" />
                                <Skeleton className="h-12 w-full bg-gray-800" />
                            </div>
                        </div>

                        {/* Recent Transactions Placeholder */}
                        <div className="bg-white rounded-none p-6 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <Skeleton className="w-48 h-6" />
                                <Skeleton className="w-24 h-4" />
                            </div>

                            <div className="py-10 space-y-4">
                                <Skeleton className="w-full h-12" />
                                <Skeleton className="w-full h-12" />
                                <Skeleton className="w-full h-12" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-none p-6 shadow-sm border border-gray-200 space-y-4">
                            <Skeleton className="w-40 h-6 mb-4" />
                            <div className="space-y-1">
                                <Skeleton className="w-24 h-3" />
                                <Skeleton className="w-32 h-6" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="w-24 h-3" />
                                <Skeleton className="w-48 h-5" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="w-24 h-3" />
                                <Skeleton className="w-32 h-6" />
                            </div>
                        </div>

                        {/* Help / Support */}
                        <div className="bg-black rounded-none p-6 shadow-lg border border-gray-900 space-y-4">
                            <Skeleton className="w-32 h-6 bg-gray-800" />
                            <Skeleton className="w-full h-10 bg-gray-800" />
                            <Skeleton className="w-full h-10 bg-gray-800" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
