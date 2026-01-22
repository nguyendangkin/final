

import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Mail, Phone, MapPin, Clock, Users, Car, Heart } from 'lucide-react';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Giới Thiệu & Chính Sách | 4Gach",
    description: "Tìm hiểu về 4Gach, quy định đăng tin, chính sách bảo mật và cộng đồng xe JDM Việt Nam.",
    alternates: {
        canonical: "/info",
    },
};

export default function InfoPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Header */}
            <div className="bg-black text-white py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
                    </Link>
                    <h1 className="text-4xl font-black uppercase tracking-tight">
                        Thông Tin <span className="text-[var(--jdm-red)]">4Gach - JDM</span>
                    </h1>
                    <p className="mt-4 text-gray-400 max-w-2xl">
                        Nền tảng mua bán xe JDM (Japanese Domestic Market) hàng đầu Việt Nam.
                        Kết nối cộng đồng đam mê xe Nhật.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
                {/* About Section */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Car className="w-6 h-6 text-[var(--jdm-red)]" />
                        Về Chúng Tôi.
                    </h2>
                    <div className="bg-white p-6 border border-gray-200 shadow-sm">
                        <p className="text-gray-700 leading-relaxed mb-4">
                            <strong>4Gach - JDM</strong> là nền tảng chuyên biệt dành cho cộng đồng yêu thích xe Nhật tại Việt Nam.
                            Chúng tôi cung cấp một nơi đáng tin cậy để mua bán các dòng xe JDM từ Toyota, Honda, Nissan,
                            Mazda và nhiều thương hiệu Nhật Bản khác.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-gray-50 p-4 text-center">
                                <Users className="w-8 h-8 mx-auto text-[var(--jdm-red)] mb-2" />
                                <p className="text-sm text-gray-700">Gồm các thành viên đam mê xe JDM</p>
                            </div>
                            <div className="bg-gray-50 p-4 text-center">
                                <Car className="w-8 h-8 mx-auto text-[var(--jdm-red)] mb-2" />
                                <p className="text-sm text-gray-700">Và nhiều các xe đang được bày bán</p>
                            </div>
                            <div className="bg-gray-50 p-4 text-center">
                                <Heart className="w-8 h-8 mx-auto text-[var(--jdm-red)] mb-2" />
                                <p className="font-bold text-lg">100%</p>
                                <p className="text-sm text-gray-500">Đam mê JDM</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Policies Section */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Shield className="w-6 h-6 text-[var(--jdm-red)]" />
                        Chính Sách
                    </h2>
                    <div className="space-y-4">
                        {/* Terms of Use */}
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                Điều Khoản Sử Dụng
                            </h3>
                            <ul className="text-gray-700 space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Người dùng phải cung cấp thông tin chính xác khi đăng tin bán xe.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Nghiêm cấm đăng tin rao bán xe không có thật, thông tin sai lệch, hoặc nội dung nhạy cảm. Vi phạm sẽ bị gỡ bài hoặc cấm tài khoản vĩnh viễn mà không cần báo trước.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Mọi giao dịch giữa người mua và người bán là trách nhiệm của hai bên.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    4Gach chỉ là nền tảng kết nối, không chịu trách nhiệm về chất lượng xe.
                                </li>
                            </ul>
                        </div>

                        {/* Privacy Policy */}
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-gray-500" />
                                Chính Sách Bảo Mật
                            </h3>
                            <ul className="text-gray-700 space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Thông tin cá nhân của bạn được bảo mật tuyệt đối.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Chúng tôi không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Dữ liệu được mã hóa và lưu trữ an toàn theo tiêu chuẩn bảo mật.
                                </li>
                            </ul>
                        </div>

                        {/* Posting Rules */}
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                <Car className="w-5 h-5 text-gray-500" />
                                Quy Định Đăng Tin
                            </h3>
                            <ul className="text-gray-700 space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Thông tin xe phải chính xác: năm sản xuất, số km, tình trạng giấy tờ.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[var(--jdm-red)] font-bold">•</span>
                                    Tin đăng vi phạm sẽ bị xóa và tài khoản có thể bị khóa.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Mail className="w-6 h-6 text-[var(--jdm-red)]" />
                        Liên Hệ
                    </h2>
                    <div className="bg-white p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black flex items-center justify-center">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                <a href="mailto:kinnguyendang@gmail.com" className="text-black hover:text-[var(--jdm-red)] font-medium">
                                    kinnguyendang@gmail.com
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Back Button */}
                <div className="text-center pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-black hover:bg-[var(--jdm-red)] text-white px-8 py-3 font-bold uppercase tracking-wider transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
