import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'iCheck - Sổ tay Bản đồ Cá nhân';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #059669 50%, #0d9488 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 120,
                        height: 120,
                        borderRadius: 24,
                        background: 'rgba(255, 255, 255, 0.2)',
                        marginBottom: 32,
                    }}
                >
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: 'white',
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        iCheck
                    </h1>
                    <p
                        style={{
                            fontSize: 28,
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: '16px 0 0 0',
                            textAlign: 'center',
                            maxWidth: 600,
                        }}
                    >
                        Sổ tay Bản đồ Cá nhân
                    </p>
                </div>

                {/* Tagline */}
                <p
                    style={{
                        fontSize: 20,
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: 24,
                        textAlign: 'center',
                        maxWidth: 700,
                    }}
                >
                    Google Maps là bản đồ của mọi người, còn đây là bản đồ của riêng bạn
                </p>
            </div>
        ),
        {
            ...size,
        }
    );
}
