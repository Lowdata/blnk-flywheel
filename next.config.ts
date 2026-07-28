import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/(.*)',
                headers: [
                    // Clickjacking protection
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // Prevent MIME-type sniffing
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Referrer information policy
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Disable permissions not needed
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                    // Basic XSS filter for older browsers
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    // HSTS — enforce HTTPS for 1 year
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                ],
            },
            {
                // Long-lived cache for immutable 3D assets
                source: '/assets/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                // Cache public GLBs
                source: '/:file*.glb',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
                ],
            },
        ];
    },
};

export default nextConfig;
