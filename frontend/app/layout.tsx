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
  title: "4Gach - JDM - Chợ xe JDM Đỉnh Cao",
  description: "Nơi mua bán xe JDM uy tín nhất Việt Nam",
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
