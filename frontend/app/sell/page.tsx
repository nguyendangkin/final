import { Metadata } from 'next';
import SellClient from './SellClient';

export const metadata: Metadata = {
    title: "Đăng Bán Xe | 4Gach",
    description: "Đăng bán xe JDM của bạn miễn phí. Tiếp cận cộng đồng đam mê xe lớn nhất Việt Nam. Quy trình đơn giản, nhanh chóng.",
    alternates: {
        canonical: "/sell",
    },
};

export default function SellPage() {
    return <SellClient />;
}
