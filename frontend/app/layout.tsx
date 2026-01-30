import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider, MapPersistenceProvider, PWAInstallProvider } from "@/components/providers";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://icheck.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#14b8a6',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "iCheck - Sổ tay Bản đồ Cá nhân",
    template: "%s | iCheck",
  },
  description: "Google Maps là bản đồ của mọi người, còn đây là bản đồ của riêng bạn. Lưu trữ, ghi chú và quản lý những địa điểm yêu thích của bạn.",
  keywords: ["bản đồ cá nhân", "ghi chú địa điểm", "địa điểm yêu thích", "personal map", "location notes", "iCheck"],
  authors: [{ name: "iCheck Team" }],
  creator: "iCheck",
  publisher: "iCheck",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: baseUrl,
    siteName: "iCheck",
    title: "iCheck - Sổ tay Bản đồ Cá nhân",
    description: "Google Maps là bản đồ của mọi người, còn đây là bản đồ của riêng bạn.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "iCheck - Sổ tay Bản đồ Cá nhân",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iCheck - Sổ tay Bản đồ Cá nhân",
    description: "Google Maps là bản đồ của mọi người, còn đây là bản đồ của riêng bạn.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14b8a6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="iCheck" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <AuthProvider>
          <PWAInstallProvider>
            <MapPersistenceProvider>
              {children}
            </MapPersistenceProvider>
          </PWAInstallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

