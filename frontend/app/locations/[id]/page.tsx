'use client';

import { useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ArrowLeft, Pencil, Trash2, Navigation, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { locationsApi } from '@/lib/api';
import { useMapPersistence } from '@/components/providers';
import { useAuthStore } from '@/lib/stores';
import { Spinner, toast } from '@/components/ui';
import type { Location } from '@/types';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuthStore();
    const { fetchLocations: refreshMapLocations } = useMapPersistence();

    const [location, setLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const data = await locationsApi.getById(id);
                setLocation(data);
            } catch {
                toast.error('Không tìm thấy địa điểm');
                router.push('/locations');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLocation();
    }, [id, router]);

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;

        setIsDeleting(true);
        try {
            await locationsApi.delete(id);
            await refreshMapLocations(); // Sync global map state
            toast.success('Đã xóa địa điểm');
            router.push('/locations');
        } catch {
            toast.error('Không thể xóa địa điểm');
        } finally {
            setIsDeleting(false);
        }
    };



    const openGoogleMaps = () => {
        if (!location) return;
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
            '_blank'
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!location) return null;

    const isOwner = user?.id === location.userId;

    return (
        <div className="max-w-3xl mx-auto pb-24">
            {/* Header Image - Same width as card, rounded, with spacing */}
            {/* Back button - always visible */}
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">Chi tiết địa điểm</h1>
                </div>
            </div>

            {/* Image - only if exists */}
            {location.image && (
                <div className="px-4 pt-3">
                    <div className="relative rounded-2xl overflow-hidden">
                        <Image
                            src={`${API_URL}${location.image}`}
                            alt={location.name}
                            width={800}
                            height={400}
                            className="w-full h-auto"
                            priority
                        />
                    </div>
                </div>
            )}

            {/* Content - Below image, not overlapping */}
            <div className="px-4 mt-4">
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5">
                    {/* Title & Category */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{location.name}</h1>
                            {location.category && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: `${location.category.iconColor}20`,
                                            color: location.category.iconColor || '#0d9488',
                                        }}
                                    >
                                        {location.category.icon}{' '}
                                        {location.category.parent
                                            ? `${location.category.parent.name} › ${location.category.name}`
                                            : location.category.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {location.isPublic ? (
                                <Globe className="w-4 h-4 text-teal-500" />
                            ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(location.createdAt), 'dd MMM yyyy', { locale: vi })}
                        </div>
                    </div>

                    {/* Note */}
                    {location.note && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                            <p className="text-gray-700 whitespace-pre-wrap">{location.note}</p>
                        </div>
                    )}

                    {/* GPS */}
                    <div className="mt-4 p-4 bg-teal-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-teal-600" />
                            <div>
                                <p className="text-sm font-medium text-teal-900">Tọa độ GPS</p>
                                <p className="text-xs text-teal-700">
                                    {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={openGoogleMaps}
                            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
                        >
                            <Navigation className="w-5 h-5" />
                            Mở Google Maps
                        </button>



                        {isOwner && (
                            <div className="flex gap-3">
                                <Link
                                    href={`/locations/${location.id}/edit`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Sửa
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
