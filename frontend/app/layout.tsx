import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "4Gach - Sàn Mua Bán Xe JDM & Thể Thao Tại Việt Nam",
    template: "%s | 4Gach - JDM Market",
  },
  description: "4Gach là nền tảng chuyên biệt số 1 Việt Nam để mua bán các dòng xe JDM và xe thể thao Nhật Bản (Toyota, Nissan, Honda, Mazda, Mitsubishi, Subaru). Kết nối đam mê, giao dịch uy tín.",
  keywords: ["JDM", "xe JDM", "mua bán xe JDM", "xe thể thao Nhật", "chợ xe JDM", "Nissan GTR", "Toyota Supra", "Honda Civic Type R", "Mazda RX7", "Subaru WRX STI", "Mitsubishi Evo", "xe độ", "xe cũ"],
  authors: [{ name: "4Gach Team" }],
  creator: "4Gach Team",
  publisher: "4Gach Team",
  openGraph: {
    title: "4Gach - Sàn Mua Bán Xe JDM Đỉnh Cao",
    description: "Nơi mua bán xe JDM và xe thể thao Nhật Bản uy tín nhất Việt Nam. Tham gia cộng đồng ngay hôm nay.",
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    siteName: "4Gach JDM Market",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // Make sure to serve a default OG image if possible, or user needs to add one
        width: 1200,
        height: 630,
        alt: "4Gach JDM Market",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4Gach - Sàn Mua Bán Xe JDM Đỉnh Cao",
    description: "Mua bán xe JDM uy tín tại Việt Nam.",
    creator: "@4gach_jdm",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Header />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '4Gach JDM',
              url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            className: 'rounded-none font-bold border border-gray-200 shadow-lg',
            style: {
              borderRadius: '0px',
              padding: '16px',
              color: '#000',
              background: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#000',
                secondary: '#fff',
              },
              style: {
                borderLeft: '4px solid #10B981',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
              style: {
                borderLeft: '4px solid #EF4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
